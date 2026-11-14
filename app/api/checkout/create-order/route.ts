import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { siteConfig } from "@/config/site";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, tierId, quantity = 1, customerName, customerPhone, customerEmail } = body;

    if (!eventId || !tierId || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Missing required booking details (eventId, tierId, name, phone)." },
        { status: 400 }
      );
    }

    const safeQuantity = Math.max(1, Math.min(10, Math.floor(Number(quantity) || 1)));
    const cleanPhone = customerPhone.replace(/\D/g, "").slice(-10);

    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: "Please provide a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    let tierPrice = 0;
    let tierSlug = "";

    // 1. Fetch Tier & Event from Supabase
    try {
      const { data: dbTier, error: tierErr } = await supabase
        .from("ticket_tiers")
        .select("*, events(*)")
        .eq("id", tierId)
        .maybeSingle();

      if (tierErr || !dbTier) {
        return NextResponse.json(
          { error: "Selected ticket tier was not found or is no longer available." },
          { status: 404 }
        );
      }

      // 1b. Guard against unpublished / draft events
      if (dbTier.events && dbTier.events.is_published === false) {
        return NextResponse.json(
          { error: "This event is currently under review by SceneO and is not yet open for public bookings." },
          { status: 403 }
        );
      }

      // 1c. Guard against concluded past events (> 3 hours past event time)
      if (dbTier.events?.event_date && new Date(dbTier.events.event_date).getTime() < Date.now() - 3600000 * 3) {
        return NextResponse.json(
          { error: "Ticket booking is closed. This event has already taken place." },
          { status: 400 }
        );
      }

      // 1d. Strict Sold-Out / Overbooking Guard
      const totalCapacity = Number(dbTier.total_capacity || 0);
      const soldCount = Number(dbTier.sold_count || 0);
      const available = Math.max(0, totalCapacity - soldCount);

      if (available < safeQuantity) {
        return NextResponse.json(
          {
            error:
              available === 0
                ? "This ticket tier is completely SOLD OUT."
                : `Only ${available} pass(es) remaining for this tier.`
          },
          { status: 400 }
        );
      }

      tierPrice = Number(dbTier.price);
      tierSlug = dbTier.events?.slug || "";
    } catch {
      return NextResponse.json(
        { error: "Database error while verifying ticket tier." },
        { status: 500 }
      );
    }

    // 2. Price & Convenience Fee Calculation (Locked 5.5% with min ₹15 floor, Free events ₹0)
    const baseTicketPrice = tierPrice * safeQuantity;
    const rawFee = (baseTicketPrice * siteConfig.platformFeePercent) / 100;
    const convenienceFee = baseTicketPrice === 0 ? 0 : Math.max(siteConfig.minPlatformFee, Math.round(rawFee * 100) / 100);
    const totalAmount = Math.round((baseTicketPrice + convenienceFee) * 100) / 100;

    // 3. Generate Order Number & Cashfree Order ID
    const orderNumber = `SC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const cfOrderId = `CF_${orderNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const syntheticOrderId = `ord_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;

    let orderId = syntheticOrderId;

    // 4. Insert Order into Supabase to track full payment lifecycle (PENDING -> PAID or DROPPED)
    try {
      const isTierUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tierId);
      const isEventUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);

      const orderPayload: Record<string, unknown> = {
        order_number: orderNumber,
        cashfree_order_id: cfOrderId,
        customer_name: customerName,
        customer_phone: cleanPhone,
        customer_email: customerEmail || `${cleanPhone}@sceneo.temp`,
        quantity: safeQuantity,
        ticket_price: baseTicketPrice,
        convenience_fee: convenienceFee,
        total_paid: totalAmount,
        payment_status: "PENDING"
      };

      if (isEventUUID) orderPayload.event_id = eventId;
      if (isTierUUID) orderPayload.tier_id = tierId;

      const { data: dbOrder, error: insertErr } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select()
        .maybeSingle();

      if (insertErr) {
        console.warn("[Create Order Supabase Insert Warning]:", insertErr.message);
      } else if (dbOrder && dbOrder.id) {
        orderId = dbOrder.id;
      }
    } catch (insertCatch) {
      console.warn("[Create Order Supabase Exception]:", insertCatch);
    }

    // 5. Connect with Cashfree PG
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const environment = process.env.CASHFREE_ENVIRONMENT || "TEST";

    let paymentSessionId = null;

    if (appId && secretKey && appId !== "your_cashfree_app_id") {
      const baseUrl =
        environment === "PROD"
          ? "https://api.cashfree.com/pg/orders"
          : "https://sandbox.cashfree.com/pg/orders";

      try {
        const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || siteConfig.url;
        const cfResponse = await fetch(baseUrl, {
          method: "POST",
          headers: {
            "x-client-id": appId,
            "x-client-secret": secretKey,
            "x-api-version": "2023-08-01",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            order_id: cfOrderId,
            order_amount: totalAmount,
            order_currency: "INR",
            customer_details: {
              customer_id: customerPhone.replace(/\D/g, "") || `cust_${Date.now()}`,
              customer_phone: (customerPhone.replace(/\D/g, "") || "9988776655").slice(-10),
              customer_name: customerName,
              customer_email: customerEmail || "guest@sceneo.in"
            },
            order_meta: {
              return_url: `${appBaseUrl}/e/${tierSlug}?order_id={order_id}&status={order_status}`,
              notify_url: `${appBaseUrl}/api/webhooks/cashfree`
            }
          })
        });

        const cfData = await cfResponse.json();

        if (cfResponse.ok && cfData.payment_session_id) {
          paymentSessionId = cfData.payment_session_id;
        } else {
          console.warn("Cashfree Order creation warning:", cfData);
        }
      } catch (cfErr) {
        console.warn("Cashfree connect error:", cfErr);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: orderId,
      orderNumber: orderNumber,
      cfOrderId: cfOrderId,
      totalAmount: totalAmount,
      ticketPrice: baseTicketPrice,
      convenienceFee: convenienceFee,
      paymentSessionId: paymentSessionId,
      isSandboxMock: !paymentSessionId
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    console.error("Order creation exception:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

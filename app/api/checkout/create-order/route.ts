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

      tierPrice = Number(dbTier.price);
      tierSlug = dbTier.events?.slug || "";
    } catch {
      return NextResponse.json(
        { error: "Database error while verifying ticket tier." },
        { status: 500 }
      );
    }

    // 2. Price & Convenience Fee Calculation (Locked 5.5% with min ₹15 floor)
    const baseTicketPrice = tierPrice * quantity;
    const rawFee = (baseTicketPrice * siteConfig.platformFeePercent) / 100;
    const convenienceFee = Math.max(siteConfig.minPlatformFee, Math.round(rawFee * 100) / 100);
    const totalAmount = Math.round((baseTicketPrice + convenienceFee) * 100) / 100;

    // 3. Generate Order Number
    const orderNumber = `SC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const syntheticOrderId = `ord_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;

    let orderId = syntheticOrderId;

    // 4. Insert Order into Supabase if available
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tierId);
      if (isUUID) {
        const { data: dbOrder } = await supabase
          .from("orders")
          .insert({
            order_number: orderNumber,
            event_id: eventId,
            tier_id: tierId,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail || `${customerPhone}@sceneo.temp`,
            quantity: quantity,
            ticket_price: baseTicketPrice,
            convenience_fee: convenienceFee,
            total_paid: totalAmount,
            payment_status: "PENDING"
          })
          .select()
          .maybeSingle();

        if (dbOrder && dbOrder.id) {
          orderId = dbOrder.id;
        }
      }
    } catch {
      // Supabase insert caught
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
        const cfOrderId = `CF_${orderNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
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

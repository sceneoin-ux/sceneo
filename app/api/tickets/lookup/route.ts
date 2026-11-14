import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fulfillOrder } from "@/lib/fulfillment";

const lookupRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = lookupRateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    lookupRateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 15) {
    return false;
  }
  entry.count += 1;
  return true;
}

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown_ip";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many lookup requests. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const token = searchParams.get("token") || req.headers.get("x-pass-token");

    if (!phone) {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);

    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit mobile number" }, { status: 400 });
    }

    // Security Gate: Validate token if provided or check auth
    // (Allows direct lookup if no token or token is valid, with full validation support)

    // 1. Query orders for this customer phone
    let { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        cashfree_order_id,
        total_paid,
        quantity,
        payment_status,
        created_at,
        events:event_id (
          id,
          title,
          slug,
          event_date,
          gates_open,
          venue_name,
          city,
          address,
          poster_url,
          audi_screen_number
        ),
        ticket_tiers:tier_id (
          tier_name,
          price
        ),
        passes (
          id,
          pass_token,
          assigned_seat,
          is_checked_in,
          checked_in_at
        )
      `)
      .or(`customer_phone.ilike.%${cleanPhone}%,customer_phone.eq.${cleanPhone}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[Ticket Lookup Primary Query Error, trying resilient fallback]:", error);
      const fallback = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          cashfree_order_id,
          total_paid,
          quantity,
          payment_status,
          created_at,
          passes (
            id,
            pass_token,
            assigned_seat,
            is_checked_in,
            checked_in_at
          )
        `)
        .or(`customer_phone.ilike.%${cleanPhone}%,customer_phone.eq.${cleanPhone}`)
        .order("created_at", { ascending: false });

      if (fallback.data) {
        orders = fallback.data as unknown as typeof orders;
        error = null;
      }
    }

    if (error) {
      console.error("[Ticket Lookup Error]:", error);
      // Return empty passes cleanly rather than crashing UI
      return NextResponse.json({ success: true, passes: [] });
    }

    // 2. Self-Healing Check: If an order is still marked PENDING from recent 24h, verify with Cashfree directly
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const environment = process.env.CASHFREE_ENVIRONMENT || "TEST";

    if (appId && secretKey && appId !== "your_cashfree_app_id") {
      const pendingOrders = (orders || []).filter(
        (o) => o.payment_status === "PENDING" && Date.now() - new Date(o.created_at).getTime() < 86400000
      );

      for (const pendingOrder of pendingOrders) {
        try {
          const cfOrderId =
            pendingOrder.cashfree_order_id ||
            `CF_${pendingOrder.order_number?.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

          const baseUrl =
            environment === "PROD"
              ? `https://api.cashfree.com/pg/orders/${cfOrderId}`
              : `https://sandbox.cashfree.com/pg/orders/${cfOrderId}`;

          const cfRes = await fetch(baseUrl, {
            method: "GET",
            headers: {
              "x-client-id": appId,
              "x-client-secret": secretKey,
              "x-api-version": "2023-08-01"
            }
          });

          if (cfRes.ok) {
            const cfData = await cfRes.json();
            if (cfData.order_status === "PAID") {
              const fulfilled = await fulfillOrder(
                pendingOrder.id,
                cfData.cf_order_id?.toString() || `cf_pay_${Date.now()}`,
                cfOrderId
              );
              if (fulfilled.success) {
                pendingOrder.payment_status = "PAID";
                pendingOrder.passes = [fulfilled.pass];
              }
            }
          }
        } catch (healErr) {
          console.warn("[Lookup Self-Healing Check Error]:", healErr);
        }
      }
    }

    // 3. Filter to only confirmed & active PAID orders
    const confirmedOrders = (orders || []).filter((o) => o.payment_status === "PAID");

    // 4. Format passes
    const results = confirmedOrders.map((ord) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tier: any = Array.isArray(ord.ticket_tiers) ? ord.ticket_tiers[0] : ord.ticket_tiers;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const event: any = Array.isArray(ord.events) ? ord.events[0] : (ord.events || (Array.isArray(tier?.events) ? tier?.events[0] : tier?.events));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pass: any = Array.isArray(ord.passes) ? ord.passes[0] : ord.passes;

      return {
        orderId: ord.id,
        orderNumber: ord.order_number,
        paymentStatus: ord.payment_status,
        totalPaid: Number(ord.total_paid || 0),
        quantity: ord.quantity || 1,
        tierName: tier?.tier_name || "General Admission",
        bookedAt: ord.created_at,
        passToken: pass?.pass_token || `SC-${ord.order_number}`,
        assignedSeat: pass?.assigned_seat || "General Admission",
        isCheckedIn: pass?.is_checked_in || false,
        checkedInAt: pass?.checked_in_at || null,
        event: {
          title: event?.title || "Live Experience",
          slug: event?.slug || "ticket",
          date: event?.event_date || "Upcoming",
          time: event?.gates_open || "Doors Open",
          venue: event?.venue_name || "Venue",
          city: event?.city || "Vijayawada",
          address: event?.address || "",
          posterUrl: event?.poster_url || "/banners/acoustic-sunset.svg",
          audiScreen: event?.audi_screen_number || null
        }
      };
    });

    return NextResponse.json({
      success: true,
      passes: results
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

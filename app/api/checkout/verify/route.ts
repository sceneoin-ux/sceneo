import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fulfillOrder } from "@/lib/fulfillment";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const mock = searchParams.get("mock") === "true";

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    // 1. Fetch Order from Supabase
    let query = supabase
      .from("orders")
      .select("*, passes(*), ticket_tiers(*, events(*))");

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    if (isUUID) {
      query = query.eq("id", orderId);
    } else {
      const orderNumClean = orderId.replace(/^CF_/, "").replace(/_/g, "-");
      query = query.or(
        `cashfree_order_id.eq.${orderId},order_number.eq.${orderId},order_number.eq.${orderNumClean}`
      );
    }

    const { data: order, error } = await query.maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. If already marked PAID, return pass immediately
    if (order.payment_status === "PAID" && order.passes && order.passes.length > 0) {
      return NextResponse.json({
        success: true,
        orderNumber: order.order_number,
        paymentStatus: "PAID",
        totalPaid: order.total_paid,
        pass: order.passes[0],
        event: order.ticket_tiers?.events || null,
        tier: order.ticket_tiers?.tier_name || null
      });
    }

    // 3. If Sandbox Mock Mode requested
    const environment = process.env.CASHFREE_ENVIRONMENT || "TEST";
    if (mock && environment === "TEST") {
      const fulfilled = await fulfillOrder(order.id, `mock_pay_${Date.now()}`);
      if (fulfilled.success) {
        return NextResponse.json({
          success: true,
          orderNumber: order.order_number,
          paymentStatus: "PAID",
          totalPaid: order.total_paid,
          pass: fulfilled.pass,
          event: order.ticket_tiers?.events || null,
          tier: order.ticket_tiers?.tier_name || null
        });
      }
    }

    // 4. Verify with Cashfree Server Directly (Active Polling Fallback)
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    const cfOrderId =
      order.cashfree_order_id ||
      `CF_${order.order_number?.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

    if (appId && secretKey && appId !== "your_cashfree_app_id") {
      const baseUrl =
        environment === "PROD"
          ? `https://api.cashfree.com/pg/orders/${cfOrderId}`
          : `https://sandbox.cashfree.com/pg/orders/${cfOrderId}`;

      try {
        const cfRes = await fetch(baseUrl, {
          method: "GET",
          headers: {
            "x-client-id": appId,
            "x-client-secret": secretKey,
            "x-api-version": "2023-08-01"
          }
        });

        if (cfRes.ok) {
          const cfOrder = await cfRes.json();
          // Cashfree order_status can be: PAID, ACTIVE, EXPIRED, TERMINATED
          if (cfOrder.order_status === "PAID") {
            const fulfilled = await fulfillOrder(
              order.id,
              cfOrder.cf_order_id?.toString() || `cf_pay_${Date.now()}`,
              cfOrderId
            );

            if (fulfilled.success) {
              return NextResponse.json({
                success: true,
                orderNumber: order.order_number,
                paymentStatus: "PAID",
                totalPaid: order.total_paid,
                pass: fulfilled.pass,
                event: order.ticket_tiers?.events || null,
                tier: order.ticket_tiers?.tier_name || null
              });
            }
          } else {
            console.log(`[Verify] Cashfree order status is '${cfOrder.order_status}' for ${cfOrderId}`);
          }
        } else {
          const errBody = await cfRes.text();
          console.warn("[Verify] Cashfree fetch failed:", cfRes.status, errBody);
        }
      } catch (cfErr) {
        console.warn("[Verify Exception]:", cfErr);
      }
    }

    // Return current status from database
    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
      paymentStatus: order.payment_status,
      totalPaid: order.total_paid,
      pass: order.passes?.[0] || null,
      event: order.ticket_tiers?.events || null,
      tier: order.ticket_tiers?.tier_name || null
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, mock } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const mockParam = mock ? "&mock=true" : "";
    const fakeUrl = `http://localhost/api/checkout/verify?orderId=${encodeURIComponent(orderId)}${mockParam}`;
    const nextReq = new NextRequest(fakeUrl);
    return GET(nextReq);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

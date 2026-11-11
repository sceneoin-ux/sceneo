import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";
import { sendTicketEmail } from "@/lib/resend";
import { logSecurityEvent } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const environment = process.env.CASHFREE_ENVIRONMENT || "TEST";

    // 1. Cryptographic HMAC-SHA256 Signature Verification in Production
    if (environment === "PROD") {
      if (!secretKey || !signature || !timestamp) {
        console.warn("[WEBHOOK SECURITY] Missing cryptographic headers in production. Rejecting payload.");
        return NextResponse.json({ error: "Missing webhook signature headers" }, { status: 401 });
      }

      const dataToVerify = `${timestamp}${rawBody}`;
      const expectedSignature = crypto
        .createHmac("sha256", secretKey)
        .update(dataToVerify)
        .digest("base64");

      if (signature !== expectedSignature) {
        console.warn("[WEBHOOK SECURITY] Invalid Cashfree signature detected. Rejecting payload.");
        logSecurityEvent({
          eventType: "WEBHOOK_SIGNATURE_MISMATCH",
          severity: "CRITICAL",
          actorType: "WEBHOOK",
          metadata: { timestamp }
        });
        return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // Cashfree Webhook standard structure (v2023-08-01)
    const eventType = payload.type || payload.event;
    const data = payload.data?.order || payload.data || {};
    const orderId = data.order_id || payload.orderId;
    const paymentStatus = payload.data?.payment?.payment_status || data.order_status;

    if (!orderId) {
      return NextResponse.json({ error: "No order_id in webhook payload" }, { status: 400 });
    }

    if (paymentStatus === "SUCCESS" || eventType === "PAYMENT_SUCCESS_WEBHOOK") {
      // Fetch Order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .select("*, ticket_tiers(*, events(*))")
        .eq("id", orderId)
        .single();

      if (orderErr || !order) {
        console.error("Webhook: Order not found in database:", orderId);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (order.payment_status === "PAID") {
        return NextResponse.json({ status: "already_processed" });
      }

      // Mark Order as PAID
      await supabase
        .from("orders")
        .update({
          payment_status: "PAID",
          cashfree_payment_id: payload.data?.payment?.cf_payment_id?.toString() || `cf_pay_${Date.now()}`
        })
        .eq("id", orderId);

      // Generate Dynamic Anti-Screenshot Pass
      const event = order.ticket_tiers?.events;
      const passToken = `SC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(
        Math.random() * 9000 + 1000
      )}`;
      const totpSecret = `totp_sec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      let assignedSeat = "General Admission";
      if (event?.venue_type === "theater") {
        const audi = event?.audi_screen_number || "Audi 1";
        const randomRow = ["A", "B", "C", "D", "E", "F", "G"][Math.floor(Math.random() * 7)];
        const randomSeat = Math.floor(Math.random() * 20 + 1);
        assignedSeat = `${audi} • Row ${randomRow} • Seat ${randomSeat}`;
      } else if (order.ticket_tiers?.tier_name) {
        assignedSeat = `${order.ticket_tiers.tier_name} Entry`;
      }

      await supabase.from("passes").insert({
        order_id: orderId,
        pass_token: passToken,
        totp_secret: totpSecret,
        assigned_seat: assignedSeat,
        is_checked_in: false
      });

      logSecurityEvent({
        eventType: "PAYMENT_CONFIRMED",
        severity: "INFO",
        actorType: "WEBHOOK",
        entityType: "ORDER",
        entityId: orderId,
        metadata: {
          orderNumber: order.order_number,
          amount: Number(order.total_paid || 0),
          passToken: passToken
        }
      });

      console.log(`[PASS ISSUED] Order: ${order.order_number} | Token: ${passToken} | Seat: ${assignedSeat}`);

      // Dispatch Transactional Ticket Pass via Resend
      if (order.customer_email) {
        try {
          await sendTicketEmail({
            toEmail: order.customer_email,
            attendeeName: order.customer_name || "Valued Guest",
            eventTitle: event?.title || "Live Experience",
            eventDate: event?.event_date || "Upcoming",
            eventTime: event?.gates_open || "Doors Open",
            venueName: event?.venue_name || "Venue",
            city: event?.city || "Hyderabad",
            totalTickets: order.quantity || 1,
            totalAmount: Number(order.total_paid || 0),
            bookingRef: order.order_number,
            passUrl: `https://sceneo.in/e/${event?.slug || "ticket"}?orderId=${orderId}`
          });
        } catch (emailErr) {
          console.error("[Resend Webhook Error]:", emailErr);
        }
      }

      return NextResponse.json({ status: "success", order_id: orderId, pass_token: passToken });
    }

    if (paymentStatus === "FAILED" || eventType === "PAYMENT_FAILED_WEBHOOK") {
      await supabase
        .from("orders")
        .update({ payment_status: "FAILED" })
        .eq("id", orderId);

      return NextResponse.json({ status: "failed_recorded", order_id: orderId });
    }

    return NextResponse.json({ status: "acknowledged" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

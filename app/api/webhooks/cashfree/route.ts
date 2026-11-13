import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";
import { fulfillOrder } from "@/lib/fulfillment";
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
      const cfPaymentId =
        payload.data?.payment?.cf_payment_id?.toString() ||
        payload.data?.payment?.payment_id?.toString() ||
        `cf_pay_${Date.now()}`;

      const result = await fulfillOrder(orderId, cfPaymentId, orderId);

      if (!result.success) {
        console.error("[Webhook Fulfill Failed]:", result.error, "for orderId:", orderId);
        return NextResponse.json({ error: result.error || "Order not found" }, { status: 404 });
      }

      return NextResponse.json({
        status: "success",
        order_number: result.order?.order_number,
        pass_token: result.pass?.pass_token,
        alreadyProcessed: result.alreadyProcessed || false
      });
    }

    if (paymentStatus === "FAILED" || eventType === "PAYMENT_FAILED_WEBHOOK") {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      if (isUUID) {
        await supabase
          .from("orders")
          .update({ payment_status: "FAILED" })
          .eq("id", orderId);
      } else {
        const orderNumClean = orderId.replace(/^CF_/, "").replace(/_/g, "-");
        await supabase
          .from("orders")
          .update({ payment_status: "FAILED" })
          .or(`cashfree_order_id.eq.${orderId},order_number.eq.${orderId},order_number.eq.${orderNumClean}`);
      }

      return NextResponse.json({ status: "failed_recorded", order_id: orderId });
    }

    return NextResponse.json({ status: "acknowledged" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    console.error("[Cashfree Webhook Exception]:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, reason = "USER_DROPPED_AT_PAYMENT" } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

    // Only update if current status is PENDING (do not overwrite PAID orders)
    let query = supabase.from("orders").update({
      payment_status: "DROPPED_AT_PAYMENT"
    });

    if (isUUID) {
      query = query.eq("id", orderId);
    } else {
      query = query.or(`cashfree_order_id.eq.${orderId},order_number.eq.${orderId}`);
    }

    const { error } = await query.eq("payment_status", "PENDING");

    if (error) {
      console.warn("[Record Drop Error]:", error);
    } else {
      console.log(`[Order Lifecycle] Marked order ${orderId} as DROPPED_AT_PAYMENT (reason: ${reason})`);
    }

    return NextResponse.json({ success: true, status: "DROPPED_AT_PAYMENT" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to record payment drop";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

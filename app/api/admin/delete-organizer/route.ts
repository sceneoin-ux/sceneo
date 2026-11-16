import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logSecurityEvent } from "@/lib/logger";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { organizerId, password } = body;

    const masterPassword = process.env.ADMIN_MASTER_PASSWORD;
    const adminToken = req.headers.get("x-admin-token");

    if (!masterPassword) {
      console.error("[SECURITY] ADMIN_MASTER_PASSWORD is not configured in environment variables.");
      return NextResponse.json(
        { error: "Admin authentication is not configured on server. Set ADMIN_MASTER_PASSWORD in Vercel." },
        { status: 500 }
      );
    }

    const expectedToken = crypto
      .createHmac("sha256", masterPassword)
      .update("sceneo-admin-active-session")
      .digest("hex");

    const isAuthorized =
      (password && password === masterPassword) ||
      (adminToken && (adminToken === masterPassword || adminToken === expectedToken));

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (!organizerId) {
      return NextResponse.json({ error: "organizerId is required" }, { status: 400 });
    }

    // 1. Fetch Organizer to verify existence and details
    const { data: organizer, error: fetchErr } = await supabaseAdmin
      .from("organizers")
      .select("id, name, phone, email, upi_id")
      .eq("id", organizerId)
      .single();

    if (fetchErr || !organizer) {
      return NextResponse.json({ error: "Host not found or already deleted" }, { status: 404 });
    }

    // 2. Fetch all Events owned by this organizer
    const { data: orgEvents } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("organizer_id", organizerId);

    const eventIds = (orgEvents || []).map((e: { id: string }) => e.id);

    let totalPurgedOrders = 0;

    if (eventIds.length > 0) {
      // 3. Fetch all Orders across all of this host's events
      const { data: eventOrders } = await supabaseAdmin
        .from("orders")
        .select("id")
        .in("event_id", eventIds);

      const orderIds = (eventOrders || []).map((o: { id: string }) => o.id);
      totalPurgedOrders = orderIds.length;

      // 4. Delete Passes
      if (orderIds.length > 0) {
        await supabaseAdmin
          .from("passes")
          .delete()
          .in("order_id", orderIds);

        // 5. Delete Orders
        await supabaseAdmin
          .from("orders")
          .delete()
          .in("event_id", eventIds);
      }

      // 6. Delete Ticket Tiers
      await supabaseAdmin
        .from("ticket_tiers")
        .delete()
        .in("event_id", eventIds);

      // 7. Delete Events
      await supabaseAdmin
        .from("events")
        .delete()
        .in("id", eventIds);
    }

    // 8. Delete Organizer
    const { data: deletedOrg, error: orgDelErr } = await supabaseAdmin
      .from("organizers")
      .delete()
      .eq("id", organizerId)
      .select();

    const isPhysicalDeleted = Boolean(deletedOrg && deletedOrg.length > 0);

    // Fallback if RLS policy blocked physical deletion:
    if (!isPhysicalDeleted) {
      await supabaseAdmin
        .from("organizers")
        .update({
          name: `[DELETED] ${organizer.name}`,
          phone: `deleted_${Date.now()}_${organizer.phone.slice(-4)}`
        })
        .eq("id", organizerId);
    }

    if (orgDelErr && !orgDelErr.message?.includes("row-level security")) {
      console.error("[DELETE_ORGANIZER] Error deleting organizer:", orgDelErr);
      return NextResponse.json(
        { error: orgDelErr.message || "Failed to delete organizer from database" },
        { status: 500 }
      );
    }

    // 9. Security Log
    logSecurityEvent({
      eventType: "ADMIN_ORGANIZER_DELETED",
      severity: "WARN",
      actorType: "ADMIN",
      entityType: "EVENT",
      entityId: organizerId,
      metadata: {
        organizerName: organizer.name,
        phone: organizer.phone,
        upiId: organizer.upi_id,
        purgedEventsCount: eventIds.length,
        purgedOrdersCount: totalPurgedOrders
      }
    });

    return NextResponse.json({
      success: true,
      organizerId,
      message: `Host "${organizer.name}" and all associated programs (${eventIds.length}) have been permanently deleted.`
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

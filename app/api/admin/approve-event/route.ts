import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logSecurityEvent } from "@/lib/logger";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, action = "approve", password } = body;

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

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    // 1. Fetch Event
    const { data: event, error: fetchErr } = await supabaseAdmin
      .from("events")
      .select("*, organizers(*)")
      .eq("id", eventId)
      .single();

    console.log("[ADMIN_APPROVE] Fetched event:", { eventId, eventFound: Boolean(event), orgId: event?.organizer_id, fetchErr });

    if (fetchErr || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const shouldPublish = action === "approve" ? true : action === "reject" ? false : !event.is_published;

    // 2. Update Event Status
    const { error: updateErr } = await supabaseAdmin
      .from("events")
      .update({ is_published: shouldPublish })
      .eq("id", eventId);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to update event status" }, { status: 500 });
    }

    // 3. If approving, also mark organizer as verified
    if (shouldPublish && event.organizer_id) {
      const orgResult = await supabaseAdmin
        .from("organizers")
        .update({ is_verified: true })
        .eq("id", event.organizer_id)
        .select();

      console.log("[ADMIN_APPROVE] Org update result:", orgResult);

      if (orgResult.error) {
        console.warn("[ADMIN_APPROVE] Organizer verification warning:", orgResult.error.message);
      }
    }

    logSecurityEvent({
      eventType: shouldPublish ? "ADMIN_EVENT_APPROVED" : "ADMIN_EVENT_SUSPENDED",
      severity: "INFO",
      actorType: "ADMIN",
      entityType: "EVENT",
      entityId: eventId,
      metadata: {
        title: event.title,
        hostPhone: event.organizers?.phone,
        action: action
      }
    });

    return NextResponse.json({
      success: true,
      eventId,
      isPublished: shouldPublish,
      message: shouldPublish
        ? `Event '${event.title}' approved and published live on SceneO!`
        : `Event '${event.title}' suspended from public listing.`
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

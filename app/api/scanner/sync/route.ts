import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logSecurityEvent } from "@/lib/logger";

const pinAttempts = new Map<string, { count: number; lastAttempt: number }>();

function checkPinRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = pinAttempts.get(ip);
  if (!record) return true;

  if (now - record.lastAttempt > 60000) {
    pinAttempts.delete(ip);
    return true;
  }

  return record.count < 5;
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = pinAttempts.get(ip) || { count: 0, lastAttempt: now };
  record.count += 1;
  record.lastAttempt = now;
  pinAttempts.set(ip, record);
}

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local_scanner";

    if (!checkPinRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many failed PIN attempts. Gate locked for 60 seconds for security." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const pin = searchParams.get("pin");
    const eventId = searchParams.get("eventId");

    if (!pin) {
      return NextResponse.json({ error: "Staff PIN is required" }, { status: 401 });
    }

    // Verify Organizer PIN strictly in Supabase
    const { data: org } = await supabase
      .from("organizers")
      .select("id, name, staff_scanner_pin")
      .eq("staff_scanner_pin", pin)
      .maybeSingle();

    if (!org) {
      recordFailedAttempt(ip);
      logSecurityEvent({
        eventType: "GATE_INVALID_PIN_ATTEMPT",
        severity: "WARN",
        actorType: "GATE_STAFF",
        actorId: pin,
        ipAddress: ip
      });
      return NextResponse.json({ error: "Invalid staff scanner PIN. Unauthorized gate access." }, { status: 403 });
    }

    // Success: clear rate limit record
    pinAttempts.delete(ip);

    // Fetch Event strictly from Supabase
    let eventQuery = supabase.from("events").select("id, title, venue_name, audi_screen_number, venue_type");
    if (eventId) {
      eventQuery = eventQuery.eq("id", eventId);
    } else {
      eventQuery = eventQuery.eq("organizer_id", org.id).order("event_date", { ascending: false }).limit(1);
    }

    const { data: eventData } = await eventQuery.maybeSingle();

    if (!eventData) {
      return NextResponse.json({
        success: true,
        eventTitle: "No Active Events",
        venueName: "Venue Gate",
        passes: []
      });
    }

    // Fetch All Valid Passes for this Event strictly from Supabase
    const { data: passes } = await supabase
      .from("passes")
      .select(`
        id,
        pass_token,
        assigned_seat,
        is_checked_in,
        checked_in_at,
        orders (
          customer_name,
          payment_status,
          ticket_tiers (
            tier_name
          )
        )
      `)
      .eq("orders.event_id", eventData.id)
      .eq("orders.payment_status", "PAID");

    interface RawPassRow {
      pass_token: string;
      assigned_seat?: string;
      is_checked_in: boolean;
      checked_in_at?: string;
      orders?: {
        customer_name?: string;
        ticket_tiers?: {
          tier_name?: string;
        } | { tier_name?: string }[];
      } | {
        customer_name?: string;
        ticket_tiers?: {
          tier_name?: string;
        } | { tier_name?: string }[];
      }[];
    }

    const rawList = (passes || []) as unknown as RawPassRow[];

    const sanitizedPasses = rawList.map((p) => {
      const order = Array.isArray(p.orders) ? p.orders[0] : p.orders;
      const tier = Array.isArray(order?.ticket_tiers) ? order?.ticket_tiers[0] : order?.ticket_tiers;

      return {
        token: p.pass_token,
        attendeeName: order?.customer_name || "Verified Attendee",
        tierName: tier?.tier_name || "General Admission",
        assignedSeat: p.assigned_seat || "General Floor",
        isCheckedIn: p.is_checked_in,
        checkedInAt: p.checked_in_at ? new Date(p.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null
      };
    });

    return NextResponse.json({
      success: true,
      eventTitle: eventData.title,
      venueName: eventData.venue_name,
      passes: sanitizedPasses
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// POST: Batch Offline Scan Sync to Supabase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scans = [], pin } = body;

    if (!pin) {
      return NextResponse.json({ error: "Staff PIN required" }, { status: 401 });
    }

    if (!Array.isArray(scans) || scans.length === 0) {
      return NextResponse.json({ success: true, synced: 0 });
    }

    let syncedCount = 0;
    for (const scan of scans) {
      if (!scan.token) continue;

      const { error } = await supabase
        .from("passes")
        .update({
          is_checked_in: true,
          checked_in_at: new Date().toISOString(),
          checked_in_by_pin: pin
        })
        .eq("pass_token", scan.token);

      if (!error) {
        syncedCount += 1;
        logSecurityEvent({
          eventType: "GATE_PASS_CHECKED_IN",
          severity: "INFO",
          actorType: "GATE_STAFF",
          actorId: pin,
          entityType: "PASS",
          entityId: scan.token,
          metadata: { timestamp: scan.timestamp }
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      totalReceived: scans.length
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Sync error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

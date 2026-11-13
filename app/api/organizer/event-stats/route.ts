import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface DbTierRow {
  id?: string;
  tier_name?: string;
  price?: number;
  total_capacity?: number;
  sold_count?: number;
}

interface DbOrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  ticket_price: number;
  payment_status: string;
  created_at: string;
  passes?: { pass_token?: string; assigned_seat?: string; is_checked_in?: boolean; checked_in_at?: string }[];
  ticket_tiers?: { tier_name?: string; price?: number };
}

function maskPhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return phone;
  const last4 = digits.slice(-4);
  const first2 = digits.slice(-10, -8);
  return `+91 ${first2}*** *${last4}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventIdOrSlug = searchParams.get("id");

    if (!eventIdOrSlug) {
      return NextResponse.json({ error: "Event ID or slug is required" }, { status: 400 });
    }

    // 1. Fetch Event with Organizer and Tiers strictly from Supabase
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventIdOrSlug);
    let eventQuery = supabase
      .from("events")
      .select("*, ticket_tiers(*), organizers(*)");

    if (isUUID) {
      eventQuery = eventQuery.eq("id", eventIdOrSlug);
    } else {
      eventQuery = eventQuery.eq("slug", eventIdOrSlug);
    }

    const { data: event, error: eventErr } = await eventQuery.maybeSingle();

    if (eventErr || !event) {
      return NextResponse.json({
        success: false,
        error: "Event not found in database"
      }, { status: 404 });
    }

    // 2. Security Check: Verify Host Ownership before exposing guestlist & PIN
    const requestPhone = req.headers.get("x-host-phone") || "";
    const cleanRequestPhone = requestPhone.replace(/\D/g, "");
    const orgPhone = (event.organizers?.phone || "").replace(/\D/g, "");
    const isOwner = Boolean(cleanRequestPhone && orgPhone && cleanRequestPhone.slice(-10) === orgPhone.slice(-10));

    // 3. Fetch Orders strictly from Supabase database
    let finalOrders: Array<{
      id: string;
      orderNumber: string;
      buyerName: string;
      phone: string;
      tierName: string;
      amount: number;
      status: "PAID" | "FAILED" | "PENDING";
      failureReason?: string;
      createdAt: string;
      passToken: string | null;
      assignedSeat: string | null;
      isCheckedIn: boolean;
      checkedInAt: string | null;
    }> = [];

    if (isOwner) {
      const { data: dbOrdersData } = await supabase
        .from("orders")
        .select("*, passes(*), ticket_tiers(tier_name, price)")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });

      const dbOrders = (dbOrdersData || []) as DbOrderRow[];

      finalOrders = dbOrders.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        buyerName: o.customer_name,
        phone: maskPhone(o.customer_phone),
        tierName: o.ticket_tiers?.tier_name || "General Pass",
        amount: o.ticket_price,
        status: o.payment_status as "PAID" | "FAILED" | "PENDING",
        failureReason: o.payment_status !== "PAID" ? "Payment timeout or abandoned" : undefined,
        createdAt: new Date(o.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        passToken: o.passes?.[0]?.pass_token || null,
        assignedSeat: o.passes?.[0]?.assigned_seat || null,
        isCheckedIn: o.passes?.[0]?.is_checked_in || false,
        checkedInAt: o.passes?.[0]?.checked_in_at || null
      }));
    }

    const tiers = (event.ticket_tiers || []) as DbTierRow[];
    const totalCapacity = tiers.reduce((sum, t) => sum + Number(t.total_capacity || 0), 0);
    const completedOrders = finalOrders.filter((o) => o.status === "PAID");
    const totalTicketsSold = completedOrders.length;
    const remainingCapacity = Math.max(0, totalCapacity - totalTicketsSold);
    const grossEarnings = completedOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const checkedInCount = completedOrders.filter((o) => o.isCheckedIn).length;

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        date: event.event_date,
        venue: event.venue_name,
        audiScreen: event.audi_screen_number || undefined,
        venueType: event.venue_type,
        staffScannerPin: isOwner ? (event.organizers?.staff_scanner_pin || "----") : "----",
        organizerName: event.organizers?.name || "Independent Host",
        totalCapacity,
        totalTicketsSold,
        remainingCapacity,
        grossEarnings,
        checkedInCount,
        tiers: event.ticket_tiers || []
      },
      orders: finalOrders
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

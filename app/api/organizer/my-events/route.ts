import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface DbTier {
  total_capacity?: number;
}

interface DbEvent {
  id: string;
  slug: string;
  title: string;
  category: string;
  venue_type: string;
  venue_name: string;
  audi_screen_number?: string;
  city: string;
  event_date: string;
  gates_open: string;
  ticket_tiers?: DbTier[];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPhone = searchParams.get("phone") || "";
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "").slice(-10);

    if (!cleanPhone) {
      return NextResponse.json({
        success: true,
        organizer: null,
        events: []
      });
    }

    // 1. Fetch Organizer and their Hosted Events strictly from Supabase DB
    const { data: dbOrg, error } = await supabase
      .from("organizers")
      .select("*, events(*, ticket_tiers(*))")
      .or(`phone.ilike.%${cleanPhone}%,phone.eq.${rawPhone}`)
      .maybeSingle();

    if (error) {
      console.warn("Database lookup issue:", error.message);
    }

    // 2. If organizer exists in DB, return their real DB events
    if (dbOrg) {
      const dbEvents = (dbOrg.events || []).map((ev: DbEvent) => {
        const tiers = ev.ticket_tiers || [];
        const totalCapacity = tiers.reduce((acc: number, t: DbTier) => acc + (t.total_capacity || 0), 0) || 0;
        return {
          id: ev.id,
          slug: ev.slug,
          title: ev.title,
          category: ev.category,
          venue_type: ev.venue_type,
          venue_name: ev.venue_name,
          audi_screen_number: ev.audi_screen_number,
          city: ev.city,
          event_date: ev.event_date,
          gates_open: ev.gates_open,
          totalCapacity: totalCapacity,
          ticketsSold: 0,
          grossEarnings: 0,
          scannerPin: dbOrg.staff_scanner_pin || "----"
        };
      });

      return NextResponse.json({
        success: true,
        organizer: {
          name: dbOrg.name || "Independent Host",
          phone: dbOrg.phone || rawPhone,
          upiId: dbOrg.upi_id || "Not Configured",
          payoutStatus: "T+1 Payout Active via Cashfree Easy Split",
          scannerPin: dbOrg.staff_scanner_pin || "----"
        },
        events: dbEvents
      });
    }

    // 3. New host with zero events published yet
    return NextResponse.json({
      success: true,
      organizer: {
        name: "New Organizer",
        phone: rawPhone,
        upiId: "Not Configured",
        payoutStatus: "0% Commission Active",
        scannerPin: "----"
      },
      events: []
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load events";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

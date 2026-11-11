import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Event slug is required" },
        { status: 400 }
      );
    }

    const { data: event, error } = await supabase
      .from("events")
      .select("*, ticket_tiers(*), organizers(name, is_verified)")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Format for frontend
    const dateObj = new Date(event.event_date);
    const formattedDate = isNaN(dateObj.getTime())
      ? event.event_date
      : dateObj.toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });

    const formattedTiers = (event.ticket_tiers || []).map((t: {
      id: string;
      tier_name: string;
      price: number;
      total_capacity: number;
      sold_count: number;
      description?: string;
      perks?: string[];
    }) => ({
      id: t.id,
      name: t.tier_name,
      price: Number(t.price),
      capacity: Number(t.total_capacity || 0),
      sold: Number(t.sold_count || 0),
      description: t.description || "General admission pass.",
      perks: Array.isArray(t.perks) ? t.perks : ["Standard Entry Pass"]
    }));

    const defaultBanner = event.venue_type === "theater" || event.category === "screening"
      ? "/banners/theater-audi.svg"
      : event.category === "workshop"
      ? "/banners/artisan-pottery.svg"
      : "/banners/acoustic-sunset.svg";

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        category: event.category,
        date: formattedDate,
        time: event.gates_open || "Doors Open",
        venueName: event.venue_name,
        address: event.address || event.venue_name,
        city: event.city || "India",
        bannerUrl: event.poster_url || defaultBanner,
        organizerName: event.organizers?.name || "Independent Host",
        organizerVerified: event.organizers?.is_verified ?? true,
        description: event.description || "Join us for this curated live experience.",
        hasCoverCharge: Boolean(event.cover_charge_note && event.cover_charge_note !== "No mandatory cover charge."),
        coverChargeAmount: 0,
        coverChargeNotes: event.cover_charge_note || "No mandatory cover charge.",
        ageRestriction: event.age_restriction || "All Ages",
        dressCode: "Casuals",
        audiScreenNumber: event.audi_screen_number,
        isPublished: event.is_published,
        tiers: formattedTiers
      }
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load event";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

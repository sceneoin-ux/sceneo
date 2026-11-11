import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface DbTierItem {
  price?: number;
  total_capacity?: number;
  sold_count?: number;
}

interface DbEventItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  venue_type: string;
  venue_name: string;
  audi_screen_number?: string;
  city: string;
  address?: string;
  event_date: string;
  gates_open: string;
  poster_url?: string;
  ticket_tiers?: DbTierItem[];
  organizers?: {
    name?: string;
    is_verified?: boolean;
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") || "";
    const category = searchParams.get("category") || "all";

    let query = supabase
      .from("events")
      .select("*, ticket_tiers(*), organizers(name, is_verified)")
      .eq("is_published", true)
      .order("event_date", { ascending: true });

    if (city && city.toLowerCase() !== "all cities" && city.toLowerCase() !== "all") {
      query = query.ilike("city", `%${city}%`);
    }

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data: dbEvents, error } = await query;

    if (error) {
      console.warn("Supabase event query issue:", error.message);
      return NextResponse.json({ success: true, events: [] });
    }

    const formattedEvents = (dbEvents || []).map((evt: DbEventItem) => {
      const minPrice = evt.ticket_tiers && evt.ticket_tiers.length > 0
        ? Math.min(...evt.ticket_tiers.map(t => Number(t.price || 0)))
        : 0;

      const dateObj = new Date(evt.event_date);
      const dateFormatted = isNaN(dateObj.getTime())
        ? "Upcoming"
        : dateObj.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();

      const defaultBanner = evt.venue_type === "theater" || evt.category === "screening"
        ? "/banners/theater-audi.svg"
        : evt.category === "workshop"
        ? "/banners/artisan-pottery.svg"
        : "/banners/acoustic-sunset.svg";

      return {
        id: evt.id,
        slug: evt.slug,
        title: evt.title,
        category: evt.category,
        date: dateFormatted,
        time: evt.gates_open || "Doors Open",
        venue: evt.venue_name + (evt.audi_screen_number ? ` • ${evt.audi_screen_number}` : ""),
        city: evt.city,
        startingPrice: minPrice,
        bannerUrl: evt.poster_url || defaultBanner,
        organizer: evt.organizers?.name || "Independent Host",
        verified: evt.organizers?.is_verified ?? true,
        tag: evt.venue_type === "theater" ? "Theater Screening" : "Live & Selling",
        tagStyle: evt.venue_type === "theater" 
          ? "bg-purple-50 text-purple-700 border-purple-200/80"
          : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
      };
    });

    return NextResponse.json({
      success: true,
      events: formattedEvents
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to fetch events";
    return NextResponse.json({ success: false, error: errorMsg, events: [] }, { status: 500 });
  }
}

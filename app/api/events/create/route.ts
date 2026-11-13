import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      venueType,
      venueName,
      audiScreenNumber,
      city = "Hyderabad",
      address,
      eventDate,
      gatesOpen = "7:00 PM",
      posterUrl,
      ageRestriction = "21+",
      coverChargeNote,
      outsideFoodAllowed = false,
      hostName,
      hostPhone,
      hostUpiId,
      tiers = []
    } = body;

    if (process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_ACTIVATED === "false") {
      return NextResponse.json(
        { error: "Host event creation is temporarily paused pending Cashfree payment gateway activation." },
        { status: 403 }
      );
    }

    if (!title || !venueName || !eventDate || !hostPhone || !hostUpiId || tiers.length === 0) {
      return NextResponse.json(
        { error: "Please fill in all required fields (title, venue, date, host phone, UPI ID, and at least 1 ticket tier)." },
        { status: 400 }
      );
    }

    // 1. Create or Find Organizer
    let organizerId: string | null = null;
    const { data: existingOrg } = await supabase
      .from("organizers")
      .select("id")
      .eq("phone", hostPhone)
      .single();

    if (existingOrg) {
      organizerId = existingOrg.id;
    } else {
      const { data: newOrg, error: orgErr } = await supabase
        .from("organizers")
        .insert({
          name: hostName || "Independent Host",
          phone: hostPhone,
          email: `${hostPhone.replace(/\D/g, "")}@sceneo.temp`,
          upi_id: hostUpiId,
          staff_scanner_pin: Math.floor(1000 + Math.random() * 9000).toString(),
          is_verified: false
        })
        .select()
        .single();

      if (orgErr || !newOrg) {
        return NextResponse.json({ error: "Failed to create organizer profile." }, { status: 500 });
      }
      organizerId = newOrg.id;
    }

    // 2. Generate Unique URL Slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const slug = `${baseSlug}-${Math.floor(Math.random() * 900 + 100)}`;

    // 3. Insert Event into Supabase
    const { data: event, error: eventErr } = await supabase
      .from("events")
      .insert({
        organizer_id: organizerId,
        slug: slug,
        title: title,
        description: description || "Join us for this curated live experience.",
        category: category || "music",
        venue_type: venueType || "auditorium",
        venue_name: venueName,
        audi_screen_number: audiScreenNumber || null,
        city: city,
        address: address || venueName,
        event_date: new Date(eventDate).toISOString(),
        gates_open: gatesOpen,
        poster_url: posterUrl || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
        age_restriction: ageRestriction,
        cover_charge_note: coverChargeNote || "Entry pass only.",
        outside_food_allowed: outsideFoodAllowed,
        seat_allocation_mode: venueType === "theater" ? "assigned_seating" : "general_admission",
        is_published: false // Gated pending mandatory Host KYC (Aadhaar & PAN) approval
      })
      .select()
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: "Failed to publish event." }, { status: 500 });
    }

    // 4. Insert Ticket Tiers
    const tierRecords = tiers.map((t: { name: string; price: number; capacity: number; description?: string }) => ({
      event_id: event.id,
      tier_name: t.name,
      price: Number(t.price),
      total_capacity: Number(t.capacity),
      sold_count: 0,
      description: t.description || "General admission ticket"
    }));

    const { error: tierErr } = await supabase.from("ticket_tiers").insert(tierRecords);
    if (tierErr) {
      console.error("Tier insert error:", tierErr);
    }

    return NextResponse.json({
      success: true,
      eventId: event.id,
      slug: event.slug,
      title: event.title,
      isPendingKyc: true,
      publicUrl: `/e/${event.slug}`,
      organizerDashboardUrl: `/organizer/${event.slug}`
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

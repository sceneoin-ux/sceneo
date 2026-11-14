import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

interface DbTierItem {
  id?: string;
  total_capacity?: number;
  sold_count?: number;
  price?: number;
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
  event_date: string;
  is_published?: boolean;
  ticket_tiers?: DbTierItem[];
  organizer_id?: string;
  organizers?: {
    id?: string;
    name?: string;
    phone?: string;
    upi_id?: string;
    is_verified?: boolean;
  };
}

interface DbOrderItem {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  quantity?: number;
  ticket_price?: number;
  convenience_fee?: number;
  total_paid?: number;
  payment_status?: string;
  created_at: string;
  event_id?: string;
  events?: {
    title?: string;
  };
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
    const masterPassword = process.env.ADMIN_MASTER_PASSWORD;
    if (!masterPassword) {
      console.error("[SECURITY] ADMIN_MASTER_PASSWORD is not configured in environment variables.");
      return NextResponse.json(
        { success: false, error: "Admin authentication not configured on server. Set ADMIN_MASTER_PASSWORD in Vercel." },
        { status: 500 }
      );
    }

    const expectedToken = crypto.createHmac("sha256", masterPassword).update("sceneo-admin-active-session").digest("hex");
    const clientToken = req.headers.get("x-admin-token");

    if (!clientToken || (clientToken !== expectedToken && clientToken !== masterPassword)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin authentication token required." },
        { status: 401 }
      );
    }
    // 1. Fetch Events strictly from Supabase
    const { data: dbEvents } = await supabase
      .from("events")
      .select("*, ticket_tiers(*), organizers(*)")
      .order("created_at", { ascending: false });

    // 2. Fetch Organizers strictly from Supabase
    const { data: dbOrganizers } = await supabase
      .from("organizers")
      .select("*")
      .order("created_at", { ascending: false });

    // 3. Fetch Orders strictly from Supabase
    const { data: dbOrders } = await supabase
      .from("orders")
      .select("*, events(title)")
      .order("created_at", { ascending: false });

    // Aggregate real-time sales and fee metrics per event
    const eventStatsMap: Record<string, { ticketsSold: number; grossEarnings: number; platformFees: number }> = {};
    for (const o of (dbOrders || [])) {
      if (o.payment_status === "PAID" && o.event_id) {
        if (!eventStatsMap[o.event_id]) {
          eventStatsMap[o.event_id] = { ticketsSold: 0, grossEarnings: 0, platformFees: 0 };
        }
        eventStatsMap[o.event_id].ticketsSold += Number(o.quantity || 1);
        eventStatsMap[o.event_id].grossEarnings += Number(o.ticket_price || 0);
        eventStatsMap[o.event_id].platformFees += Number(o.convenience_fee || 0);
      }
    }

    const eventsList = (dbEvents || []).map((ev: DbEventItem) => {
      const tiers = ev.ticket_tiers || [];
      const totalCapacity = tiers.reduce((acc: number, t: DbTierItem) => acc + (t.total_capacity || 0), 0) || 0;
      const tierSoldTotal = tiers.reduce((acc: number, t: DbTierItem) => acc + (t.sold_count || 0), 0);
      const evStats = eventStatsMap[ev.id] || { ticketsSold: 0, grossEarnings: 0, platformFees: 0 };
      const ticketsSold = Math.max(evStats.ticketsSold, tierSoldTotal);
      const grossEarnings = evStats.grossEarnings > 0 ? evStats.grossEarnings : (ticketsSold * Number(tiers[0]?.price || 0));
      const platformFees = evStats.platformFees > 0 ? evStats.platformFees : Math.round(grossEarnings * 0.055);

      return {
        id: ev.id,
        slug: ev.slug,
        title: ev.title,
        category: ev.category,
        venue_type: ev.venue_type,
        venue_name: ev.venue_name,
        audi_screen_number: ev.audi_screen_number,
        city: ev.city,
        organizerName: ev.organizers?.name || "Independent Host",
        organizerPhone: ev.organizers?.phone || "",
        organizerUpi: ev.organizers?.upi_id || "",
        organizerVerified: ev.organizers?.is_verified ?? false,
        is_published: ev.is_published ?? false,
        event_date: ev.event_date,
        totalCapacity,
        ticketsSold,
        grossEarnings,
        platformFees
      };
    });

    const orgEventsMap: Record<string, number> = {};
    for (const ev of (dbEvents || [])) {
      if (ev.organizer_id) {
        orgEventsMap[ev.organizer_id] = (orgEventsMap[ev.organizer_id] || 0) + 1;
      }
    }

    const organizersList = (dbOrganizers || []).map((org) => ({
      id: org.id,
      name: org.name,
      phone: maskPhone(org.phone),
      email: org.email || "",
      upi_id: org.upi_id || "",
      is_verified: org.is_verified ?? true,
      events_count: orgEventsMap[org.id] || 0
    }));

    const ordersList = (dbOrders || []).map((o: DbOrderItem) => ({
      id: o.id,
      order_number: o.order_number,
      customer_name: o.customer_name,
      customer_phone: maskPhone(o.customer_phone),
      event_title: o.events?.title || "Hosted Event",
      quantity: o.quantity || 1,
      ticket_price: Number(o.ticket_price || 0),
      convenience_fee: Number(o.convenience_fee || 0),
      total_paid: Number(o.total_paid || 0),
      payment_status: o.payment_status || "PAID",
      created_at: new Date(o.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    }));

    const totalGMV = ordersList.filter(o => o.payment_status === "PAID").reduce((sum, o) => sum + (o.ticket_price * o.quantity || o.total_paid), 0);
    const totalPlatformRevenue = ordersList.filter(o => o.payment_status === "PAID").reduce((sum, o) => sum + o.convenience_fee, 0);
    const totalTicketsSold = ordersList.filter(o => o.payment_status === "PAID").reduce((sum, o) => sum + o.quantity, 0);

    return NextResponse.json({
      success: true,
      metrics: {
        totalGMV,
        totalPlatformRevenue,
        totalTicketsSold,
        totalEventsCount: eventsList.length,
        totalOrganizersCount: organizersList.length,
        cashfreeStatus: "HEALTHY_ACTIVE",
        rule33Compliance: "PURE_AGENT_ACTIVE",
        splitPayoutMode: "CASHFREE_EASY_SPLIT_T1"
      },
      events: eventsList,
      organizers: organizersList,
      recentOrders: ordersList
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load admin stats";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

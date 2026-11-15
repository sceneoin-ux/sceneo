import { NextRequest, NextResponse } from "next/server";
import { sendTicketEmail } from "@/lib/resend";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      orderId,
      orderNumber,
      passToken
    } = body;
    let { 
      toEmail, 
      attendeeName, 
      eventTitle, 
      eventDate, 
      eventTime, 
      venueName, 
      city, 
      totalTickets, 
      totalAmount, 
      bookingRef, 
      passUrl
    } = body;

    // If orderId / orderNumber / passToken is provided and missing eventTitle, resolve from Supabase
    if ((orderId || orderNumber || passToken) && (!eventTitle || !toEmail)) {
      let query = supabase
        .from("orders")
        .select("*, passes(*), ticket_tiers(*, events(*))");

      if (orderId) {
        query = query.eq("id", orderId);
      } else if (orderNumber) {
        query = query.eq("order_number", orderNumber);
      } else if (passToken) {
        const { data: passRecord } = await supabase
          .from("passes")
          .select("order_id")
          .eq("pass_token", passToken)
          .maybeSingle();

        if (passRecord?.order_id) {
          query = query.eq("id", passRecord.order_id);
        }
      }

      const { data: order } = await query.maybeSingle();

      if (order) {
        const event = order.ticket_tiers?.events;
        toEmail = toEmail || order.customer_email;
        attendeeName = attendeeName || order.customer_name || "Valued Guest";
        eventTitle = eventTitle || event?.title || "Live Experience";
        eventDate = eventDate || event?.event_date || "Upcoming";
        eventTime = eventTime || event?.gates_open || "Doors Open";
        venueName = venueName || event?.venue_name || "Venue";
        city = city || event?.city || "Hyderabad";
        totalTickets = totalTickets || order.quantity || 1;
        totalAmount = totalAmount || Number(order.total_paid || 0);
        bookingRef = bookingRef || order.order_number;
        passUrl = passUrl || `https://sceneo.in/e/${event?.slug || "ticket"}?orderId=${order.id}`;

        // Also persist the email on the order in Supabase if previously placeholder
        if (toEmail && (!order.customer_email || order.customer_email.endsWith("@sceneo.temp"))) {
          await supabase.from("orders").update({ customer_email: toEmail }).eq("id", order.id);
        }
      }
    }

    if (!toEmail || toEmail.endsWith("@sceneo.temp")) {
      return NextResponse.json({ error: "Please provide a valid email address to receive your ticket." }, { status: 400 });
    }

    if (!eventTitle) {
      return NextResponse.json({ error: "Missing required event details" }, { status: 400 });
    }

    const result = await sendTicketEmail({
      toEmail,
      attendeeName: attendeeName || "Valued Guest",
      eventTitle,
      eventDate: eventDate || "Upcoming",
      eventTime: eventTime || "Doors Open",
      venueName: venueName || "Venue",
      city: city || "Hyderabad",
      totalTickets: Number(totalTickets || 1),
      totalAmount: Number(totalAmount || 0),
      bookingRef: bookingRef || `SC-${Date.now().toString().slice(-6)}`,
      passUrl: passUrl || "https://sceneo.in"
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to dispatch email";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

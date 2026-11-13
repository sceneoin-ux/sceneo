import { NextRequest, NextResponse } from "next/server";
import { sendTicketEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
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

    if (!toEmail || !eventTitle) {
      return NextResponse.json({ error: "Missing required fields (toEmail, eventTitle)" }, { status: 400 });
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

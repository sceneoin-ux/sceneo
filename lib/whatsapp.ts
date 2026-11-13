// SceneO Automated WhatsApp Notification Service
// Supports Meta WhatsApp Cloud API (1,000 Free Conversations / Month)

interface WhatsAppPassPayload {
  toPhone: string;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  totalTickets: number;
  totalAmount: number;
  bookingRef: string;
  passUrl: string;
}

export async function sendWhatsAppTicketPass(payload: WhatsAppPassPayload) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  // Format phone to standard 91XXXXXXXXXX
  const cleanPhone = payload.toPhone.replace(/\D/g, "").slice(-10);
  const recipientPhone = `91${cleanPhone}`;

  // If Meta WhatsApp Cloud API keys are not yet configured, log cleanly without blocking
  if (!phoneNumberId || !accessToken) {
    console.log("[WhatsApp Simulator] WHATSAPP_ACCESS_TOKEN not set. Simulating automated WhatsApp dispatch:");
    console.log(`[WhatsApp Simulator] To: +${recipientPhone} | Ref: ${payload.bookingRef} | Event: ${payload.eventTitle}`);
    return {
      success: true,
      simulated: true,
      messageId: `wamid_sim_${Date.now()}`
    };
  }

  try {
    const textMessage = 
      `🎟️ *SceneO Entry Pass Confirmed!*\n\n` +
      `Hi ${payload.attendeeName}, your booking for *${payload.eventTitle}* is confirmed.\n\n` +
      `📅 *Date:* ${payload.eventDate} at ${payload.eventTime}\n` +
      `📍 *Venue:* ${payload.venueName}\n` +
      `🎫 *Passes:* ${payload.totalTickets} Ticket(s)\n` +
      `🔢 *Booking Ref:* ${payload.bookingRef}\n\n` +
      `Tap below to open your Anti-Screenshot dynamic QR gate pass:\n${payload.passUrl}`;

    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone,
        type: "text",
        text: {
          preview_url: true,
          body: textMessage
        }
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn("[Meta WhatsApp API Warning]:", data);
      return { success: false, error: data.error?.message || "WhatsApp dispatch error" };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id || `wamid_${Date.now()}`,
      simulated: false
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "WhatsApp request failed";
    console.error("[WhatsApp Service Error]:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

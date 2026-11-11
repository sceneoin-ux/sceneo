// SceneO Transactional Email Service via Resend
// Free Tier: 3,000 emails/month (100 emails/day)
// Sends Rule 33 Compliant Ticket Passes & Invoices

interface TicketEmailPayload {
  toEmail: string;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  city: string;
  totalTickets: number;
  totalAmount: number;
  bookingRef: string;
  passUrl: string;
}

export async function sendTicketEmail(payload: TicketEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;

  // Graceful fallback if Resend API key is not yet configured
  if (!apiKey || apiKey === "re_test_mock_key") {
    console.log("[Resend Simulator] RESEND_API_KEY not configured. Simulating ticket email dispatch:");
    console.log(`[Resend Simulator] To: ${payload.toEmail} | Ref: ${payload.bookingRef} | Event: ${payload.eventTitle}`);
    return {
      success: true,
      simulated: true,
      messageId: `sim_${Date.now()}`
    };
  }

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 24px; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; }
          .header { background: #0F172A; padding: 24px; text-align: center; color: #ffffff; }
          .logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          .logo-accent { color: #F43F5E; }
          .badge { display: inline-block; background: #10B981; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; margin-top: 10px; }
          .content { padding: 24px; }
          .title { font-size: 20px; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; }
          .meta-grid { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin: 16px 0; }
          .meta-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
          .meta-label { color: #64748B; }
          .meta-val { font-weight: 700; color: #0F172A; }
          .cta-btn { display: block; background: #F43F5E; color: #ffffff; text-align: center; text-decoration: none; padding: 14px 20px; border-radius: 12px; font-weight: 700; font-size: 14px; margin: 24px 0 12px 0; }
          .footer { font-size: 11px; color: #94A3B8; text-align: center; padding: 20px; border-top: 1px solid #F1F5F9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Scene<span class="logo-accent">O</span></div>
            <div class="badge">Confirmed Entry Pass</div>
          </div>
          <div class="content">
            <h2 class="title">${payload.eventTitle}</h2>
            <p style="font-size: 13px; color: #64748B; margin: 0 0 16px 0;">
              Hi ${payload.attendeeName}, your live ticket pass has been confirmed and registered for door entry.
            </p>
            
            <div class="meta-grid">
              <div class="meta-row"><span class="meta-label">Date & Time:</span> <span class="meta-val">${payload.eventDate} • ${payload.eventTime}</span></div>
              <div class="meta-row"><span class="meta-label">Venue:</span> <span class="meta-val">${payload.venueName}, ${payload.city}</span></div>
              <div class="meta-row"><span class="meta-label">Passes:</span> <span class="meta-val">${payload.totalTickets} Ticket(s)</span></div>
              <div class="meta-row"><span class="meta-label">Total Paid:</span> <span class="meta-val">₹${payload.totalAmount.toFixed(2)}</span></div>
              <div class="meta-row"><span class="meta-label">Booking Ref:</span> <span class="meta-val" style="font-family: monospace;">${payload.bookingRef}</span></div>
            </div>

            <a href="${payload.passUrl}" class="cta-btn">View Anti-Screenshot Live Entry Pass →</a>

            <p style="font-size: 11px; color: #64748B; line-height: 1.5;">
              <strong>Door Guidance:</strong> Please show the dynamic live pass on your mobile phone at the gate. As per our anti-fraud rules, static screenshot passes are rejected by the door scanner.
            </p>
          </div>
          <div class="footer">
            SceneO Technologies • Rule 33 CGST Pure Agent Compliance<br>
            Have questions? Email support@sceneo.in
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || "SceneO Tickets <onboarding@resend.dev>";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [payload.toEmail],
        subject: `Your Entry Pass: ${payload.eventTitle} [Ref: ${payload.bookingRef}]`,
        html: htmlBody
      })
    });

    const data = await res.json();
    return {
      success: res.ok,
      messageId: data.id || null,
      error: data.message || null
    };
  } catch (err) {
    console.error("[Resend Error]:", err);
    return {
      success: false,
      error: (err as Error).message
    };
  }
}

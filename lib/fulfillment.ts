import { supabase } from "@/lib/supabase";
import { sendTicketEmail } from "@/lib/resend";
import { sendWhatsAppTicketPass } from "@/lib/whatsapp";
import { logSecurityEvent } from "@/lib/logger";

export async function fulfillOrder(
  orderIdentifier: string,
  cfPaymentId?: string,
  cfOrderId?: string
) {
  try {
    // 1. Resolve Order from Supabase
    let query = supabase
      .from("orders")
      .select("*, passes(*), ticket_tiers(*, events(*))");

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdentifier);
    if (isUUID) {
      query = query.eq("id", orderIdentifier);
    } else {
      const orderNumClean = orderIdentifier.replace(/^CF_/, "").replace(/_/g, "-");
      query = query.or(
        `cashfree_order_id.eq.${orderIdentifier},order_number.eq.${orderIdentifier},order_number.eq.${orderNumClean}`
      );
    }

    const { data: order, error: orderErr } = await query.maybeSingle();

    if (orderErr || !order) {
      console.error("[FulfillOrder] Order not found for identifier:", orderIdentifier, orderErr);
      return { success: false, error: "Order not found" };
    }

    // 2. If already PAID and has pass, return existing
    if (order.payment_status === "PAID" && order.passes && order.passes.length > 0) {
      return {
        success: true,
        alreadyProcessed: true,
        order,
        pass: order.passes[0]
      };
    }

    // 3. Mark Order as PAID in Supabase
    const paymentIdToSave = cfPaymentId || order.cashfree_payment_id || `cf_pay_${Date.now()}`;
    const cfOrderIdToSave = cfOrderId || order.cashfree_order_id || `CF_${order.order_number?.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

    await supabase
      .from("orders")
      .update({
        payment_status: "PAID",
        cashfree_payment_id: paymentIdToSave,
        cashfree_order_id: cfOrderIdToSave
      })
      .eq("id", order.id);

    // 3b. Increment sold_count in ticket_tiers to maintain accurate capacity
    if (order.tier_id) {
      try {
        const { data: currentTier } = await supabase
          .from("ticket_tiers")
          .select("sold_count")
          .eq("id", order.tier_id)
          .maybeSingle();

        if (currentTier) {
          await supabase
            .from("ticket_tiers")
            .update({
              sold_count: Number(currentTier.sold_count || 0) + Number(order.quantity || 1)
            })
            .eq("id", order.tier_id);
        }
      } catch (tierIncErr) {
        console.warn("[FulfillOrder] Error updating tier sold_count:", tierIncErr);
      }
    }

    // 4. Generate Pass if not exists
    let pass = order.passes?.[0];
    const event = order.ticket_tiers?.events;

    if (!pass) {
      const passToken = `SC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(
        Math.random() * 9000 + 1000
      )}`;
      const totpSecret = `totp_sec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const qty = Number(order.quantity || 1);
      let assignedSeat = qty > 1 ? `General Admission (${qty} Passes Total)` : "General Admission";
      if (event?.venue_type === "theater") {
        const audi = event?.audi_screen_number || "Audi 1";
        const randomRow = ["A", "B", "C", "D", "E", "F", "G"][Math.floor(Math.random() * 7)];
        const randomSeat = Math.floor(Math.random() * 20 + 1);
        assignedSeat =
          qty > 1
            ? `${audi} • Row ${randomRow} • Seats ${randomSeat}-${randomSeat + qty - 1} (${qty} Passes)`
            : `${audi} • Row ${randomRow} • Seat ${randomSeat}`;
      } else if (order.ticket_tiers?.tier_name) {
        assignedSeat =
          qty > 1
            ? `${order.ticket_tiers.tier_name} Entry (${qty} Passes Total)`
            : `${order.ticket_tiers.tier_name} Entry`;
      }

      const { data: createdPass, error: passErr } = await supabase
        .from("passes")
        .insert({
          order_id: order.id,
          pass_token: passToken,
          totp_secret: totpSecret,
          assigned_seat: assignedSeat,
          is_checked_in: false
        })
        .select()
        .maybeSingle();

      if (passErr) {
        console.error("[FulfillOrder] Error creating pass:", passErr);
      } else {
        pass = createdPass;
      }
    }

    // 5. Fire Email via Resend
    if (order.customer_email) {
      try {
        await sendTicketEmail({
          toEmail: order.customer_email,
          attendeeName: order.customer_name || "Valued Guest",
          eventTitle: event?.title || "Live Experience",
          eventDate: event?.event_date || "Upcoming",
          eventTime: event?.gates_open || "Doors Open",
          venueName: event?.venue_name || "Venue",
          city: event?.city || "Vijayawada",
          totalTickets: order.quantity || 1,
          totalAmount: Number(order.total_paid || 0),
          bookingRef: order.order_number,
          passUrl: `https://sceneo.in/e/${event?.slug || "ticket"}?orderId=${order.id}`
        });
      } catch (emailErr) {
        console.error("[FulfillOrder] Resend email error:", emailErr);
      }
    }

    // 6. Fire WhatsApp Ticket Pass
    if (order.customer_phone) {
      try {
        await sendWhatsAppTicketPass({
          toPhone: order.customer_phone,
          attendeeName: order.customer_name || "Valued Guest",
          eventTitle: event?.title || "Live Experience",
          eventDate: event?.event_date || "Upcoming",
          eventTime: event?.gates_open || "Doors Open",
          venueName: event?.venue_name || "Venue",
          totalTickets: order.quantity || 1,
          totalAmount: Number(order.total_paid || 0),
          bookingRef: order.order_number,
          passUrl: `https://sceneo.in/e/${event?.slug || "ticket"}?orderId=${order.id}`
        });
      } catch (waErr) {
        console.error("[FulfillOrder] WhatsApp dispatch error:", waErr);
      }
    }

    logSecurityEvent({
      eventType: "PAYMENT_CONFIRMED",
      severity: "INFO",
      actorType: "SYSTEM",
      entityType: "ORDER",
      entityId: order.id,
      metadata: {
        orderNumber: order.order_number,
        amount: Number(order.total_paid || 0),
        passToken: pass?.pass_token
      }
    });

    return {
      success: true,
      order: { ...order, payment_status: "PAID" },
      pass
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    console.error("[FulfillOrder Exception]:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

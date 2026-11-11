import { supabase } from "@/lib/supabase";

export type LogSeverity = "INFO" | "WARN" | "ERROR" | "CRITICAL";
export type LogActorType = "SYSTEM" | "ADMIN" | "ORGANIZER" | "ATTENDEE" | "WEBHOOK" | "GATE_STAFF";
export type LogEntityType = "ORDER" | "PASS" | "EVENT" | "AUTH" | "PAYMENT" | "GATE";

export interface SecurityLogPayload {
  eventType: string;
  severity?: LogSeverity;
  actorType?: LogActorType;
  actorId?: string;
  entityType?: LogEntityType;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log a tamper-evident security event.
 * Writes to Supabase `security_logs` table asynchronously and prints to stdout.
 * Non-blocking: will never crash or delay the primary caller.
 */
export async function logSecurityEvent(payload: SecurityLogPayload): Promise<void> {
  const timestamp = new Date().toISOString();
  const severity = payload.severity || "INFO";

  // 1. Structured Console Log (captured by Vercel / server stdout)
  const consoleMessage = `[SECURITY_AUDIT] [${timestamp}] [${severity}] ${payload.eventType} | Actor: ${payload.actorType || "SYSTEM"}:${payload.actorId || "unknown"} | Entity: ${payload.entityType || "none"}:${payload.entityId || "none"}`;
  
  if (severity === "CRITICAL" || severity === "ERROR") {
    console.error(consoleMessage, payload.metadata || {});
  } else if (severity === "WARN") {
    console.warn(consoleMessage, payload.metadata || {});
  } else {
    console.info(consoleMessage, payload.metadata || {});
  }

  // 2. Persistent Supabase DB Insert
  try {
    // Non-blocking fire-and-forget promise
    Promise.resolve(
      supabase
        .from("security_logs")
        .insert({
          event_type: payload.eventType,
          severity: severity,
          actor_type: payload.actorType || "SYSTEM",
          actor_id: payload.actorId || null,
          entity_type: payload.entityType || null,
          entity_id: payload.entityId || null,
          ip_address: payload.ipAddress || null,
          user_agent: payload.userAgent || null,
          metadata: payload.metadata || {}
        })
    )
      .then((res) => {
        if (res && res.error) {
          if (res.error.code !== "PGRST204" && res.error.code !== "42P01") {
            console.warn("[Logger] Supabase audit insert note:", res.error.message);
          }
        }
      })
      .catch(() => {
        // Suppress network drops so main flow is unaffected
      });
  } catch {
    // Silent failover to console logging
  }
}

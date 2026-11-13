import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { logSecurityEvent } from "@/lib/logger";

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return true;

  if (now - record.lastAttempt > 60000) {
    loginAttempts.delete(ip);
    return true;
  }

  return record.count < 5;
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, lastAttempt: now };
  record.count += 1;
  record.lastAttempt = now;
  loginAttempts.set(ip, record);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown_ip";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many failed attempts. Access locked for 60 seconds." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { password } = body;

    const masterPassword = process.env.ADMIN_MASTER_PASSWORD;

    if (!masterPassword) {
      console.error("[SECURITY] ADMIN_MASTER_PASSWORD is not configured in environment variables.");
      return NextResponse.json(
        { success: false, error: "Admin authentication is not configured on server. Set ADMIN_MASTER_PASSWORD in Vercel." },
        { status: 500 }
      );
    }

    if (!password || password !== masterPassword) {
      recordFailedAttempt(ip);
      logSecurityEvent({
        eventType: "ADMIN_LOGIN_FAILED",
        severity: "WARN",
        actorType: "ADMIN",
        ipAddress: ip,
        metadata: { reason: "Incorrect master password attempt" }
      });
      return NextResponse.json(
        { success: false, error: "Incorrect Master Password. Access denied." },
        { status: 401 }
      );
    }

    // Success: clear rate limit record and return signed admin token
    loginAttempts.delete(ip);
    logSecurityEvent({
      eventType: "ADMIN_LOGIN_SUCCESS",
      severity: "INFO",
      actorType: "ADMIN",
      ipAddress: ip,
      metadata: { session: "Admin console authenticated" }
    });

    const adminToken = crypto.createHmac("sha256", masterPassword).update("sceneo-admin-active-session").digest("hex");

    return NextResponse.json({
      success: true,
      token: adminToken,
      message: "Admin authentication successful"
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Verification exception";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

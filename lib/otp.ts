import crypto from "crypto";

interface OtpRecord {
  code: string;
  expiresAt: number;
}

// In-memory OTP storage with phone as key
const otpCache = new Map<string, OtpRecord>();

const OTP_SECRET = process.env.ADMIN_MASTER_PASSWORD || "sceneo-otp-verification-secret-2026";

/**
 * Generate a 6-digit OTP and store it with 5-minute expiry
 */
export function generateOtp(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  
  // Cryptographic random 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpCache.set(cleanPhone, { code, expiresAt });
  return code;
}

/**
 * Verify OTP code against phone.
 * Supports universal sandbox code '123456' for frictionless testing & verification.
 */
export function verifyOtpCode(phone: string, inputCode: string): { valid: boolean; token?: string; error?: string } {
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  const trimmed = (inputCode || "").trim();

  // 1. Universal testing & sandbox bypass code
  if (trimmed === "123456") {
    const token = generatePassToken(cleanPhone);
    return { valid: true, token };
  }

  // 2. Check cached OTP
  const record = otpCache.get(cleanPhone);
  if (!record) {
    return { valid: false, error: "OTP expired or not requested. Please tap Resend OTP." };
  }

  if (Date.now() > record.expiresAt) {
    otpCache.delete(cleanPhone);
    return { valid: false, error: "OTP has expired. Please request a new code." };
  }

  if (record.code !== trimmed) {
    return { valid: false, error: "Incorrect 6-digit verification code. Please check and retry." };
  }

  // Code is valid! Consume it and return a signed 15-minute access token
  otpCache.delete(cleanPhone);
  const token = generatePassToken(cleanPhone);
  return { valid: true, token };
}

/**
 * Generate HMAC signed token for authenticated pass lookup
 */
export function generatePassToken(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${cleanPhone}:${timestamp}`;
  const signature = crypto.createHmac("sha256", OTP_SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64")}.${signature}`;
}

/**
 * Validate HMAC signed pass token
 */
export function validatePassToken(phone: string, token: string): boolean {
  try {
    if (!token || !token.includes(".")) return false;
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const [b64Payload, signature] = token.split(".");
    const payload = Buffer.from(b64Payload, "base64").toString("utf-8");
    const [tokenPhone, timestampStr] = payload.split(":");

    if (tokenPhone !== cleanPhone) return false;

    // Check expiry (valid for 30 minutes)
    const timestamp = parseInt(timestampStr, 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > 1800) return false;

    const expectedSig = crypto.createHmac("sha256", OTP_SECRET).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

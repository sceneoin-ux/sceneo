import { NextRequest, NextResponse } from "next/server";
import { verifyOtpCode } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code } = body;

    const cleanPhone = (phone || "").replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (!code || code.trim().length !== 6) {
      return NextResponse.json(
        { error: "Please enter the 6-digit verification code." },
        { status: 400 }
      );
    }

    const result = verifyOtpCode(cleanPhone, code);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "Invalid verification code." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      message: "Mobile verified successfully."
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to verify OTP";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

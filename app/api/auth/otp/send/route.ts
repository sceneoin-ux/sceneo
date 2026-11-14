import { NextRequest, NextResponse } from "next/server";
import { generateOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body;

    const cleanPhone = (phone || "").replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    const code = generateOtp(cleanPhone);
    console.log(`[SceneO Security OTP] Generated 6-digit OTP for +91 ${cleanPhone}: ${code}`);

    return NextResponse.json({
      success: true,
      message: `Verification code sent to +91 ${cleanPhone.slice(0, 2)}*** *${cleanPhone.slice(-4)}`
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to generate OTP";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

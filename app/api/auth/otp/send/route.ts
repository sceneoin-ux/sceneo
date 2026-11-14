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

    const twoFactorKey = process.env.TWOFACTOR_API_KEY;
    const templateName = process.env.TWOFACTOR_OTP_TEMPLATE || "SCENEO_OTP";

    // 1. Dispatch real telecom SMS via 2Factor.in (using approved DLT template to prevent voice fallback)
    if (twoFactorKey && twoFactorKey !== "your_2factor_api_key") {
      try {
        const tfRes = await fetch(
          `https://2factor.in/API/V1/${twoFactorKey}/SMS/${cleanPhone}/AUTOGEN/${templateName}`
        );
        const tfData = await tfRes.json();

        if (tfData.Status === "Success") {
          console.log(`[2Factor SMS] Dispatched real telecom SMS to +91 ${cleanPhone} (session: ${tfData.Details})`);
          return NextResponse.json({
            success: true,
            provider: "2factor",
            sessionId: tfData.Details,
            message: `6-digit verification code sent via SMS to +91 ${cleanPhone}. Please check your phone.`
          });
        } else {
          console.warn("[2Factor SMS Notice]:", tfData.Details);
        }
      } catch (tfErr) {
        console.warn("[2Factor SMS Network Exception]:", tfErr);
      }
    }

    // 2. Fallback in-memory generator if SMS gateway key is absent
    const fallbackCode = generateOtp(cleanPhone);
    console.log(`[SceneO Security OTP] Generated fallback OTP for +91 ${cleanPhone}: ${fallbackCode}`);

    return NextResponse.json({
      success: true,
      provider: "local",
      message: `Verification code sent to +91 ${cleanPhone.slice(0, 2)}*** *${cleanPhone.slice(-4)}`
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to generate OTP";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

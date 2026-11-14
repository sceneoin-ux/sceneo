import { NextRequest, NextResponse } from "next/server";
import { verifyOtpCode, generatePassToken } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code, sessionId } = body;

    const cleanPhone = (phone || "").replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const trimmedCode = (code || "").trim();
    if (trimmedCode.length !== 6) {
      return NextResponse.json(
        { error: "Please enter the complete 6-digit verification code." },
        { status: 400 }
      );
    }

    const twoFactorKey = process.env.TWOFACTOR_API_KEY;

    // 1. Sandbox test bypass code (ONLY active in non-production local development without 2Factor key)
    if (process.env.NODE_ENV !== "production" && (!twoFactorKey || twoFactorKey === "your_2factor_api_key") && trimmedCode === "123456") {
      const token = generatePassToken(cleanPhone);
      return NextResponse.json({
        success: true,
        token,
        message: "Verified successfully (Dev Sandbox)."
      });
    }

    // 2. Verify with 2Factor.in if sessionId is provided
    if (sessionId && twoFactorKey && twoFactorKey !== "your_2factor_api_key") {
      try {
        const tfRes = await fetch(
          `https://2factor.in/API/V1/${twoFactorKey}/SMS/VERIFY/${sessionId}/${trimmedCode}`
        );
        const tfData = await tfRes.json();

        if (tfData.Status === "Success" && tfData.Details === "OTP Matched") {
          console.log(`[2Factor SMS] OTP verified successfully for +91 ${cleanPhone}`);
          const token = generatePassToken(cleanPhone);
          return NextResponse.json({
            success: true,
            token,
            message: "Mobile verified successfully."
          });
        } else {
          console.warn("[2Factor Verify Notice]:", tfData.Details);
        }
      } catch (tfErr) {
        console.warn("[2Factor Verify Error, falling back to local check]:", tfErr);
      }
    }

    // 3. Fallback to local in-memory OTP verification
    const result = verifyOtpCode(cleanPhone, trimmedCode);

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

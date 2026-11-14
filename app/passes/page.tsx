"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Ticket, 
  Calendar, 
  MapPin, 
  Loader2, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  KeyRound, 
  Smartphone,
  RotateCcw
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

interface LookedUpPass {
  orderId: string;
  orderNumber: string;
  paymentStatus: string;
  totalPaid: number;
  quantity: number;
  tierName: string;
  bookedAt: string;
  passToken: string;
  assignedSeat: string;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  event: {
    title: string;
    slug: string;
    date: string;
    time: string;
    venue: string;
    city: string;
    address: string;
    posterUrl: string;
    audiScreen: string | null;
  };
}

export default function MyPassesPage() {
  const [step, setStep] = useState<"phone" | "otp" | "verified">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [passes, setPasses] = useState<LookedUpPass[]>([]);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  // Timer for OTP resend countdown
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Step 1: Send OTP to Mobile
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);
    setError("");
    setStatusMessage("");

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send verification code.");
      } else {
        setStep("otp");
        setResendCountdown(30);
        setStatusMessage(data.message || `Verification code sent to +91 ${cleanPhone}`);
      }
    } catch {
      setError("Network error while connecting to security desk. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const cleanOtp = otp.trim();

    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code: cleanOtp })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Incorrect verification code. Please check and try again.");
      } else {
        setVerifiedToken(data.token);
        // Automatically fetch verified passes
        await loadPasses(cleanPhone, data.token);
      }
    } catch {
      setError("Network error while verifying OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load Passes using verified token
  const loadPasses = async (cleanPhone: string, token: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/tickets/lookup?phone=${encodeURIComponent(cleanPhone)}&token=${encodeURIComponent(token)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to look up passes.");
        setPasses([]);
      } else {
        setPasses(data.passes || []);
        setStep("verified");
      }
    } catch {
      setError("Network error while loading your verified passes.");
      setPasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Modern Web Share API with Native Sharing
  const handleSharePass = async (pass: LookedUpPass) => {
    const passUrl = `https://sceneo.in/e/${pass.event.slug}?orderId=${pass.orderId}`;
    const shareData = {
      title: `🎟️ My SceneO Pass: ${pass.event.title}`,
      text: `Entry pass for ${pass.event.title} (${pass.quantity}x ${pass.tierName}) at ${pass.event.venue}. Ref: ${pass.orderNumber}`,
      url: passUrl
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e: unknown) {
        if ((e as Error).name !== "AbortError") {
          // If user didn't simply cancel, fall back to WhatsApp
        } else {
          return;
        }
      }
    }

    // Fallback: Open WhatsApp directly
    const waText = encodeURIComponent(
      `🎟️ *My SceneO Event Pass*\n\n` +
      `*Event:* ${pass.event.title}\n` +
      `*Passes:* ${pass.quantity}x (${pass.tierName})\n` +
      `*Venue:* ${pass.event.venue}, ${pass.event.city}\n` +
      `*Seat/Guidance:* ${pass.assignedSeat}\n` +
      `*Booking Ref:* ${pass.orderNumber}\n\n` +
      `Show this dynamic pass at gate entry: ${passUrl}`
    );
    window.open(`https://wa.me/?text=${waText}`, "_blank");
  };

  // Offline Pass Image Saver (Canvas-based PNG Download - No print restrictions)
  const handleSaveToDevice = (pass: LookedUpPass) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background Card
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 600, 800);

      // Top Header
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(0, 0, 600, 140);

      // Logo & Brand
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("SceneO", 40, 70);

      ctx.fillStyle = "#F43F5E";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("•", 155, 70);

      ctx.fillStyle = "#10B981";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("VERIFIED DIGITAL PASS", 40, 105);

      // Event Title
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 26px sans-serif";
      const titleWords = pass.event.title.split(" ");
      let line1 = "";
      let line2 = "";
      for (const word of titleWords) {
        if ((line1 + " " + word).length < 28) {
          line1 += (line1 ? " " : "") + word;
        } else {
          line2 += (line2 ? " " : "") + word;
        }
      }
      ctx.fillText(line1, 40, 200);
      if (line2) ctx.fillText(line2, 40, 235);

      // Event Meta
      ctx.fillStyle = "#64748B";
      ctx.font = "16px sans-serif";
      ctx.fillText(`📅 ${pass.event.date} • ${pass.event.time}`, 40, 280);
      ctx.fillText(`📍 ${pass.event.venue}, ${pass.event.city}`, 40, 310);

      // Divider
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(40, 350);
      ctx.lineTo(560, 350);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pass Details Grid
      ctx.fillStyle = "#64748B";
      ctx.font = "12px sans-serif";
      ctx.fillText("TIER", 40, 390);
      ctx.fillText("PASSES", 200, 390);
      ctx.fillText("ASSIGNED DOOR", 340, 390);

      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(pass.tierName, 40, 420);
      ctx.fillText(`${pass.quantity} Ticket(s)`, 200, 420);
      ctx.fillText(pass.assignedSeat, 340, 420);

      // Booking Reference Box
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(40, 460, 520, 80);
      ctx.strokeStyle = "#CBD5E1";
      ctx.strokeRect(40, 460, 520, 80);

      ctx.fillStyle = "#64748B";
      ctx.font = "12px sans-serif";
      ctx.fillText("BOOKING REFERENCE", 60, 490);
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 20px monospace";
      ctx.fillText(pass.orderNumber, 60, 520);

      // Gate Verification Token
      ctx.fillStyle = "#64748B";
      ctx.font = "12px sans-serif";
      ctx.fillText("DYNAMIC SECURITY TOKEN", 40, 580);
      ctx.fillStyle = "#F43F5E";
      ctx.font = "bold 16px monospace";
      ctx.fillText(pass.passToken, 40, 610);

      // Guidance Note
      ctx.fillStyle = "#94A3B8";
      ctx.font = "12px sans-serif";
      ctx.fillText("Present this digital pass at the entrance scanner.", 40, 670);
      ctx.fillText("Issued under Rule 33 Pure Agent Trust • sceneo.in", 40, 695);

      // Trigger Instant Download
      const link = document.createElement("a");
      link.download = `SceneO-Pass-${pass.orderNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.warn("Failed to generate pass image canvas:", e);
      alert(`Booking Reference: ${pass.orderNumber}. Pass details verified.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to SceneO</span>
          </Link>
          <Link href="/" className="flex items-center">
            <BrandLogo size="xs" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-2xl px-4 pt-8 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            <ShieldCheck className="h-3.5 w-3.5 text-rose-600" />
            <span>Secure Ticket Passes</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {step === "verified" ? "Your Verified Gate Passes" : "Find My Ticket Passes"}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            {step === "phone" && "Enter your 10-digit mobile number to verify your identity and unlock your passes."}
            {step === "otp" && `Enter the 6-digit verification code sent to +91 ${phone}.`}
            {step === "verified" && `Showing verified bookings registered under +91 ${phone}.`}
          </p>
        </div>

        {/* ─────────────── STEP 1: PHONE INPUT ─────────────── */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="mt-8">
            <div className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-xs flex items-center gap-2">
              <div className="pl-3 text-slate-400 font-bold text-sm flex items-center gap-1">
                <Smartphone className="h-4 w-4 text-slate-400" />
                <span>+91</span>
              </div>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="Enter 10-digit mobile number"
                className="w-full bg-transparent py-2.5 px-1 text-sm font-semibold text-slate-900 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 text-rose-400" />
                    <span>Send OTP</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <p className="mt-2.5 text-center text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {error}
              </p>
            )}

            <p className="mt-3 text-center text-[11px] text-slate-400">
              🔒 SceneO protects your booking privacy with OTP authentication.
            </p>
          </form>
        )}

        {/* ─────────────── STEP 2: OTP VERIFICATION ─────────────── */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs text-center">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                <span>Verification code for <strong>+91 {phone}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setError("");
                  }}
                  className="font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Change Number
                </button>
              </div>

              {/* 6-Digit Code Input */}
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="• • • • • •"
                className="w-full tracking-[0.5em] text-center text-2xl font-bold py-3 px-4 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
              />

              {statusMessage && (
                <div className="mt-3 text-[11px] font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  {statusMessage}
                </div>
              )}

              {error && (
                <p className="mt-3 text-center text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Verify & Unlock Passes</span>
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <span>Didn&apos;t receive code?</span>
                <button
                  type="button"
                  disabled={resendCountdown > 0 || loading}
                  onClick={() => handleSendOtp()}
                  className="font-bold text-slate-900 hover:underline disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend OTP"}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ─────────────── STEP 3: VERIFIED PASSES ─────────────── */}
        {step === "verified" && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Found {passes.length} Booking{passes.length > 1 ? "s" : ""}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Identity Verified (+91 {phone.slice(-4)})</span>
              </span>
            </div>

            {passes.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <Ticket className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-3 text-base font-bold text-slate-900">No Tickets Found</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  We couldn&apos;t find any confirmed bookings linked to +91 {phone}. If you booked under a different number, please verify that number.
                </p>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setPhone("");
                      setOtp("");
                    }}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Try Another Number
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {passes.map((pass) => (
                  <div
                    key={pass.orderId}
                    className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs overflow-hidden relative"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            {pass.paymentStatus === "PAID" ? "CONFIRMED & ACTIVE" : pass.paymentStatus}
                          </span>
                          {pass.isCheckedIn && (
                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                              ✓ CHECKED IN
                            </span>
                          )}
                        </div>
                        <h2 className="mt-2 text-base sm:text-lg font-bold text-slate-900">
                          {pass.event.title}
                        </h2>
                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-rose-500" />
                            <span>{pass.event.date} • {pass.event.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-rose-500" />
                            <span>{pass.event.venue}, {pass.event.city}</span>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Gate Token Box */}
                      <div className="shrink-0 text-center sm:text-right">
                        <div className="inline-block rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-2xs">
                          <div className="grid grid-cols-6 gap-1 w-20 h-20 p-1 bg-white rounded-lg border border-slate-200">
                            {Array.from({ length: 36 }).map((_, i) => (
                              <div
                                key={i}
                                className={`rounded-xs ${i % 2 === 0 || i % 5 === 0 ? "bg-slate-900" : "bg-transparent"}`}
                              />
                            ))}
                          </div>
                          <div className="mt-1 text-[9px] font-mono font-bold text-slate-500">
                            {pass.passToken}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booking Meta Bar */}
                    <div className="mt-4 border-t border-slate-100 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Tier</span>
                        <span className="font-bold text-slate-800">{pass.tierName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Passes</span>
                        <span className="font-bold text-slate-800">{pass.quantity} Ticket(s)</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Door / Seat</span>
                        <span className="font-bold text-purple-700">{pass.assignedSeat}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Paid Amount</span>
                        <span className="font-bold text-slate-900">₹{pass.totalPaid.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Action Buttons: Native Share + Save to Device */}
                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSharePass(pass)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Share / WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveToDevice(pass)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-rose-600" />
                        <span>Save to Device (PNG)</span>
                      </button>

                      <Link
                        href={`/e/${pass.event.slug}?orderId=${pass.orderId}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                      >
                        <span>Open Live Pass →</span>
                      </Link>
                    </div>
                  </div>
                ))}

                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setPhone("");
                      setOtp("");
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 underline cursor-pointer"
                  >
                    Check another mobile number
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

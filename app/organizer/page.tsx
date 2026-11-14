"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  PlusCircle, 
  ExternalLink, 
  CheckCircle2, 
  Phone,
  Camera,
  LayoutDashboard,
  LogOut,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Film,
  Music,
  Lock
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

interface HostedEvent {
  id: string;
  slug: string;
  title: string;
  category: string;
  venue_type: string;
  venue_name: string;
  audi_screen_number?: string;
  city: string;
  event_date: string;
  gates_open: string;
  totalCapacity: number;
  ticketsSold: number;
  grossEarnings: number;
  scannerPin: string;
}

interface OrganizerProfile {
  name: string;
  phone: string;
  upiId: string;
  payoutStatus: string;
  scannerPin: string;
}

export default function OrganizerHubPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sceneo_host_logged_in") === "true" && Boolean(localStorage.getItem("sceneo_host_phone"));
    }
    return false;
  });
  const [phoneInput, setPhoneInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [authMethod, setAuthMethod] = useState<"otp" | "pin">("otp");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<HostedEvent[]>([]);
  const [organizer, setOrganizer] = useState<OrganizerProfile | null>(null);

  const handleSendOtp = async () => {
    const cleanPhone = phoneInput.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    setIsSendingOtp(true);
    setOtpMessage("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to dispatch SMS OTP. Please try again.");
      } else {
        if (data.sessionId) {
          setVerificationId(data.sessionId);
        }
        setOtpSent(true);
        setOtpMessage(data.message || `📞 Automated call dialing +91 ${cleanPhone}. Please answer the call to hear your 6-digit code.`);
      }
    } catch {
      alert("Failed to send SMS OTP. Please check your connection and try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.replace(/\D/g, "").slice(-10);
    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) {
      alert("Please enter the complete 6-digit OTP code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code: cleanCode, sessionId: verificationId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchHostData(cleanPhone);
      } else {
        alert(data.error || "Invalid OTP code. Please check the code received on your phone.");
      }
    } catch {
      alert("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHostData = useCallback(async (phone: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/organizer/my-events?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
        setOrganizer(data.organizer);
        setIsLoggedIn(true);
        localStorage.setItem("sceneo_host_logged_in", "true");
        localStorage.setItem("sceneo_host_phone", phone);
      }
    } catch (e) {
      console.error("Failed to load organizer data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check persisted login session on load
  useEffect(() => {
    if (isLoggedIn) {
      const savedPhone = localStorage.getItem("sceneo_host_phone");
      if (savedPhone) {
        const timer = setTimeout(() => {
          fetchHostData(savedPhone);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoggedIn, fetchHostData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput) return;
    fetchHostData(phoneInput);
  };

  const handleLogout = () => {
    localStorage.removeItem("sceneo_host_logged_in");
    localStorage.removeItem("sceneo_host_phone");
    setIsLoggedIn(false);
    setOrganizer(null);
  };

  // Aggregates
  const totalEvents = events.length;
  const totalSold = events.reduce((sum, e) => sum + e.ticketsSold, 0);
  const totalCapacity = events.reduce((sum, e) => sum + e.totalCapacity, 0);
  const totalRevenue = events.reduce((sum, e) => sum + e.grossEarnings, 0);

  // ────────────────── LOGIN SCREEN ──────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
        
        {/* Navigation */}
        <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
            <Link href="/" className="flex items-center">
              <BrandLogo size="md" />
            </Link>

            <Link
              href="/organizer/events/new"
              className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:text-sm"
            >
              <span>+ Host an Event</span>
            </Link>
          </div>
        </header>

        {/* Login Form Box */}
        <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
            
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-rose-500 shadow-md">
                <LayoutDashboard className="h-7 w-7" />
              </div>
              <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Organizer Portal
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Log in to monitor all your hosted programs, check live ticket bookings, see who booked, and track payouts.
              </p>
            </div>

            {/* Auth Method Tabs */}
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAuthMethod("otp")}
                className={`rounded-lg py-2 transition ${
                  authMethod === "otp"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Phone OTP (SMS)
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod("pin")}
                className={`rounded-lg py-2 transition ${
                  authMethod === "pin"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                4-Digit Staff PIN
              </button>
            </div>

            {/* Verification Badge */}
            <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px]">
              <span className="text-slate-500">Security Verification:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Carrier SMS OTP Protected</span>
              </span>
            </div>

            {authMethod === "otp" ? (
              /* CARRIER SMS OTP WORKFLOW */
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Host Mobile / WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+91 98201 12345"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isSendingOtp ? "Placing Call..." : "Get Verification Code (Phone Call) →"}
                  </button>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    {otpMessage && (
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-semibold text-center">
                        {otpMessage}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="w-full text-center tracking-widest text-lg font-bold rounded-xl border border-slate-200 bg-white py-2.5 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                      <p className="mt-1.5 text-[11px] text-slate-500 text-center">
                        Please answer the automated phone call on your mobile to hear your code.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-rose-700 disabled:opacity-50"
                    >
                      {loading ? "Verifying..." : "Verify OTP & Enter Hub →"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Change Phone Number
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* QUICK 4-DIGIT PIN WORKFLOW */
              <form onSubmit={handleLogin} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Host Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+91 98201 12345"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Gate / Staff 4-Digit PIN
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold tracking-widest text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {loading ? "Verifying Host Account..." : "Enter Organizer Hub →"}
                </button>
              </form>
            )}

            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <p className="text-xs text-slate-500">
                Want to publish a new event?{" "}
                <Link href="/organizer/events/new" className="font-bold text-rose-600 underline">
                  Host an Event (0% Commission)
                </Link>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
          SceneO Host Platform • Zero Base Cost • Instant UPI & Easy Split Settlement
        </footer>
      </div>
    );
  }

  // ────────────────── LOGGED IN COMMAND CENTER ──────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-rose-500 selection:text-white">
      
      {/* ────────────────── TOP NAVIGATION ────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <BrandLogo size="md" />
            </Link>
            <span className="hidden sm:inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              Host Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/organizer/events/new"
              className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:text-sm"
            >
              <PlusCircle className="h-4 w-4 text-rose-400" />
              <span>+ Host Another Event</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* ────────────────── MAIN CONTENT ────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Host Welcome Banner */}
        <div className="mb-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Verified Host Account</span>
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {organizer?.name || "Independent Host"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Mobile: <strong className="text-slate-700">{organizer?.phone}</strong> • Automated Payout Account: <strong className="text-slate-700">{organizer?.upiId}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:self-center">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-slate-900">0% Platform Deduction</div>
                <div className="text-slate-500">100% Ticket Sales Credited via Cashfree Split</div>
              </div>
            </div>
          </div>

          {/* Aggregated KPIs Across All Events */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="text-xs font-semibold text-slate-500">Total Programs Hosted</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{totalEvents}</div>
              <div className="mt-1 text-[11px] font-medium text-emerald-600">Active & Published</div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="text-xs font-semibold text-slate-500">Total Tickets Booked</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{totalSold}</div>
              <div className="mt-1 text-[11px] font-medium text-slate-500">Out of {totalCapacity} total capacity</div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="text-xs font-semibold text-slate-500">Total Gross Revenue</div>
              <div className="mt-1 text-2xl font-black text-rose-600">₹{totalRevenue.toLocaleString("en-IN")}</div>
              <div className="mt-1 text-[11px] font-medium text-slate-500">Direct Host Earnings</div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="text-xs font-semibold text-slate-500">Overall Occupancy</div>
              <div className="mt-1 text-2xl font-black text-slate-900">
                {totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0}%
              </div>
              <div className="mt-1 text-[11px] font-medium text-emerald-600">High Demand</div>
            </div>
          </div>
        </div>

        {/* ────────────────── HOSTED PROGRAMS LIST ────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Your Hosted Programs
            </h2>
            <p className="text-xs text-slate-500">
              Click on any event to view live attendee guestlists, seats left, and recover failed payments.
            </p>
          </div>

          <Link
            href="/organizer/events/new"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700"
          >
            <span>+ Create New Program</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Event Cards Grid */}
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Music className="h-6 w-6 text-rose-500" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">No hosted programs yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                You haven&apos;t published any gigs with this mobile number yet. Publish your first event in 3 minutes with 0% platform commission.
              </p>
              <Link
                href="/organizer/events/new"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
              >
                <span>+ Create Your First Event</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            events.map((event) => {
              const remaining = Math.max(0, event.totalCapacity - event.ticketsSold);
              const percentFilled = Math.min(100, Math.round((event.ticketsSold / event.totalCapacity) * 100));

              return (
                <div
                  key={event.id}
                  className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:border-slate-300 hover:shadow-md"
                >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  
                  {/* Left: Event Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        {event.venue_type === "theater" ? (
                          <Film className="h-3 w-3 text-rose-600" />
                        ) : (
                          <Music className="h-3 w-3 text-rose-600" />
                        )}
                        <span>{event.category.replace("_", " ")}</span>
                      </span>

                      {event.audi_screen_number && (
                        <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-700">
                          {event.audi_screen_number}
                        </span>
                      )}

                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        Live & Selling
                      </span>
                    </div>

                    <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-rose-600 transition">
                      {event.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{new Date(event.event_date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Gates: {event.gates_open}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{event.venue_name}, {event.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Progress Bar & Sales */}
                  <div className="lg:w-72 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">
                        {event.ticketsSold} <span className="font-normal text-slate-500">booked</span>
                      </span>
                      <span className="text-rose-600">
                        {remaining} <span className="font-normal text-slate-500">left</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-rose-600 transition-all duration-500"
                        style={{ width: `${percentFilled}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-200/60 pt-2">
                      <span className="text-slate-500 font-medium">Gross Revenue:</span>
                      <span className="font-bold text-slate-900">₹{event.grossEarnings.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons (Optimized for Mobile & Desktop) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-col lg:items-stretch gap-2 w-full lg:w-48 shrink-0">
                    
                    {/* Primary Button: Detailed Stats & Guestlist */}
                    <Link
                      href={`/organizer/${event.slug || event.id}`}
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 text-center"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      <span>Live Stats & Guestlist &rarr;</span>
                    </Link>

                    {/* View Live Ticket Page */}
                    <Link
                      href={`/e/${event.slug || event.id}`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 text-center"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>Public Page</span>
                    </Link>

                    {/* Door Scanner Shortcut */}
                    <Link
                      href="/scanner"
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 text-center"
                    >
                      <Camera className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>Door Scanner ({event.scannerPin})</span>
                    </Link>

                  </div>

                </div>
              </div>
            );
          }))}
        </div>

      </main>

    </div>
  );
}

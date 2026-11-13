"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Ticket, Calendar, MapPin, Loader2, Share2, CheckCircle2 } from "lucide-react";
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
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [passes, setPasses] = useState<LookedUpPass[]>([]);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      const res = await fetch(`/api/tickets/lookup?phone=${encodeURIComponent(cleanPhone)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to look up passes.");
        setPasses([]);
      } else {
        setPasses(data.passes || []);
      }
    } catch {
      setError("Network error while finding your passes. Please try again.");
      setPasses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to SceneO</span>
          </Link>
          <Link href="/" className="flex items-center">
            <BrandLogo size="sm" />
          </Link>
        </div>
      </header>

      {/* Hero Search Section */}
      <main className="mx-auto max-w-2xl px-4 pt-10 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            <Ticket className="h-3.5 w-3.5" />
            <span>Pass Retrieval Desk</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Find My Ticket Passes
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Enter the mobile number you used during checkout to retrieve your live gate passes anytime.
          </p>
        </div>

        {/* Phone Lookup Form */}
        <form onSubmit={handleSearch} className="mt-8">
          <div className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-xs flex items-center gap-2">
            <div className="pl-3 text-slate-400 font-bold text-sm">+91</div>
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
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-40 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 text-rose-400" />
                  <span>Find Passes</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-2.5 text-center text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">
              {error}
            </p>
          )}
        </form>

        {/* Results Area */}
        {searched && !loading && (
          <div className="mt-10 space-y-6">
            {passes.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <Ticket className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-3 text-base font-bold text-slate-900">No Tickets Found</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  We couldn&apos;t find any confirmed bookings linked to +91 {phone}. Please check the number or contact support.
                </p>
                <div className="mt-5">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Contact Support Desk
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Found {passes.length} Booking{passes.length > 1 ? "s" : ""}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Verified Door Passes</span>
                  </span>
                </div>

                <div className="mt-4 space-y-6">
                  {passes.map((pass) => {
                    const passShareText = encodeURIComponent(
                      `🎟️ *My SceneO Event Pass*\n\n` +
                      `*Event:* ${pass.event.title}\n` +
                      `*Passes:* ${pass.quantity}x (${pass.tierName})\n` +
                      `*Venue:* ${pass.event.venue}, ${pass.event.city}\n` +
                      `*Seat/Guidance:* ${pass.assignedSeat}\n` +
                      `*Booking Ref:* ${pass.orderNumber}\n\n` +
                      `Show this pass at gate entry: https://sceneo.in/e/${pass.event.slug}?orderId=${pass.orderId}`
                    );

                    return (
                      <div
                        key={pass.orderId}
                        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs overflow-hidden relative"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                {pass.paymentStatus === "PAID" ? "CONFIRMED & VALID" : pass.paymentStatus}
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

                          {/* Dynamic Gate QR Simulation */}
                          <div className="shrink-0 text-center sm:text-right">
                            <div className="inline-block rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-2xs">
                              <div className="grid grid-cols-6 gap-1 w-24 h-24 p-1 bg-white rounded-lg border border-slate-200">
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

                        {pass.quantity > 1 && (
                          <div className="mt-4 rounded-xl bg-purple-50 border border-purple-200 px-3 py-2 text-xs text-purple-900 flex items-center justify-between">
                            <span className="font-bold">👥 Group Booking: {pass.quantity} Passes Total</span>
                            <span className="text-[11px] font-semibold text-purple-700">Friends can enter together or staggered</span>
                          </div>
                        )}

                        {/* Booking Meta Bar */}
                        <div className="mt-5 border-t border-slate-100 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tier</span>
                            <span className="font-bold text-slate-800">{pass.tierName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Passes</span>
                            <span className="font-bold text-slate-800">{pass.quantity} Ticket(s)</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Door</span>
                            <span className="font-bold text-purple-700">{pass.assignedSeat}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Paid Amount</span>
                            <span className="font-bold text-slate-900">₹{pass.totalPaid.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
                          <a
                            href={`https://wa.me/?text=${passShareText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            <span>Save to WhatsApp</span>
                          </a>

                          <Link
                            href={`/e/${pass.event.slug}?orderId=${pass.orderId}`}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <span>Open Full Live Pass →</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

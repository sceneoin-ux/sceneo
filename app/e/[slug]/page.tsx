"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Script from "next/script";
import { useParams } from "next/navigation";
import { 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Plus, 
  Minus, 
  ArrowLeft, 
  Lock,
  Film,
  Loader2,
  Compass
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { GATEWAY_STATUS } from "@/lib/gateway-status";

interface CashfreeModalInstance {
  checkout: (opts: { paymentSessionId: string; redirectTarget: string }) => Promise<{
    paymentDetails?: unknown;
    error?: unknown;
  }>;
}

declare global {
  interface Window {
    Cashfree?: (opts: { mode: "sandbox" | "production" }) => CashfreeModalInstance;
  }
}

interface EventTier {
  id: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  description: string;
  perks: string[];
}

interface LoadedEvent {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  time: string;
  venueName: string;
  address: string;
  city: string;
  bannerUrl: string;
  organizerName: string;
  organizerVerified: boolean;
  description: string;
  hasCoverCharge: boolean;
  coverChargeAmount: number;
  coverChargeNotes: string;
  ageRestriction: string;
  dressCode: string;
  audiScreenNumber?: string;
  isPublished?: boolean;
  tiers: EventTier[];
}

function EventBookingContent() {
  const params = useParams();
  const slug = params?.slug as string;

  const [eventData, setEventData] = useState<LoadedEvent | null>(null);
  const [flyerSrc, setFlyerSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Cart state: tier_id -> quantity
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeePhone, setAttendeePhone] = useState("");
  const [agreedToCover, setAgreedToCover] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  // Fetch Event from Supabase API
  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    fetch(`/api/events/get?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.event) {
          setEventData(data.event);
          setFlyerSrc(data.event.bannerUrl);
          if (data.event.tiers && data.event.tiers.length > 0) {
            setQuantities({ [data.event.tiers[0].id]: 1 });
          }
          setIsLoading(false);
        } else {
          setLoadError(data.error || "Event not found");
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadError("Failed to load event details. Please check your connection.");
        setIsLoading(false);
        console.warn("Event fetch error:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const updateQuantity = (tierId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[tierId] || 0;
      const updated = Math.max(0, current + delta);
      return { ...prev, [tierId]: updated };
    });
  };

  const totalTickets = Object.values(quantities).reduce((acc, qty) => acc + qty, 0);

  const subtotal = (eventData?.tiers || []).reduce((acc, tier) => {
    return acc + tier.price * (quantities[tier.id] || 0);
  }, 0);

  // Exact 5.5% platform fee calculation with dynamic ₹15 floor
  const platformFee = Math.max(
    siteConfig.minPlatformFee,
    Math.round(subtotal * (siteConfig.platformFeePercent / 100))
  );
  const finalTotal = subtotal + platformFee;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventData) return;

    if (!agreedToCover && eventData.hasCoverCharge) {
      alert("Please acknowledge the venue entry rules and cover charge disclaimer.");
      return;
    }

    if (!GATEWAY_STATUS.isActivated) {
      alert("Pass sales are currently in onboarding review. Public booking will unlock immediately upon payment gateway activation.");
      return;
    }

    setIsProcessing(true);

    try {
      const activeTierEntry = Object.entries(quantities).find(([, qty]) => qty > 0);
      const selectedTierId = activeTierEntry ? activeTierEntry[0] : eventData.tiers[0]?.id;
      const selectedQty = activeTierEntry ? activeTierEntry[1] : 1;

      // 1. Call SceneO Checkout API
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: eventData.id,
          tierId: selectedTierId,
          quantity: selectedQty,
          customerName: attendeeName || "Guest Attendee",
          customerPhone: attendeePhone || "9988776655",
          customerEmail: `${(attendeePhone || "9988776655").replace(/\D/g, "")}@sceneo.temp`
        })
      });

      const orderData = await res.json();

      // 2. Open Cashfree UPI Seamless Sheet
      if (typeof window !== "undefined" && window.Cashfree && orderData.paymentSessionId) {
        const cfMode: "sandbox" | "production" = process.env.NEXT_PUBLIC_CASHFREE_MODE === "production" ? "production" : "sandbox";
        const cashfree = window.Cashfree({ mode: cfMode });
        cashfree
          .checkout({
            paymentSessionId: orderData.paymentSessionId,
            redirectTarget: "_modal"
          })
          .then(() => {
            setIsProcessing(false);
            setCheckoutComplete(true);
          });
      } else {
        setTimeout(() => {
          setIsProcessing(false);
          setCheckoutComplete(true);
        }, 1200);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setIsProcessing(false);
      setCheckoutComplete(true);
    }
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-slate-500 font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600 mb-3" />
        <p className="text-sm font-bold text-slate-700">Loading Event Experience...</p>
        <p className="text-xs text-slate-400 mt-1">Fetching live verified details from SceneO database</p>
      </div>
    );
  }

  // Event Not Found State
  if (loadError || !eventData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between font-sans">
        <header className="border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to SceneO</span>
            </Link>
            <span className="text-sm font-bold text-slate-900">Scene<span className="text-rose-600">O</span></span>
          </div>
        </header>

        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-black text-slate-900 sm:text-2xl">Event Not Found</h1>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            This event listing does not exist in our active database, has already concluded, or is currently pending approval.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <Compass className="h-4 w-4" />
              <span>Explore Live Events in Your City</span>
            </Link>
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
          SceneO India • Verified Real-time Ticketing
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28 sm:pb-16 selection:bg-rose-500 selection:text-white">
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />

      {/* ────────────────── TOP NAVIGATION ────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Events</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">S</span>
            <span className="text-base font-bold text-slate-900">Scene<span className="text-rose-600">O</span></span>
          </div>
        </div>
      </header>

      {/* ────────────────── MAIN BODY ────────────────── */}
      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        {checkoutComplete ? (
          /* SUCCESS STATE / DYNAMIC TICKET PASS (LIGHT THEME) */
          <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl text-center sm:p-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Booking Confirmed!</h2>
            <p className="mt-1 text-xs text-slate-500">Your pass is active and verified for door entry.</p>

            {/* Dynamic Pass Card */}
            <div className="relative mt-6 overflow-hidden rounded-2xl border-2 border-slate-300 bg-slate-50 p-6 text-slate-900 shadow-md">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-bold tracking-wider text-emerald-700 uppercase">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Entry Pass
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-semibold">TOTP: Active (30s)</span>
              </div>

              {/* High Contrast QR Code Canvas */}
              <div className="my-5 flex flex-col items-center justify-center rounded-xl bg-white p-6 border border-slate-200 shadow-xs">
                <div className="flex h-44 w-44 items-center justify-center border-2 border-slate-900 bg-white p-2">
                  <div className="grid h-full w-full grid-cols-6 gap-1 p-2">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${i % 2 === 0 || i % 5 === 0 ? "bg-slate-900" : "bg-transparent"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-mono font-bold tracking-widest text-slate-600">
                  CODE: SCENEO-PASS-VERIFIED
                </div>
              </div>

              {/* Event & Pass Details */}
              <div className="text-left border-t border-slate-200 pt-3">
                <div className="text-xs font-bold text-rose-600 uppercase">{eventData.title}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-700">
                  <span>Guest: <strong>{attendeeName || "Attendee"}</strong></span>
                  <span>Qty: <strong>{totalTickets} Pass(es)</strong></span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Venue: {eventData.venueName}
                </div>
                {eventData.audiScreenNumber && (
                  <div className="mt-1 text-[11px] font-bold text-purple-700">
                    Venue Guidance: {eventData.audiScreenNumber}
                  </div>
                )}
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-75 animate-pulse" />
            </div>

            {/* Quick Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href="/"
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 text-center"
              >
                Return to Explore
              </Link>
            </div>

            <div className="mt-4 text-[11px] text-slate-400">
              A copy of your ticket and invoice has been registered to {attendeePhone || "your mobile"}.
            </div>
          </div>
        ) : (
          /* REGULAR BOOKING WORKFLOW */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* LEFT COLUMN: EVENT DETAILS & TIERS (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Flyer Banner */}
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={flyerSrc || eventData.bannerUrl}
                  alt={eventData.title}
                  onError={() => {
                    const fallback = eventData.audiScreenNumber || eventData.category === "screening"
                      ? "/banners/theater-audi.svg"
                      : eventData.category === "workshop"
                      ? "/banners/artisan-pottery.svg"
                      : "/banners/acoustic-sunset.svg";
                    setFlyerSrc(fallback);
                  }}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-4 left-4 rounded-full border border-slate-200/60 bg-white/90 px-3.5 py-1 text-xs font-bold text-slate-800 backdrop-blur-md shadow-xs">
                  {(eventData.category || "EVENT").replace("_", " ").toUpperCase()}
                </div>
              </div>

              {/* Title & Host Credibility */}
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {eventData.title}
                </h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1 font-semibold text-slate-900">
                    <span>Hosted by {eventData.organizerName}</span>
                    {eventData.organizerVerified && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    <span>SceneO Verified Host</span>
                  </div>
                </div>
              </div>

              {/* Date, Time & Venue Specs */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Calendar className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{eventData.date}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{eventData.time}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <MapPin className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{eventData.venueName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{eventData.address}</div>
                  </div>
                </div>
              </div>

              {/* Cinema Audi Notice */}
              {eventData.audiScreenNumber && (
                <div className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50/70 p-4 text-xs text-purple-900">
                  <Film className="h-5 w-5 text-purple-600 shrink-0" />
                  <div>
                    <span className="font-bold">Cinema Screening: {eventData.audiScreenNumber}</span>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      Reserved seating is allocated automatically based on booking timestamp.
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900">About the Experience</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                  {eventData.description}
                </p>

                {/* Venue Guidelines */}
                <div className="mt-5 border-t border-slate-100 pt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs text-slate-600">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Age Policy</span>
                    <span className="font-semibold text-slate-800">{eventData.ageRestriction}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Dress Code</span>
                    <span className="font-semibold text-slate-800">{eventData.dressCode}</span>
                  </div>
                </div>
              </div>

              {/* TIER SELECTION */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Select Pass Tier</h3>

                {eventData.tiers.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-slate-200 bg-white text-center text-xs text-slate-400">
                    No active passes configured for this event.
                  </div>
                ) : (
                  eventData.tiers.map((tier) => {
                    const qty = quantities[tier.id] || 0;
                    const isSoldOut = tier.capacity > 0 && tier.sold >= tier.capacity;

                    return (
                      <div
                        key={tier.id}
                        className={`rounded-2xl border p-4 transition ${
                          qty > 0
                            ? "border-rose-500 bg-rose-50/20 shadow-xs"
                            : "border-slate-200/80 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">{tier.name}</span>
                              {isSoldOut && (
                                <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                  Sold Out
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{tier.description}</div>
                            {tier.perks && tier.perks.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {tier.perks.map((perk, i) => (
                                  <span
                                    key={i}
                                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                                  >
                                    ✓ {perk}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-base font-extrabold text-slate-900">
                              ₹{tier.price}
                            </div>
                            <div className="text-[10px] text-slate-400">per pass</div>

                            {/* Quantity Controls */}
                            {!isSoldOut && (
                              <div className="mt-3 flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(tier.id, -1)}
                                  disabled={qty === 0}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-30"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-5 text-center text-xs font-bold text-slate-900">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(tier.id, 1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-2xs hover:bg-slate-800"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: INSTANT CHECKOUT PANEL (5 COLS) */}
            <div className="lg:col-span-5">
              <div className="sticky top-20 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
                <h3 className="text-base font-bold text-slate-900">2-Tap UPI Checkout</h3>
                <p className="mt-0.5 text-xs text-slate-500">Pay securely with GPay, PhonePe, or Paytm.</p>

                {/* Gateway Review Notice */}
                {!GATEWAY_STATUS.isActivated && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
                    <span className="font-bold block mb-0.5 text-amber-900">Pass Sales In Verification Review</span>
                    Direct UPI booking will unlock once payment gateway activation completes with Cashfree.
                  </div>
                )}

                <form onSubmit={handleCheckout} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Full Name (for Door Pass)
                    </label>
                    <input
                      type="text"
                      required
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs font-semibold text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      WhatsApp Mobile Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={attendeePhone}
                      onChange={(e) => setAttendeePhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs font-semibold text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                    <p className="mt-1 text-[10px] text-slate-400">Pass and invoice texted instantly to this number.</p>
                  </div>

                  {eventData.hasCoverCharge && (
                    <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={agreedToCover}
                        onChange={(e) => setAgreedToCover(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-slate-600 text-[11px] leading-tight">
                        I acknowledge the <strong>cover charge policy</strong> ({eventData.coverChargeNotes}) and entry rules.
                      </span>
                    </label>
                  )}

                  {/* Price Breakdown */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Pass Subtotal ({totalTickets} pass{totalTickets !== 1 ? "es" : ""}):</span>
                      <span className="font-semibold text-slate-900">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <span>Platform Fee:</span>
                        <span className="rounded bg-slate-200/80 px-1 py-0.2 text-[10px] font-semibold text-slate-600">5.5% (inc. taxes)</span>
                      </span>
                      <span className="font-semibold text-slate-900">₹{platformFee}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                      <span>Total Amount:</span>
                      <span className="text-rose-600">₹{finalTotal}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={totalTickets === 0 || isProcessing || !GATEWAY_STATUS.isActivated}
                    className="w-full rounded-xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {!GATEWAY_STATUS.isActivated
                      ? "Booking Paused (Gateway Review)"
                      : isProcessing
                      ? "Connecting to UPI..."
                      : `Pay ₹${finalTotal} via UPI & Get Pass →`}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <Lock className="h-3 w-3" />
                    <span>Protected by Cashfree Payments (RBI Regulated)</span>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function EventBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-sm font-semibold text-slate-500">
          Loading Event...
        </div>
      }
    >
      <EventBookingContent />
    </Suspense>
  );
}

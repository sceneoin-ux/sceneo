"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  IndianRupee, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Film, 
  Sparkles, 
  Layers,
  Upload,
  Loader2
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { uploadFlyerToCloudinary } from "@/lib/cloudinary";
import { GATEWAY_STATUS } from "@/lib/gateway-status";

interface TicketTierInput {
  name: string;
  price: number;
  capacity: number;
  description: string;
}

export default function CreateEventPage() {
  // Basic Details
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("screening");
  const [venueType, setVenueType] = useState<"auditorium" | "theater" | "hall" | "rooftop">("auditorium");
  const [venueName, setVenueName] = useState("");
  const [audiScreenNumber, setAudiScreenNumber] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [address, setAddress] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [gatesOpen, setGatesOpen] = useState("08:00 PM");
  const [posterUrl, setPosterUrl] = useState("");
  const [isUploadingFlyer, setIsUploadingFlyer] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFlyer(true);
    setUploadSuccess(false);
    try {
      const res = await uploadFlyerToCloudinary(file);
      if (res.success && res.secureUrl) {
        setPosterUrl(res.secureUrl);
        setUploadSuccess(true);
      } else {
        alert(res.error || "Upload failed. Please check network or enter image URL.");
      }
    } catch (err) {
      alert("Error uploading flyer: " + (err as Error).message);
    } finally {
      setIsUploadingFlyer(false);
    }
  };
  const [ageRestriction, setAgeRestriction] = useState("21+");
  const [hasCoverCharge, setHasCoverCharge] = useState(false);
  const [coverChargeNote, setCoverChargeNote] = useState("Entry only. F&B cover charge applicable at door.");

  // Host Details
  const [hostName, setHostName] = useState("");
  const [hostPhone, setHostPhone] = useState("");
  const [hostUpiId, setHostUpiId] = useState("");

  // Ticket Tiers
  const [tiers, setTiers] = useState<TicketTierInput[]>([
    { name: "Phase 1 Pass", price: 499, capacity: 150, description: "General admission entry" },
    { name: "VIP Pass", price: 1299, capacity: 30, description: "VIP deck & elevated viewing" }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  // Add / Remove Tiers
  const addTier = () => {
    setTiers([...tiers, { name: "New Tier Pass", price: 799, capacity: 50, description: "Standard pass" }]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof TicketTierInput, value: string | number) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  };

  const potentialEarnings = tiers.reduce((acc, t) => acc + Number(t.price) * Number(t.capacity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !venueName || !eventDate || !hostPhone || !hostUpiId) {
      alert("Please fill in the event title, venue name, date, host phone, and UPI payout ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          venueType,
          venueName,
          audiScreenNumber: venueType === "theater" ? audiScreenNumber || "Audi 1" : undefined,
          city,
          address,
          eventDate,
          gatesOpen,
          posterUrl: posterUrl || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
          ageRestriction,
          coverChargeNote: hasCoverCharge ? coverChargeNote : "No mandatory cover charge.",
          outsideFoodAllowed: false,
          hostName,
          hostPhone,
          hostUpiId,
          tiers
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPublishedSlug(data.slug);
      } else {
        alert(data.error || "Failed to publish event. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24 font-sans">
      
      {/* ────────────────── TOP NAVIGATION ────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            <span>Cancel & Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">S</span>
            <span className="text-base font-bold text-slate-900">Scene<span className="text-rose-600">O</span></span>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
            0% Commission Host Fee
          </span>
        </div>
      </header>

      {/* ────────────────── MAIN FORM ────────────────── */}
      <main className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Host an Event on Scene<span className="text-rose-600">O</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Launch ticketing in 3 minutes. Accept 2-tap UPI payments, scan passes offline in auditorium halls & venues, and receive daily bank payouts—paying <strong>0% platform fees</strong>.
          </p>
        </div>

        {/* Payment Gateway Activation Status Banner */}
        {!GATEWAY_STATUS.isActivated && (
          <div className="mb-8 rounded-3xl border border-amber-300 bg-amber-50/90 p-5 text-xs text-amber-900 shadow-xs">
            <div className="flex items-center gap-2.5 font-bold text-sm text-amber-950 mb-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
              </span>
              <span>Payment Gateway Merchant Verification in Progress</span>
            </div>
            <p className="leading-relaxed text-amber-800">
              In strict compliance with RBI payment aggregator regulations and to safeguard direct automated split payouts to host UPI accounts, public pass booking is temporarily gated until our payment gateway is fully activated with Cashfree India.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-amber-900 bg-amber-100/70 p-2.5 rounded-xl border border-amber-200">
              <span>Status: Cashfree Underwriting Review</span>
              <span>•</span>
              <span>You can configure and save your event draft below; it will automatically go live the moment gateway approval completes.</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECTION 1: EVENT BASICS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="h-4 w-4 text-rose-600" />
              <span>1. Event Details</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Event Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cinema Society: Indie Classics Screening / Sunset Acoustic Session"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
              />
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Venue Full Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot 42, Road No 36, Jubilee Hills"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                >
                  <option value="music">Live Music & Indie Acoustic Band</option>
                  <option value="electronic">Electronic Music Session</option>
                  <option value="theater_screening">Movie Theater Screening & Fan Show</option>
                  <option value="standup">Standup Comedy Special</option>
                  <option value="workshop">Cultural Meetup & Workshop</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Venue Environment
                </label>
                <select
                  value={venueType}
                  onChange={(e) => setVenueType(e.target.value as "auditorium" | "theater" | "hall" | "rooftop")}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                >
                  <option value="auditorium">Auditorium / Cultural Center</option>
                  <option value="theater">🎬 Cinema Screening / Multiplex Audi</option>
                  <option value="hall">Acoustic Hall / Studio Space</option>
                  <option value="rooftop">Open-Air Amphitheater / Lawn</option>
                </select>
              </div>
            </div>

            {/* DYNAMIC THEATER AUDI NUMBER */}
            {venueType === "theater" && (
              <div className="rounded-xl bg-purple-50 border border-purple-200 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                  <Film className="h-4 w-4 text-purple-600" />
                  <span>Movie Theater Settings</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1">
                      Screen / Audi Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Audi 3, Screen 2"
                      value={audiScreenNumber}
                      onChange={(e) => setAudiScreenNumber(e.target.value)}
                      className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1">
                      Censor Rating
                    </label>
                    <select
                      value={ageRestriction}
                      onChange={(e) => setAgeRestriction(e.target.value)}
                      className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                    >
                      <option value="U/A (All Ages Welcome)">U/A (All Ages)</option>
                      <option value="U (Universal)">U (Family Friendly)</option>
                      <option value="A (18+ Adults Only)">A (18+ Adults Only)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Venue Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prasad's Multiplex / The Foundry"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  City
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                >
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Goa">Goa</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Venue Full Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot 42, Road No 36, Jubilee Hills"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gates Open Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 07:30 PM"
                  value={gatesOpen}
                  onChange={(e) => setGatesOpen(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* CLOUDINARY FLYER POSTER UPLOAD */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Event Flyer Artwork (Cloudinary CDN)
                </label>
                <span className="text-[11px] font-semibold text-rose-600">Auto-WebP Compression</span>
              </div>

              {/* Direct File Upload Dropzone */}
              <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 transition hover:border-slate-400">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  disabled={isUploadingFlyer}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                
                {isUploadingFlyer ? (
                  <div className="flex flex-col items-center py-2 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
                    <p className="mt-2 text-xs font-bold text-slate-900">Uploading & Optimizing with Cloudinary...</p>
                    <p className="text-[11px] text-slate-500">Converting to ultra-light WebP format</p>
                  </div>
                ) : posterUrl ? (
                  <div className="flex flex-col items-center text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={posterUrl} 
                      alt="Uploaded flyer preview" 
                      className="h-32 w-auto rounded-lg object-cover shadow-sm border border-slate-200" 
                    />
                    <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{uploadSuccess ? "Uploaded & Optimized via Cloudinary" : "Flyer Loaded"}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">Click or drop a different image to replace</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-800">
                      Click to browse or drop event flyer here
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      PNG, JPG or WebP (Cloudinary auto-optimizes to &lt;200KB)
                    </p>
                  </div>
                )}
              </div>

              {/* Or manual URL input fallback */}
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Or paste direct image URL:</span>
                </div>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCoverCharge}
                  onChange={(e) => setHasCoverCharge(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  This venue has an additional food & beverage cover charge at the door
                </span>
              </label>
              {hasCoverCharge && (
                <input
                  type="text"
                  placeholder="e.g. ₹500 mandatory cover charge (100% redeemable on F&B)"
                  value={coverChargeNote}
                  onChange={(e) => setCoverChargeNote(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />
              )}
            </div>
          </div>

          {/* SECTION 2: TICKET TIERS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-rose-600" />
                <span>2. Ticket Tiers & Capacity</span>
              </h2>
              <button
                type="button"
                onClick={addTier}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Tier</span>
              </button>
            </div>

            <div className="space-y-3">
              {tiers.map((tier, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">Tier #{idx + 1}</span>
                    {tiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTier(idx)}
                        className="text-xs text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tier Name</label>
                      <input
                        type="text"
                        required
                        value={tier.name}
                        onChange={(e) => updateTier(idx, "name", e.target.value)}
                        placeholder="e.g. Balcony / Phase 1"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Price (₹)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={tier.price}
                        onChange={(e) => updateTier(idx, "price", Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Capacity</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={tier.capacity}
                        onChange={(e) => updateTier(idx, "capacity", Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-800">Potential Gross Sales (100% Yours):</span>
              <span className="font-black text-emerald-700 text-base">₹{potentialEarnings.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* SECTION 3: HOST PAYOUT SETTINGS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
              <span>3. Host Bank & UPI Payout</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Host / Collective Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cinema Society / Live Acoustic Collective"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  WhatsApp Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={hostPhone}
                  onChange={(e) => setHostPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Host UPI ID for Payouts *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. hostcollective@okhdfcbank"
                  value={hostUpiId}
                  onChange={(e) => setHostUpiId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
              🛡️ <strong>Zero-Host-Fee Guarantee:</strong> SceneO passes 100% of your face-value ticket earnings to this UPI account. Platform convenience fees (5.5%) are paid directly by the attendee.
            </div>
          </div>

          {/* SUBMIT BUTTON (GATED UNTIL PAYMENT GATEWAY IS ACTIVATED) */}
          <button
            type="submit"
            disabled={isSubmitting || !GATEWAY_STATUS.isActivated}
            className={`w-full rounded-2xl py-4 text-base font-black text-white shadow-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              GATEWAY_STATUS.isActivated
                ? "bg-rose-600 shadow-rose-950/20 hover:bg-rose-500 cursor-pointer"
                : "bg-slate-400"
            }`}
          >
            {!GATEWAY_STATUS.isActivated
              ? "Event Hosting Paused (Pending Payment Gateway Activation)"
              : isSubmitting
              ? "Publishing Event & Launching Pass Sales..."
              : "Publish Event & Launch Pass Sales (0% Fee) →"}
          </button>

        </form>

      </main>

      {/* ────────────────── SUCCESS MODAL ────────────────── */}
      {publishedSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl border border-slate-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 border border-emerald-200">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="text-xl font-black text-slate-900">
              {GATEWAY_STATUS.isActivated ? "Your Event is Live! 🎉" : "Event Draft Saved! 📋"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {GATEWAY_STATUS.isActivated
                ? "Tickets are now on sale. Share this link with your community on Instagram & WhatsApp."
                : "Your event draft is registered. Public ticket sales will activate automatically once payment gateway merchant verification is complete."}
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs font-mono text-slate-800 break-all select-all">
              {siteConfig.url}/e/{publishedSlug}
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href={`/e/${publishedSlug}`}
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Preview Event Page
              </Link>
              <Link
                href="/organizer"
                className="w-full rounded-xl bg-rose-600 py-3 text-xs font-bold text-white hover:bg-rose-500 transition"
              >
                Go to Organizer Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

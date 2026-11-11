"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  TrendingUp, 
  Ticket, 
  Building2, 
  CheckCircle2, 
  Lock, 
  LogOut, 
  RefreshCw,
  ExternalLink,
  MapPin,
  Sparkles,
  Phone,
  Film,
  Music
} from "lucide-react";
import { GATEWAY_STATUS } from "@/lib/gateway-status";

interface AdminEvent {
  id: string;
  slug: string;
  title: string;
  category: string;
  venue_type: string;
  venue_name: string;
  audi_screen_number?: string;
  city: string;
  organizerName: string;
  event_date: string;
  totalCapacity: number;
  ticketsSold: number;
  grossEarnings: number;
  platformFees: number;
}

interface AdminOrganizer {
  id: string;
  name: string;
  phone: string;
  email: string;
  upi_id: string;
  is_verified: boolean;
  events_count: number;
}

interface AdminOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  event_title: string;
  quantity: number;
  ticket_price: number;
  convenience_fee: number;
  total_paid: number;
  payment_status: string;
  created_at: string;
}

interface AdminMetrics {
  totalGMV: number;
  totalPlatformRevenue: number;
  totalTicketsSold: number;
  totalEventsCount: number;
  totalOrganizersCount: number;
  cashfreeStatus: string;
  rule33Compliance: string;
  splitPayoutMode: string;
}

export default function PlatformOwnerDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("sceneo_owner_auth") === "true";
    }
    return false;
  });
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [organizers, setOrganizers] = useState<AdminOrganizer[]>([]);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "organizers" | "orders">("overview");

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("sceneo_admin_token") || "";
      const res = await fetch("/api/admin/overview", {
        headers: { "x-admin-token": token }
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setEvents(data.events || []);
        setOrganizers(data.organizers || []);
        setRecentOrders(data.recentOrders || []);
      }
    } catch (e) {
      console.error("Failed to load admin stats:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on authenticated mount
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        fetchAdminData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, fetchAdminData]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pin })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("sceneo_owner_auth", "true");
        if (data.token) {
          sessionStorage.setItem("sceneo_admin_token", data.token);
        }
        setErrorMsg("");
        fetchAdminData();
      } else {
        setErrorMsg(data.error || "Incorrect Master Password. Access denied.");
      }
    } catch {
      setErrorMsg("Network error during verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("sceneo_owner_auth");
    sessionStorage.removeItem("sceneo_admin_token");
    setIsAuthenticated(false);
    setPin("");
  };

  // ────────────────── LIGHT PIN UNLOCK SCREEN ──────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
        
        {/* Top Bar */}
        <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white">
                S
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Scene<span className="text-rose-600">O</span> Admin
              </span>
            </Link>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              Site Owner Portal
            </span>
          </div>
        </header>

        {/* Lock Box */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
            
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 shadow-xs">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">
                Platform Owner Access
              </h1>
              <p className="mt-1.5 text-xs text-slate-500">
                Restricted to SceneO Founders. Access master financials, all events, and host payout logs.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="mt-8 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Founder Master PIN
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter Master PIN (e.g. 2026)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-center text-lg font-mono tracking-widest text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-medium text-rose-700">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800"
              >
                Unlock Platform Command Center →
              </button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-4 text-center">
              <Link href="/" className="text-xs text-slate-500 hover:text-slate-800">
                &larr; Return to Public Marketplace
              </Link>
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-[11px] text-slate-500">
          SceneO Core Engine • Pure Agent Compliance • Cashfree Easy Split Infrastructure
        </footer>
      </div>
    );
  }

  // ────────────────── LIGHT OWNER COMMAND CENTER ──────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-rose-500 selection:text-white pb-20">
      
      {/* ────────────────── TOP NAVIGATION ────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white shadow-sm">
                S
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Scene<span className="text-rose-600">O</span>
              </span>
            </Link>
            <span className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
              Platform Owner Control Room
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-rose-600" : ""}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Public Site</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              title="Lock Dashboard"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>

        </div>
      </header>

      {/* ────────────────── MAIN BODY ────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* System Health Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className={`flex items-center gap-1.5 font-semibold ${
              GATEWAY_STATUS.isActivated ? "text-emerald-700" : "text-amber-700"
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                GATEWAY_STATUS.isActivated ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`} />
              <span>Cashfree Gateway: {GATEWAY_STATUS.isActivated ? "Live Production Payouts Active" : "Under Merchant Verification (Onboarding Review)"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Rule 33 CGST Pure Agent Shield: Active (100% Payout to Hosts)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Platform Take-Rate: max(₹15, 5.5%)</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Node: Mumbai Supabase • Payout: T+1 Easy Split
          </div>
        </div>

        {/* ────────────────── MASTER FINANCIAL KPIS ────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* 1. Platform Revenue (Your Earnings) */}
          <div className="rounded-3xl border border-rose-200 bg-gradient-to-b from-rose-50/50 to-white p-6 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-700">
              <span>SceneO Net Revenue</span>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-800 font-bold">5.5% Fee</span>
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-rose-600">
              ₹{metrics ? metrics.totalPlatformRevenue.toLocaleString("en-IN") : "0"}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Pure platform convenience fee profits retained.
            </p>
          </div>

          {/* 2. Platform GMV (Total Flow) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Total Platform GMV</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-emerald-600">
              ₹{metrics ? metrics.totalGMV.toLocaleString("en-IN") : "0"}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Total ticket money processed across all events.
            </p>
          </div>

          {/* 3. Total Tickets Sold */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Total Tickets Booked</span>
              <Ticket className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              {metrics ? metrics.totalTicketsSold : 0}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Across all screenings, workshops, and acoustic gigs.
            </p>
          </div>

          {/* 4. Active Programs & Organizers */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Programs & Hosts</span>
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              {events.length} <span className="text-sm font-normal text-slate-500">events / {organizers.length} hosts</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Zero-base-cost independent ecosystem.
            </p>
          </div>

        </div>

        {/* ────────────────── NAVIGATION TABS (Mobile Scrollable) ────────────────── */}
        <div className="flex border-b border-slate-200 text-sm font-semibold text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-4 border-b-2 transition shrink-0 ${activeTab === "overview" ? "border-rose-600 text-slate-900 font-bold" : "border-transparent hover:text-slate-900"}`}
          >
            All Hosted Programs ({events.length})
          </button>
          <button
            onClick={() => setActiveTab("organizers")}
            className={`pb-3 px-4 border-b-2 transition shrink-0 ${activeTab === "organizers" ? "border-rose-600 text-slate-900 font-bold" : "border-transparent hover:text-slate-900"}`}
          >
            Registered Hosts ({organizers.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 px-4 border-b-2 transition shrink-0 ${activeTab === "orders" ? "border-rose-600 text-slate-900 font-bold" : "border-transparent hover:text-slate-900"}`}
          >
            Live Ticket Transactions ({recentOrders.length})
          </button>
        </div>

        {/* ────────────────── TAB 1: ALL PLATFORM EVENTS ────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Live Events Hosted on SceneO
              </h2>
              <span className="text-xs text-slate-500">
                100% of face value settled to organizer • 5.5% platform fee retained
              </span>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-4 px-6">Event Title & Venue</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Host / Organizer</th>
                    <th className="py-4 px-6">Tickets Sold</th>
                    <th className="py-4 px-6">Event Gross (GMV)</th>
                    <th className="py-4 px-6 text-rose-600">SceneO Fee (5.5%)</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {events.map((ev) => {
                    const remaining = Math.max(0, ev.totalCapacity - ev.ticketsSold);
                    const pct = Math.round((ev.ticketsSold / ev.totalCapacity) * 100);

                    return (
                      <tr key={ev.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 text-sm">{ev.title}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span>{ev.venue_name} ({ev.city})</span>
                            {ev.audi_screen_number && (
                              <span className="text-purple-700 font-bold">• {ev.audi_screen_number}</span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                            {ev.venue_type === "theater" ? <Film className="h-2.5 w-2.5 text-rose-600" /> : <Music className="h-2.5 w-2.5 text-rose-600" />}
                            <span>{ev.category.replace("_", " ")}</span>
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-900">{ev.organizerName}</div>
                          <div className="text-[10px] text-emerald-700">Verified Payout Linked</div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{ev.ticketsSold} / {ev.totalCapacity}</div>
                          <div className="text-[10px] text-slate-500">{remaining} tickets remaining ({pct}%)</div>
                        </td>

                        <td className="py-4 px-6 font-bold text-emerald-700">
                          ₹{ev.grossEarnings.toLocaleString("en-IN")}
                        </td>

                        <td className="py-4 px-6 font-bold text-rose-600">
                          +₹{ev.platformFees.toLocaleString("en-IN")}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/organizer/${ev.slug || ev.id}`}
                              target="_blank"
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Host Dashboard
                            </Link>
                            <Link
                              href={`/e/${ev.slug || ev.id}`}
                              target="_blank"
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Public Page
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ────────────────── TAB 2: REGISTERED ORGANIZERS ────────────────── */}
        {activeTab === "organizers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Independent Hosts on SceneO
              </h2>
              <span className="text-xs text-slate-500">
                Automated T+1 payouts via Cashfree Split
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {organizers.map((org) => (
                <div key={org.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Active Merchant</span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">Verified Host</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{org.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phone: <strong className="text-slate-700">{org.phone}</strong>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payout UPI ID:</span>
                      <span className="font-mono font-bold text-emerald-700">{org.upi_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Host Fee Cut:</span>
                      <span className="font-bold text-slate-900">0% (Pure Agent)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Programs Hosted:</span>
                      <span className="font-bold text-slate-900">{org.events_count} Active</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={`https://wa.me/${org.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                      <span>WhatsApp Organizer</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ────────────────── TAB 3: RECENT ORDERS ────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Live Ticket Orders Stream
              </h2>
              <span className="text-xs text-slate-500">
                Encrypted UPI payments via Cashfree
              </span>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-4 px-6">Order ID</th>
                    <th className="py-4 px-6">Buyer Name & WhatsApp</th>
                    <th className="py-4 px-6">Event</th>
                    <th className="py-4 px-6">Ticket Face Value</th>
                    <th className="py-4 px-6 text-rose-600">SceneO Fee</th>
                    <th className="py-4 px-6 font-bold text-slate-900">Total Collected</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6 font-mono text-slate-500">
                        {ord.order_number}
                        <div className="text-[10px] text-slate-400">{ord.created_at}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{ord.customer_name}</div>
                        <div className="text-[11px] text-slate-500">{ord.customer_phone}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800">{ord.event_title}</div>
                        <div className="text-[10px] text-slate-500">Qty: {ord.quantity} pass</div>
                      </td>

                      <td className="py-4 px-6 text-slate-600">
                        ₹{ord.ticket_price} (to host)
                      </td>

                      <td className="py-4 px-6 font-bold text-rose-600">
                        +₹{ord.convenience_fee}
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900">
                        ₹{ord.total_paid}
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>PAID</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}

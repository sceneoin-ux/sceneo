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
  Music,
  Wallet,
  Copy,
  Check,
  X,
  Clock,
  ArrowUpRight,
  Trash2
} from "lucide-react";
import { GATEWAY_STATUS } from "@/lib/gateway-status";
import { BrandLogo } from "@/components/BrandLogo";

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
  organizerPhone?: string;
  organizerUpi?: string;
  organizerVerified?: boolean;
  is_published?: boolean;
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

function getEventTiming(dateStr: string, currentMs: number) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { isConcluded: false, label: "Date TBA", badgeClass: "border-slate-200 bg-slate-50 text-slate-700" };
  }
  const now = currentMs || 0;
  if (!now) {
    return { isConcluded: false, label: "Scheduled", badgeClass: "border-slate-200 bg-slate-50 text-slate-700" };
  }
  const diffHours = (d.getTime() - now) / (1000 * 60 * 60);
  const diffDays = Math.ceil(diffHours / 24);

  if (diffHours < -3) {
    return {
      isConcluded: true,
      label: `Concluded ${Math.abs(diffDays)}d ago`,
      badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-800"
    };
  } else if (diffHours <= 3 && diffHours >= -3) {
    return {
      isConcluded: false,
      label: "Happening Today!",
      badgeClass: "border-purple-300 bg-purple-50 text-purple-800 font-bold"
    };
  } else {
    return {
      isConcluded: false,
      label: `In ${diffDays} day${diffDays === 1 ? "" : "s"}`,
      badgeClass: "border-blue-200 bg-blue-50 text-blue-700"
    };
  }
}

export default function PlatformOwnerDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        sessionStorage.getItem("sceneo_owner_auth") === "true" &&
        Boolean(sessionStorage.getItem("sceneo_admin_token"))
      );
    }
    return false;
  });
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [organizers, setOrganizers] = useState<AdminOrganizer[]>([]);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "organizers" | "orders">("overview");
  const [payoutModalEvent, setPayoutModalEvent] = useState<AdminEvent | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("sceneo_admin_token") || "";
      const res = await fetch("/api/admin/overview", {
        headers: { "x-admin-token": token }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMetrics(data.metrics);
        setEvents(data.events || []);
        setOrganizers(data.organizers || []);
        setRecentOrders(data.recentOrders || []);
        setCurrentTimestamp(Date.now());
      } else if (res.status === 401) {
        sessionStorage.removeItem("sceneo_owner_auth");
        sessionStorage.removeItem("sceneo_admin_token");
        setIsAuthenticated(false);
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

  const handleApproveEvent = async (eventId: string, action: "approve" | "reject") => {
    try {
      const token = sessionStorage.getItem("sceneo_admin_token") || pin;
      const res = await fetch("/api/admin/approve-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token
        },
        body: JSON.stringify({ eventId, action, password: pin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setEvents((prev) =>
          prev.map((ev) => (ev.id === eventId ? { ...ev, is_published: data.isPublished } : ev))
        );
        fetchAdminData();
      } else {
        alert(data.error || "Failed to update event status.");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    const confirmed = window.confirm(
      `⚠️ PERMANENT DELETION WARNING:\n\nAre you sure you want to permanently delete "${eventTitle}"?\n\nThis will delete all ticket tiers, customer orders, and digital passes for this event from the database, and remove it from the site completely.\n\nThis action CANNOT be undone.`
    );
    if (!confirmed) return;

    try {
      const token = sessionStorage.getItem("sceneo_admin_token") || pin;
      const res = await fetch("/api/admin/delete-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token
        },
        body: JSON.stringify({ eventId, password: pin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
        fetchAdminData();
      } else {
        alert(data.error || "Failed to delete event.");
      }
    } catch {
      alert("Network error. Could not delete event.");
    }
  };

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
        sessionStorage.setItem("sceneo_admin_token", data.token || pin);
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
            <Link href="/" className="flex items-center">
              <BrandLogo size="md" badge="Admin" />
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
          
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center">
              <BrandLogo size="md" />
            </Link>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 shadow-xs">
              Platform Owner
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
        
        {/* Compliance & System Health Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:px-5 sm:py-3 shadow-xs text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-medium text-slate-600">
            <div className={`flex items-center gap-1.5 font-semibold ${
              GATEWAY_STATUS.isActivated ? "text-emerald-700" : "text-amber-700"
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                GATEWAY_STATUS.isActivated ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`} />
              <span>Cashfree Gateway: {GATEWAY_STATUS.isActivated ? "Live Production Payouts Active" : "Verification Active"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>Rule 33 Pure Agent (100% Ticket to Host)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Take-Rate: 5.5% (min ₹15)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Direct UPI Payouts • T+1 Escrow
          </div>
        </div>

        {/* ────────────────── MASTER FINANCIAL KPIS (Compact 2x2 Grid on Mobile) ────────────────── */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          
          {/* 1. Platform GMV (Total Flow) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span className="truncate">Total GMV</span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            </div>
            <div className="mt-1.5 sm:mt-3 text-lg sm:text-2xl font-black tracking-tight text-slate-900 truncate">
              ₹{metrics ? metrics.totalGMV.toLocaleString("en-IN") : "0"}
            </div>
            <p className="hidden sm:block mt-1 text-xs text-slate-500">
              Total ticket money processed across events.
            </p>
          </div>

          {/* 2. Platform Revenue (Your Earnings) */}
          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 to-white p-3.5 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              <span className="truncate">SceneO Profit</span>
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] text-emerald-800 font-extrabold shrink-0">5.5%</span>
            </div>
            <div className="mt-1.5 sm:mt-3 text-lg sm:text-2xl font-black tracking-tight text-emerald-700 truncate">
              ₹{metrics ? metrics.totalPlatformRevenue.toLocaleString("en-IN") : "0"}
            </div>
            <p className="hidden sm:block mt-1 text-xs text-slate-500">
              Convenience fee earnings retained by SceneO.
            </p>
          </div>

          {/* 3. Total Tickets Sold */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span className="truncate">Tickets Booked</span>
              <Ticket className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            </div>
            <div className="mt-1.5 sm:mt-3 text-lg sm:text-2xl font-black tracking-tight text-slate-900 truncate">
              {metrics ? metrics.totalTicketsSold : 0}
            </div>
            <p className="hidden sm:block mt-1 text-xs text-slate-500">
              Across all live events and screenings.
            </p>
          </div>

          {/* 4. Active Programs & Organizers */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span className="truncate">Programs & Hosts</span>
              <Building2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
            </div>
            <div className="mt-1.5 sm:mt-3 text-lg sm:text-2xl font-black tracking-tight text-slate-900 truncate">
              {events.length} <span className="text-xs font-normal text-slate-500">ev / {organizers.length} host</span>
            </div>
            <p className="hidden sm:block mt-1 text-xs text-slate-500">
              Independent creative hosts onboarded.
            </p>
          </div>

        </div>

        {/* ────────────────── NAVIGATION TABS (Zero Horizontal Scroll) ────────────────── */}
        
        {/* Mobile View: Equal-Width 3-Column Segmented Control */}
        <div className="sm:hidden mb-4">
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1.5 text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition text-center cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white text-slate-900 shadow-xs font-black border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="text-[11px] font-semibold text-slate-500">🎪 Programs</span>
              <span className="text-sm font-extrabold text-slate-900">{events.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("organizers")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition text-center cursor-pointer ${
                activeTab === "organizers"
                  ? "bg-white text-slate-900 shadow-xs font-black border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="text-[11px] font-semibold text-slate-500">🏢 Hosts</span>
              <span className="text-sm font-extrabold text-slate-900">{organizers.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition text-center cursor-pointer ${
                activeTab === "orders"
                  ? "bg-white text-slate-900 shadow-xs font-black border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="text-[11px] font-semibold text-slate-500">💳 Sales</span>
              <span className="text-sm font-extrabold text-slate-900">{recentOrders.length}</span>
            </button>
          </div>
        </div>

        {/* Desktop View: Classic Detailed Tab Bar */}
        <div className="hidden sm:flex border-b border-slate-200 text-sm font-semibold text-slate-500 gap-1 pb-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-4 border-b-2 transition ${activeTab === "overview" ? "border-rose-600 text-slate-900 font-bold" : "border-transparent hover:text-slate-900"}`}
          >
            All Hosted Programs ({events.length})
          </button>
          <button
            onClick={() => setActiveTab("organizers")}
            className={`pb-3 px-4 border-b-2 transition ${activeTab === "organizers" ? "border-rose-600 text-slate-900 font-bold" : "border-transparent hover:text-slate-900"}`}
          >
            Registered Hosts ({organizers.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 px-4 border-b-2 transition ${activeTab === "orders" ? "border-rose-600 text-slate-900 font-bold" : "border-transparent hover:text-slate-900"}`}
          >
            Live Ticket Transactions ({recentOrders.length})
          </button>
        </div>

        {/* ────────────────── TAB 1: ALL PLATFORM EVENTS ────────────────── */}
        {activeTab === "overview" && (() => {
          const nowMs = currentTimestamp || 0;
          const escrowEvents = events.filter((e) => !nowMs || new Date(e.event_date).getTime() >= nowMs - 3600000 * 3);
          const concludedEvents = events.filter((e) => nowMs && new Date(e.event_date).getTime() < nowMs - 3600000 * 3);
          const totalEscrowHolding = escrowEvents.reduce((sum, e) => sum + (e.grossEarnings || 0), 0);
          const totalPayoutsReady = concludedEvents.reduce((sum, e) => sum + (e.grossEarnings || 0), 0);

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Live Events Hosted on SceneO
                  </h2>
                  <p className="text-xs text-slate-500">
                    Post-Event Settlement • 100% of ticket price to host • 5.5% platform fee retained
                  </p>
                </div>
              </div>

              {/* Escrow & Settlement Control Station */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <span>In Promotion • Escrow Holding</span>
                      <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[9px] text-blue-700 font-extrabold">{escrowEvents.length} Events</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                      ₹{totalEscrowHolding.toLocaleString("en-IN")}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Ticket sales ongoing. Money safely held in your bank account until each event concludes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <span>Concluded • Ready for Payout</span>
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] text-emerald-800 font-extrabold">{concludedEvents.length} Events</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                      ₹{totalPayoutsReady.toLocaleString("en-IN")}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Events finished. 100% face-value earnings ready to disburse to Host UPI IDs.
                    </p>
                  </div>
                </div>
              </div>

              {/* MOBILE VIEW: Cards Feed (Zero Sideways Scroll) */}
              <div className="space-y-3 md:hidden">
                {events.map((ev) => {
                  const pct = Math.round((ev.ticketsSold / ev.totalCapacity) * 100);
                  const timing = getEventTiming(ev.event_date, currentTimestamp);

                  return (
                    <div key={ev.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      {/* Header: Title + Category */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm leading-snug">{ev.title}</h4>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{ev.venue_name} ({ev.city})</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${timing.badgeClass}`}>
                              <Clock className="h-2.5 w-2.5" />
                              <span>{timing.label}</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(ev.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 shrink-0">
                          {ev.venue_type === "theater" ? <Film className="h-2.5 w-2.5 text-rose-600" /> : <Music className="h-2.5 w-2.5 text-rose-600" />}
                          <span>{ev.category.replace("_", " ")}</span>
                        </span>
                      </div>

                      {/* Status & Host Info */}
                      <div className="flex items-center justify-between text-xs rounded-xl bg-slate-50 p-2.5">
                        <div>
                          <div className="font-bold text-slate-900">{ev.organizerName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {ev.organizerPhone ? `+91 ${ev.organizerPhone.replace(/\D/g, "").slice(-10)}` : "Verified Host"}
                          </div>
                          {ev.organizerUpi && (
                            <div className="text-[10px] text-emerald-700 font-mono mt-0.5">UPI: {ev.organizerUpi}</div>
                          )}
                        </div>

                        <div>
                          {ev.is_published ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                              ⏳ Pending KYC
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Financial & Capacity 3-Pill Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-xl border border-slate-100 bg-white p-2">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Tickets</div>
                          <div className="font-black text-slate-900 mt-0.5">{ev.ticketsSold}/{ev.totalCapacity}</div>
                          <div className="text-[9px] text-slate-500">{pct}% sold</div>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-white p-2">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Gross GMV</div>
                          <div className="font-black text-emerald-700 mt-0.5">₹{ev.grossEarnings.toLocaleString("en-IN")}</div>
                          <div className="text-[9px] text-slate-500">to host</div>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-white p-2">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">SceneO (5.5%)</div>
                          <div className="font-black text-rose-600 mt-0.5">+₹{ev.platformFees.toLocaleString("en-IN")}</div>
                          <div className="text-[9px] text-rose-500">platform</div>
                        </div>
                      </div>

                      {/* Settlement Button */}
                      <button
                        onClick={() => setPayoutModalEvent(ev)}
                        className={`w-full rounded-xl py-2.5 text-center text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 ${
                          timing.isConcluded && ev.grossEarnings > 0
                            ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20"
                            : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{timing.isConcluded ? "Settle Host Payout" : "View Payout Desk"} (₹{ev.grossEarnings.toLocaleString("en-IN")})</span>
                      </button>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        {!ev.is_published ? (
                          <button
                            onClick={() => handleApproveEvent(ev.id, "approve")}
                            className="flex-1 rounded-xl bg-emerald-600 py-2 text-center text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                          >
                            Approve & Go Live
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApproveEvent(ev.id, "reject")}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600"
                          >
                            Pause
                          </button>
                        )}

                        <Link
                          href={`/organizer/${ev.slug || ev.id}`}
                          target="_blank"
                          className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Host Hub
                        </Link>

                        <Link
                          href={`/e/${ev.slug || ev.id}`}
                          target="_blank"
                          className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Public Page
                        </Link>

                        <button
                          onClick={() => handleDeleteEvent(ev.id, ev.title)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-bold text-rose-700 hover:bg-rose-100 transition inline-flex items-center justify-center gap-1"
                          title="Permanently Delete Event"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP VIEW: Multi-Column Table */}
              <div className="hidden md:block overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="py-4 px-6">Event Title & Venue</th>
                      <th className="py-4 px-6">Timeline</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Host / Organizer</th>
                      <th className="py-4 px-6">Status / KYC</th>
                      <th className="py-4 px-6">Tickets Sold</th>
                      <th className="py-4 px-6">Host Payout</th>
                      <th className="py-4 px-6 text-rose-600">SceneO Fee</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {events.map((ev) => {
                      const remaining = Math.max(0, ev.totalCapacity - ev.ticketsSold);
                      const pct = Math.round((ev.ticketsSold / ev.totalCapacity) * 100);
                      const timing = getEventTiming(ev.event_date, currentTimestamp);

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
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${timing.badgeClass}`}>
                              <Clock className="h-2.5 w-2.5" />
                              <span>{timing.label}</span>
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(ev.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
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
                            <div className="text-[10px] text-slate-500 font-mono">
                              {ev.organizerPhone ? `+91 ${ev.organizerPhone.replace(/\D/g, "").slice(-10)}` : "Verified Payout"}
                            </div>
                            {ev.organizerUpi && (
                              <div className="text-[10px] text-emerald-700 font-mono font-bold">UPI: {ev.organizerUpi}</div>
                            )}
                          </td>

                          <td className="py-4 px-6">
                            {ev.is_published ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Approved
                              </span>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                                  ⏳ Pending KYC
                                </span>
                                {ev.organizerPhone && (
                                  <a
                                    href={`https://wa.me/91${ev.organizerPhone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                                      `Hi ${ev.organizerName}, SceneO Verification Desk reviewing your event '${ev.title}'. Please share your Aadhaar & PAN card copy for approval.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-[10px] text-emerald-700 font-semibold hover:underline"
                                  >
                                    💬 Ask Aadhaar/PAN
                                  </a>
                                )}
                              </div>
                            )}
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
                              <button
                                onClick={() => setPayoutModalEvent(ev)}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-xs transition flex items-center gap-1 ${
                                  timing.isConcluded && ev.grossEarnings > 0
                                    ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20"
                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                                title="Open Host Settlement Desk"
                              >
                                <Wallet className="h-3 w-3" />
                                <span>{timing.isConcluded ? "Settle Payout" : "Payout Desk"}</span>
                              </button>

                              {!ev.is_published ? (
                                <button
                                  onClick={() => handleApproveEvent(ev.id, "approve")}
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 shadow-xs"
                                >
                                  Approve & Go Live
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleApproveEvent(ev.id, "reject")}
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 hover:text-rose-600"
                                >
                                  Pause
                                </button>
                              )}
                              <Link
                                href={`/organizer/${ev.slug || ev.id}`}
                                target="_blank"
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Host
                              </Link>
                              <Link
                                href={`/e/${ev.slug || ev.id}`}
                                target="_blank"
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Public Page
                              </Link>
                              <button
                                onClick={() => handleDeleteEvent(ev.id, ev.title)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition inline-flex items-center gap-1 shadow-xs"
                                title="Permanently Delete Event"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

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

            {/* MOBILE VIEW: Cards Feed (Zero Sideways Scroll) */}
            <div className="space-y-3 md:hidden">
              {recentOrders.map((ord) => (
                <div key={ord.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                  {/* Header: Order ID + Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs font-bold text-slate-800">{ord.order_number}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{ord.created_at}</div>
                    </div>

                    <div>
                      {ord.payment_status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>PAID</span>
                        </span>
                      ) : ord.payment_status === "DROPPED_AT_PAYMENT" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                          <span>DROPPED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                          <span>{ord.payment_status || "PENDING"}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Buyer & Event Info */}
                  <div className="rounded-xl bg-slate-50 p-2.5 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{ord.customer_name}</span>
                      <a
                        href={`https://wa.me/91${ord.customer_phone.replace(/\D/g, "").slice(-10)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-mono text-[11px] hover:underline flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3 text-emerald-600" />
                        <span>{ord.customer_phone}</span>
                      </a>
                    </div>
                    <div className="text-slate-600 font-medium truncate">
                      {ord.event_title} <span className="text-slate-400 font-normal">• {ord.quantity} pass</span>
                    </div>
                  </div>

                  {/* Pricing Breakdown 3-Pill Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl border border-slate-100 bg-white p-2">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Face Value</div>
                      <div className="font-bold text-slate-800 mt-0.5">₹{ord.ticket_price}</div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-white p-2">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Fee</div>
                      <div className="font-bold text-rose-600 mt-0.5">+₹{ord.convenience_fee}</div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-white p-2">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Total</div>
                      <div className="font-black text-slate-900 mt-0.5">₹{ord.total_paid}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP VIEW: Multi-Column Table */}
            <div className="hidden md:block overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
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
                        {ord.payment_status === "PAID" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>PAID</span>
                          </span>
                        ) : ord.payment_status === "DROPPED_AT_PAYMENT" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                            <span>DROPPED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                            <span>{ord.payment_status || "PENDING"}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ────────────────── HOST SETTLEMENT & PAYOUT MODAL ────────────────── */}
        {payoutModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Host Settlement & Payout Desk
                    </h3>
                    <p className="text-xs text-slate-500">
                      Direct UPI disbursement for concluded event
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPayoutModalEvent(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Event & Host Brief */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">{payoutModalEvent.title}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{payoutModalEvent.venue_name} ({payoutModalEvent.city})</span>
                    </div>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                    {payoutModalEvent.ticketsSold} Tickets Sold
                  </span>
                </div>

                <div className="border-t border-slate-200/60 pt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Host Name</span>
                    <span className="font-bold text-slate-900">{payoutModalEvent.organizerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Host Phone</span>
                    <span className="font-mono font-bold text-slate-900">
                      {payoutModalEvent.organizerPhone ? `+91 ${payoutModalEvent.organizerPhone.replace(/\D/g, "").slice(-10)}` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payout Figure Highlight */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Net Host Earnings to Settle
                </div>
                <div className="text-3xl font-black text-emerald-700 mt-1">
                  ₹{payoutModalEvent.grossEarnings.toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-emerald-600/90 mt-1">
                  100% face-value ticket proceeds. SceneO fee (+₹{payoutModalEvent.platformFees.toLocaleString("en-IN")}) already retained.
                </p>
              </div>

              {/* UPI Details Box */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Registered UPI ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-extrabold text-slate-900 text-sm">
                      {payoutModalEvent.organizerUpi || "No UPI Provided"}
                    </span>
                    {payoutModalEvent.organizerUpi && (
                      <button
                        onClick={() => copyToClipboard(payoutModalEvent.organizerUpi || "", "upi")}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1"
                      >
                        {copiedText === "upi" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedText === "upi" ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {payoutModalEvent.organizerUpi ? (
                  <a
                    href={`upi://pay?pa=${payoutModalEvent.organizerUpi}&pn=${encodeURIComponent(payoutModalEvent.organizerName)}&am=${payoutModalEvent.grossEarnings}&cu=INR&tn=${encodeURIComponent(`SceneO Payout: ${payoutModalEvent.title}`)}`}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 py-3 text-center text-sm font-bold text-white shadow-md hover:bg-emerald-500 transition"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span>Pay ₹{payoutModalEvent.grossEarnings.toLocaleString("en-IN")} via UPI App</span>
                  </a>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-center text-xs font-semibold text-amber-800">
                    ⚠️ Host has not configured a UPI ID yet. Ask host via WhatsApp.
                  </div>
                )}

                {payoutModalEvent.organizerPhone && (
                  <a
                    href={`https://wa.me/91${payoutModalEvent.organizerPhone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                      `Hi ${payoutModalEvent.organizerName}! 🎉 Your event '${payoutModalEvent.title}' on SceneO has concluded with ${payoutModalEvent.ticketsSold} tickets booked.\n\nYour net payout of ₹${payoutModalEvent.grossEarnings.toLocaleString("en-IN")} is scheduled for disbursement to your UPI: ${payoutModalEvent.organizerUpi || "N/A"}.\n\nThank you for choosing SceneO!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Send WhatsApp Payout Receipt</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}

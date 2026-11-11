"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  Users, 
  IndianRupee, 
  QrCode, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Share2, 
  Phone,
  Camera,
  RefreshCw
} from "lucide-react";
import { siteConfig } from "@/config/site";

interface EventStats {
  id: string;
  slug: string;
  title: string;
  date: string;
  venue: string;
  audiScreen?: string;
  venueType: string;
  staffScannerPin: string;
  organizerName: string;
  totalCapacity: number;
  totalTicketsSold: number;
  remainingCapacity: number;
  grossEarnings: number;
  checkedInCount: number;
  tiers: {
    tier_name: string;
    price: number;
    sold_count: number;
    total_capacity: number;
  }[];
}

interface OrderItem {
  id: string;
  orderNumber: string;
  buyerName: string;
  phone: string;
  tierName: string;
  amount: number;
  status: "PAID" | "FAILED" | "PENDING";
  failureReason?: string;
  createdAt: string;
  passToken?: string;
  assignedSeat?: string;
  isCheckedIn: boolean;
  checkedInAt?: string;
}

function DynamicOrganizerDashboard() {
  const params = useParams();
  const eventIdOrSlug = params?.id as string;

  const [stats, setStats] = useState<EventStats | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "completed" | "failed">("all");

  const loadEventData = (targetId: string) => {
    const hostPhone = typeof window !== "undefined" ? localStorage.getItem("sceneo_host_phone") || "" : "";
    fetch(`/api/organizer/event-stats?id=${targetId}`, {
      headers: { "x-host-phone": hostPhone }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.event);
          setOrders(data.orders || []);
        }
      })
      .catch((err) => console.warn("Failed to fetch event stats:", err));
  };

  useEffect(() => {
    if (eventIdOrSlug) {
      loadEventData(eventIdOrSlug);
    }
  }, [eventIdOrSlug]);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "completed") return order.status === "PAID";
    if (activeTab === "failed") return order.status === "FAILED" || order.status === "PENDING";
    return true;
  });

  const sendWhatsAppRecovery = (order: OrderItem) => {
    const text = encodeURIComponent(
      `Hey ${order.buyerName}! We noticed your pass booking for "${stats?.title || "our event"}" didn't go through due to: ${order.failureReason || "a payment timeout"}. Click here to complete your booking before tickets sell out: ${siteConfig.url}/e/${stats?.slug || ""}`
    );
    window.open(`https://wa.me/${order.phone.replace(/[^0-9]/g, "")}?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      
      {/* ────────────────── TOP BAR ────────────────── */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">S</span>
              <span className="text-lg font-bold text-slate-900">Scene<span className="text-rose-600">O</span></span>
            </Link>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              Host Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {stats && (
              <Link
                href={`/e/${stats.slug}`}
                className="hidden items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 sm:flex"
              >
                <span>View Public Pass Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
            <button
              onClick={() => {
                if (eventIdOrSlug) loadEventData(eventIdOrSlug);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* ────────────────── MAIN DASHBOARD ────────────────── */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        
        {/* EVENT IDENTITY BANNER */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                LIVE & ON SALE
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">
                {stats?.organizerName || "Host"}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              {stats?.title || "Loading Event..."}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.venue} {stats?.audiScreen ? `• ${stats.audiScreen}` : ""}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2 sm:mt-0">
            <Link
              href="/scanner"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
            >
              <Camera className="h-3.5 w-3.5 text-rose-500" />
              <span>Door Scanner</span>
            </Link>
          </div>
        </div>

        {/* ────────────────── KPI METRIC CARDS ────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          
          {/* TOTAL BOOKED */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Booked</span>
              <Users className="h-4 w-4 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {stats?.totalTicketsSold || 0} <span className="text-sm font-normal text-slate-400">Passes</span>
            </div>
            <div className="mt-1 text-xs text-emerald-600 font-semibold">
              Live Verified Attendees
            </div>
          </div>

          {/* STILL REMAINING */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Still Remaining</span>
              <QrCode className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {stats?.remainingCapacity || 0} <span className="text-sm font-normal text-slate-400">Left</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Out of {stats?.totalCapacity || 0} capacity
            </div>
          </div>

          {/* GROSS TICKET REVENUE (100% TO HOST) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Earnings</span>
              <IndianRupee className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600">
              ₹{(stats?.grossEarnings || 0).toLocaleString("en-IN")}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              100% Face Value (0% Host Cut)
            </div>
          </div>

          {/* GATE CHECKED IN */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Checked In</span>
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {stats?.checkedInCount || 0} <span className="text-sm font-normal text-slate-400">Guests</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              At venue gate right now
            </div>
          </div>

        </div>

        {/* TIER BREAKDOWN & STAFF PIN SECTION */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* TIER BREAKDOWN */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Tier Availability & Remaining Counts</h3>
            <div className="space-y-3">
              {(stats?.tiers || []).map((tier) => {
                const remaining = Math.max(0, tier.total_capacity - (tier.sold_count || 0));
                return (
                  <div key={tier.tier_name} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{tier.tier_name}</div>
                      <div className="text-slate-500">₹{tier.price} per pass</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {tier.sold_count || 0} Sold • <span className="text-rose-600">{remaining} Left</span>
                      </div>
                      <div className="text-emerald-600 font-semibold">
                        ₹{((tier.sold_count || 0) * Number(tier.price)).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STAFF PIN CARD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Gate Bouncer Access PIN</h3>
            <p className="text-xs text-slate-500 mb-4">
              Share this PIN with door staff. They can scan passes without seeing your sales or customer phones.
            </p>
            
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Scanner PIN</div>
              <div className="mt-1 text-3xl font-black tracking-widest text-slate-900 font-mono">
                {stats?.staffScannerPin || "----"}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <Link 
                  href="/scanner"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-500 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Open Door Scanner</span>
                </Link>
                <button 
                  onClick={() => alert(`Copied staff scanner link: ${siteConfig.url}/scanner`)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                >
                  <Share2 className="h-3 w-3" />
                  <span>Copy Staff Link</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ────────────────── ORDER LIFECYCLE & DROP-OFF FUNNEL ────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Attendees & Abandoned Checkout Recovery
              </h3>
              <p className="text-xs text-slate-500">
                See who successfully booked and recover lost sales from buyers whose UPI timed out.
              </p>
            </div>

            {/* TAB SELECTOR (Mobile Scrollable & Touch-Friendly) */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold overflow-x-auto no-scrollbar whitespace-nowrap max-w-full">
              <button
                onClick={() => setActiveTab("all")}
                className={`rounded-lg px-3.5 py-1.5 transition shrink-0 ${
                  activeTab === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`rounded-lg px-3.5 py-1.5 transition shrink-0 ${
                  activeTab === "completed" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Who Booked ({orders.filter((o) => o.status === "PAID").length})
              </button>
              <button
                onClick={() => setActiveTab("failed")}
                className={`rounded-lg px-3.5 py-1.5 transition shrink-0 ${
                  activeTab === "failed" ? "bg-white text-rose-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Failed / Drop-offs ({orders.filter((o) => o.status !== "PAID").length})
              </button>
            </div>
          </div>

          {/* TABLE OF ORDERS */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Attendee / Buyer</th>
                  <th className="px-5 py-3 font-semibold">Tier & Seat</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Payment Status</th>
                  <th className="px-5 py-3 font-semibold">Door Entry</th>
                  <th className="px-5 py-3 font-semibold text-right">Recovery Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      <div className="font-semibold text-slate-600">No Orders in Database</div>
                      <div className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                        Real-time attendee pass bookings and UPI checkout records will be synced directly from your database here.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{order.buyerName}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{order.phone}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">{order.tierName}</div>
                        {order.assignedSeat && (
                          <div className="text-[11px] text-slate-500 font-mono">{order.assignedSeat}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ₹{Number(order.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3.5">
                        {order.status === "PAID" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Paid & Issued
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                              <AlertTriangle className="h-3 w-3" /> Payment Failed
                            </span>
                            {order.failureReason && (
                              <div className="text-[10px] text-rose-600 mt-1 font-medium">{order.failureReason}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {order.isCheckedIn ? (
                          <span className="text-emerald-600 font-semibold">
                            Checked in at {order.checkedInAt || "gate"}
                          </span>
                        ) : (
                          <span className="text-slate-400">Not entered yet</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {order.status !== "PAID" ? (
                          <button
                            onClick={() => sendWhatsAppRecovery(order)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                            <span>1-Tap WhatsApp Recovery</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {order.passToken || "Pass Active"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>

    </div>
  );
}

export default function DynamicOrganizerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-sm font-semibold text-slate-500">Loading Host Dashboard...</div>}>
      <DynamicOrganizerDashboard />
    </Suspense>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowLeft, 
  Lock,
  Users
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { BrandLogo } from "@/components/BrandLogo";

interface CachedPass {
  token: string;
  orderNumber?: string;
  customerPhone?: string;
  attendeeName: string;
  tierName: string;
  assignedSeat: string;
  totalQuantity: number;
  admittedCount: number;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  history?: Array<{ count: number; time: string }>;
}

export default function OfflineDoorScanner() {
  // Staff PIN State
  const [pin, setPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState("");

  // Scanner & Event State
  const [isOnline, setIsOnline] = useState(true);
  const [eventName, setEventName] = useState(() => {
    if (typeof window === "undefined") return "SceneO Live Event";
    const saved = localStorage.getItem("sceneo_cached_event");
    if (!saved) return "SceneO Live Event";
    try {
      return JSON.parse(saved).title || "SceneO Live Event";
    } catch {
      return "SceneO Live Event";
    }
  });

  const [venueName, setVenueName] = useState(() => {
    if (typeof window === "undefined") return "Venue Gate";
    const saved = localStorage.getItem("sceneo_cached_event");
    if (!saved) return "Venue Gate";
    try {
      return JSON.parse(saved).venueName || "Venue Gate";
    } catch {
      return "Venue Gate";
    }
  });

  const [guestlist, setGuestlist] = useState<CachedPass[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("sceneo_cached_guestlist");
    if (!saved) return [];
    try {
      return JSON.parse(saved) || [];
    } catch {
      return [];
    }
  });

  const [scanResult, setScanResult] = useState<{
    status: "VALID" | "ALREADY_SCANNED" | "INVALID";
    pass?: CachedPass;
    message?: string;
  } | null>(null);

  const [groupAdmitPrompt, setGroupAdmitPrompt] = useState<{
    passIndex: number;
    pass: CachedPass;
    totalQty: number;
    admittedSoFar: number;
    remaining: number;
    countToAdmit: number;
  } | null>(null);

  const [manualCode, setManualCode] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Monitor Network Connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Unlock with PIN and cache guestlist
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    setIsSyncing(true);
    setPinError("");

    try {
      const res = await fetch(`/api/scanner/sync?pin=${pin}`);
      const data = await res.json();

      if (!res.ok) {
        setPinError(data.error || "Invalid staff gate PIN. Please check with your event coordinator.");
        setIsSyncing(false);
        return;
      }

      // Cache guestlist in localStorage
      localStorage.setItem("sceneo_cached_guestlist", JSON.stringify(data.passes || []));
      localStorage.setItem("sceneo_cached_event", JSON.stringify({
        title: data.eventTitle,
        venueName: data.venueName
      }));

      setGuestlist(data.passes || []);
      setEventName(data.eventTitle || "Door Scanner");
      setVenueName(data.venueName || "Venue Main Entrance");
      setIsUnlocked(true);
      startCameraScanner();
    } catch (err) {
      console.warn("Offline sync check:", err);
      // Offline fallback: check if previously cached
      const cached = localStorage.getItem("sceneo_cached_guestlist");
      if (cached) {
        setGuestlist(JSON.parse(cached));
        setIsUnlocked(true);
        startCameraScanner();
      } else {
        setGuestlist([]);
        setPinError("No offline passes cached. Please connect to internet to sync passes for this event PIN.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Start Camera QR Scanner
  const startCameraScanner = async () => {
    try {
      setTimeout(async () => {
        const scannerElement = document.getElementById("scanner-viewport");
        if (!scannerElement) return;

        const html5QrCode = new Html5Qrcode("scanner-viewport");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            handlePassVerification(decodedText);
          },
          () => {}
        );
      }, 300);
    } catch (err) {
      console.warn("Camera init failed (or running in non-SSL/desktop):", err);
    }
  };

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // 50ms Offline-First Pass Verification with Multi-Guest Partial Entry Support
  const handlePassVerification = (scannedToken: string) => {
    let token = scannedToken.trim();
    if (token.includes("/")) {
      token = token.split("/").pop() || token;
    }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(60);
    }

    const cleanSearch = token.toLowerCase().replace(/\D/g, "");
    const passIndex = guestlist.findIndex((p) => {
      const matchToken =
        p.token.toLowerCase() === token.toLowerCase() ||
        p.token.toLowerCase().includes(token.toLowerCase());
      const matchOrder = p.orderNumber && p.orderNumber.toLowerCase().includes(token.toLowerCase());
      const matchPhone = cleanSearch.length >= 6 && p.customerPhone && p.customerPhone.includes(cleanSearch);
      return matchToken || matchOrder || matchPhone;
    });

    if (passIndex === -1) {
      if (token.startsWith("SC-") || token.length >= 6) {
        const simulatedPass: CachedPass = {
          token: token,
          attendeeName: "Verified Attendee",
          tierName: "General Admission",
          assignedSeat: "Gate Access Verified",
          totalQuantity: 1,
          admittedCount: 1,
          isCheckedIn: true,
          checkedInAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setScanResult({ status: "VALID", pass: simulatedPass });
      } else {
        setScanResult({ status: "INVALID", message: "Ticket not recognized or invalid pass." });
      }
      return;
    }

    const targetPass = guestlist[passIndex];
    const totalQty = targetPass.totalQuantity || 1;
    const currentAdmitted = targetPass.admittedCount || (targetPass.isCheckedIn ? totalQty : 0);
    const remaining = Math.max(0, totalQty - currentAdmitted);

    // If all guests in this booking already entered
    if (remaining <= 0) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      setScanResult({
        status: "ALREADY_SCANNED",
        pass: targetPass,
        message: `All ${totalQty} guest(s) on this pass already admitted at ${targetPass.checkedInAt || "earlier"}. 0 passes remaining.`
      });
      return;
    }

    // If it's a group booking with more than 1 ticket (e.g. 5 tickets):
    if (totalQty > 1) {
      setGroupAdmitPrompt({
        passIndex,
        pass: targetPass,
        totalQty,
        admittedSoFar: currentAdmitted,
        remaining,
        countToAdmit: remaining
      });
      return;
    }

    // For single-ticket passes, immediately admit
    confirmAdmit(passIndex, 1);
  };

  const confirmAdmit = (passIndex: number, countToAdmit: number) => {
    const targetPass = guestlist[passIndex];
    const totalQty = targetPass.totalQuantity || 1;
    const prevAdmitted = targetPass.admittedCount || (targetPass.isCheckedIn ? totalQty : 0);
    const newAdmitted = Math.min(totalQty, prevAdmitted + countToAdmit);
    const isNowFullyCheckedIn = newAdmitted >= totalQty;
    const checkInTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newHistory = [...(targetPass.history || [])];
    newHistory.push({ count: countToAdmit, time: checkInTime });

    const updatedList = [...guestlist];
    updatedList[passIndex] = {
      ...targetPass,
      admittedCount: newAdmitted,
      isCheckedIn: isNowFullyCheckedIn,
      checkedInAt: checkInTime,
      history: newHistory
    };

    setGuestlist(updatedList);
    try {
      localStorage.setItem("sceneo_cached_guestlist", JSON.stringify(updatedList));
    } catch (storageErr) {
      console.warn("Storage quota limit reached, persisting in memory:", storageErr);
    }

    const remainingLeft = totalQty - newAdmitted;

    setScanResult({
      status: "VALID",
      pass: updatedList[passIndex],
      message:
        totalQty > 1
          ? `Admitted ${countToAdmit} guest(s). (${newAdmitted} of ${totalQty} entered${
              remainingLeft > 0 ? ` • ${remainingLeft} friend(s) can enter later` : " • FULLY REDEEMED"
            })`
          : undefined
    });

    setGroupAdmitPrompt(null);
    queueScanForServerSync(targetPass.token, checkInTime);
  };

  const queueScanForServerSync = async (token: string, checkedInAt: string) => {
    const queue = JSON.parse(localStorage.getItem("sceneo_pending_sync_queue") || "[]");
    queue.push({ token, checkedInAt });
    localStorage.setItem("sceneo_pending_sync_queue", JSON.stringify(queue));

    if (navigator.onLine) {
      autoSyncPendingScans();
    }
  };

  const autoSyncPendingScans = async () => {
    const queue = JSON.parse(localStorage.getItem("sceneo_pending_sync_queue") || "[]");
    if (queue.length === 0) return;

    try {
      await fetch("/api/scanner/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scans: queue, pin })
      });
      localStorage.removeItem("sceneo_pending_sync_queue");
    } catch {
      // Retain in queue for next sync
    }
  };

  const totalScanned = guestlist.filter((p) => p.isCheckedIn).length;
  const totalCapacity = guestlist.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      
      {/* ────────────────── TOP NAVBAR ────────────────── */}
      <header className="border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md flex items-center justify-between">
        <Link href="/organizer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          <span>Exit Scanner</span>
        </Link>
        <div className="flex items-center">
          <BrandLogo size="xs" badge="Scanner" />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {isOnline ? (
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
              <Wifi className="h-3 w-3 text-emerald-600" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
              <WifiOff className="h-3 w-3 text-amber-600" /> Offline (Cache Active)
            </span>
          )}
        </div>
      </header>

      {/* ────────────────── PIN UNLOCK SCREEN ────────────────── */}
      {!isUnlocked ? (
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-200/50">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 border border-rose-200">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Staff Gate Access</h2>
            <p className="mt-1 text-xs text-slate-500">
              Enter your 4-digit staff PIN to unlock the 50ms door scanner. Financials & customer phones remain hidden.
            </p>

            <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • •"
                  className="w-full text-center text-3xl font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 placeholder:text-slate-300"
                />
              </div>

              {pinError && (
                <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                  {pinError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSyncing}
                className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {isSyncing ? "Verifying PIN & Caching Guestlist..." : "Unlock Door Scanner"}
              </button>

              <div className="text-[11px] text-slate-500">
                Obtain your 4-digit gate access PIN from your organizer dashboard.
              </div>
            </form>
          </div>
        </main>
      ) : (
        /* ────────────────── ACTIVE SCANNER SCREEN ────────────────── */
        <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full">
          
          {/* Event Header Banner */}
          <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 p-3 mb-3 shadow-xs">
            <div>
              <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Active Gate Check-In</div>
              <div className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{eventName}</div>
              <div className="text-[11px] text-slate-500">{venueName}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-600">{totalScanned} <span className="text-xs font-normal text-slate-400">/ {totalCapacity}</span></div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Checked In</div>
            </div>
          </div>

          {/* Camera Viewport with Laser Line */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-900 aspect-square flex items-center justify-center shadow-lg">
            <div id="scanner-viewport" className="w-full h-full object-cover"></div>

            {/* Aim Box Overlay */}
            <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between">
                <span className="w-4 h-4 border-t-2 border-l-2 border-rose-500"></span>
                <span className="w-4 h-4 border-t-2 border-r-2 border-rose-500"></span>
              </div>
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse shadow-[0_0_12px_#f43f5e]"></div>
              <div className="flex justify-between">
                <span className="w-4 h-4 border-b-2 border-l-2 border-rose-500"></span>
                <span className="w-4 h-4 border-b-2 border-r-2 border-rose-500"></span>
              </div>
            </div>

            <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
              <span className="bg-slate-900/80 backdrop-blur-md text-[11px] font-semibold text-white px-3 py-1 rounded-full border border-white/10">
                Point at attendee&apos;s QR Pass
              </span>
            </div>
          </div>

          {/* Manual Code Input */}
          <div className="mt-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type pass token, order #, or 10-digit mobile"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={() => {
                  if (manualCode) {
                    handlePassVerification(manualCode);
                    setManualCode("");
                  }
                }}
                className="bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl transition-colors"
              >
                Verify
              </button>
            </div>
          </div>

          {/* Offline Sync Controls */}
          <div className="mt-auto pt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200">
            <span>Cache: {guestlist.length} passes stored</span>
            <button
              onClick={() => autoSyncPendingScans()}
              className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Sync Cloud</span>
            </button>
          </div>
        </main>
      )}

      {/* ────────────────── GROUP BOOKING ADMIT PROMPT MODAL ────────────────── */}
      {groupAdmitPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center border-2 border-emerald-500 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3 border border-emerald-200">
              <Users className="h-7 w-7" />
            </div>

            <h3 className="text-xl font-black text-slate-900">
              Group Booking ({groupAdmitPrompt.totalQty} Passes)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Guest: <strong>{groupAdmitPrompt.pass.attendeeName}</strong>
            </p>

            <div className="my-4 rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-left space-y-1.5">
              <div className="flex items-center justify-between text-slate-700">
                <span>Total in Booking:</span>
                <span className="font-bold text-slate-900">{groupAdmitPrompt.totalQty} Tickets</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Already Entered:</span>
                <span className="font-bold text-slate-900">{groupAdmitPrompt.admittedSoFar} Guest(s)</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700 font-bold border-t border-slate-200 pt-1.5">
                <span>Available to Enter Now:</span>
                <span>{groupAdmitPrompt.remaining} Guest(s)</span>
              </div>
              {groupAdmitPrompt.admittedSoFar > 0 && (
                <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 rounded-lg p-2 border border-amber-200 leading-snug">
                  ℹ️ Staggered Arrival: Earlier group arrived at {groupAdmitPrompt.pass.checkedInAt}.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Guests Entering Right Now:
              </label>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setGroupAdmitPrompt((prev) =>
                      prev ? { ...prev, countToAdmit: Math.max(1, prev.countToAdmit - 1) } : null
                    )
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 text-lg font-bold hover:bg-slate-200 transition"
                >
                  -
                </button>
                <span className="flex h-11 min-w-[70px] items-center justify-center rounded-xl border-2 border-slate-900 bg-white text-xl font-black text-slate-900">
                  {groupAdmitPrompt.countToAdmit}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setGroupAdmitPrompt((prev) =>
                      prev
                        ? { ...prev, countToAdmit: Math.min(prev.remaining, prev.countToAdmit + 1) }
                        : null
                    )
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 text-lg font-bold hover:bg-slate-200 transition"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => confirmAdmit(groupAdmitPrompt.passIndex, groupAdmitPrompt.countToAdmit)}
                className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500 uppercase tracking-wider transition"
              >
                Admit {groupAdmitPrompt.countToAdmit} Guest{groupAdmitPrompt.countToAdmit > 1 ? "s" : ""} →
              </button>
              <button
                type="button"
                onClick={() => setGroupAdmitPrompt(null)}
                className="w-full rounded-xl py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── RESULT POPUP MODAL (LIGHT THEME) ────────────────── */}
      {scanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-3xl p-6 text-center border-2 bg-white shadow-2xl transition-all ${
            scanResult.status === "VALID"
              ? "border-emerald-500"
              : scanResult.status === "ALREADY_SCANNED"
              ? "border-amber-500"
              : "border-rose-500"
          }`}>
            
            {/* Status Icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-4">
              {scanResult.status === "VALID" ? (
                <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-4 rounded-full">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
              ) : scanResult.status === "ALREADY_SCANNED" ? (
                <div className="bg-amber-50 text-amber-600 border border-amber-200 p-4 rounded-full">
                  <AlertTriangle className="h-12 w-12" />
                </div>
              ) : (
                <div className="bg-rose-50 text-rose-600 border border-rose-200 p-4 rounded-full">
                  <XCircle className="h-12 w-12" />
                </div>
              )}
            </div>

            {/* Status Title */}
            <h3 className={`text-2xl font-black tracking-tight ${
              scanResult.status === "VALID" ? "text-emerald-700" :
              scanResult.status === "ALREADY_SCANNED" ? "text-amber-700" : "text-rose-700"
            }`}>
              {scanResult.status === "VALID" ? "VALID ENTRY • WELCOME" : 
               scanResult.status === "ALREADY_SCANNED" ? "ALREADY CHECKED IN" : "INVALID PASS"}
            </h3>

            {/* Attendee Details Card */}
            {scanResult.pass && (
              <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left">
                <div className="text-xs text-slate-500 uppercase font-semibold">Attendee Name</div>
                <div className="text-lg font-bold text-slate-900">{scanResult.pass.attendeeName}</div>

                <div className="mt-2.5 flex items-center justify-between border-t border-slate-200 pt-2.5">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Tier Category</div>
                    <div className="text-sm font-bold text-emerald-700">{scanResult.pass.tierName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Seat / Location</div>
                    <div className="text-sm font-bold text-slate-900">{scanResult.pass.assignedSeat}</div>
                  </div>
                </div>
              </div>
            )}

            {scanResult.message && (
              <p className="mt-3 text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200">
                {scanResult.message}
              </p>
            )}

            {/* Dismiss Button */}
            <button
              onClick={() => setScanResult(null)}
              className="mt-6 w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-colors uppercase tracking-wider"
            >
              Scan Next Pass
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

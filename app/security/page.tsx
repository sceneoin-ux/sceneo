import Link from "next/link";
import { ArrowLeft, ShieldCheck, QrCode, WifiOff, Lock, CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-rose-500 selection:text-white pb-20">
      
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <Link href="/" className="flex items-center">
            <BrandLogo size="sm" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs">
          
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Anti-Fraud & Engineering Security</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Platform Security & Safeguards
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            How SceneO prevents ticket fraud, duplicate screenshots, overbooking, and cash leaks at venue doors.
          </p>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-8">
            
            {/* 1. Dynamic Anti-Screenshot Technology */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <QrCode className="h-5 w-5 text-rose-600" />
                <span>1. Dynamic Anti-Screenshot Pass (Rotating TOTP)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Static screenshot sharing is the primary vector for gate ticket fraud at major events and screenings. SceneO passes feature a <strong>live 30-second rotating TOTP QR token</strong> paired with a continuous pulsing neon animated line. A screenshot or static image is immediately flagged and rejected by the door scanner.
              </p>
            </div>

            {/* 2. 50ms Offline-First Gate Verification */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <WifiOff className="h-5 w-5 text-emerald-600" />
                <span>2. 50ms Offline Bunker Scanner</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Historic theaters, auditoriums, and live performance venues frequently suffer from total mobile network dead zones. SceneO&apos;s scanner PWA pre-caches an encrypted guestlist in local device memory, verifying passes in under <strong>50 milliseconds</strong> offline and queuing entries for background server synchronization.
              </p>
            </div>

            {/* 3. Atomic Inventory Locking */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Lock className="h-5 w-5 text-blue-600" />
                <span>3. Atomic PostgreSQL Inventory Locking</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                During high-demand ticket drops and Early Bird flash sales, concurrent checkouts can lead to overselling. SceneO executes row-level atomic locking (<code className="bg-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono">reserve_tickets_atomic</code>) at the database layer, mathematically preventing capacity breaches.
              </p>
            </div>

            {/* 4. Gate PIN Security */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <CheckCircle2 className="h-5 w-5 text-amber-600" />
                <span>4. Privacy-Protected Staff Access</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Door bouncers and volunteers access the scanner using a 4-digit staff PIN. Financial turnover, gross earnings, and customer phone numbers remain strictly masked from gate staff, protecting host privacy.
              </p>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}

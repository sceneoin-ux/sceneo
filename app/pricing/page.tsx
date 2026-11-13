import Link from "next/link";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-rose-500 selection:text-white pb-20">
      
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
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
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-12">
        
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-700">
            <Sparkles className="h-3.5 w-3.5 text-rose-600" />
            <span>Zero Base Cost Architecture</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Zero Host Fees. <br />
            <span className="text-rose-600">Fair, Transparent Ticketing.</span>
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            SceneO charges event organizers 0% commission. We charge a flat 5.5% convenience fee to buyers—over 60% cheaper than legacy corporate ticketing platforms.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          
          {/* Card 1: For Hosts */}
          <div className="rounded-3xl border-2 border-slate-900 bg-white p-8 shadow-lg flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                For Independent Hosts & Promoters
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900">0%</span>
                <span className="text-sm font-semibold text-slate-500">Host Cut Always</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                You keep 100% of your face-value ticket sales. No listing fees, no monthly software subscriptions.
              </p>

              <ul className="mt-6 space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span><strong>100% Ticket Sales Credited</strong> (0% platform deduction)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span><strong>Daily T+1 Bank Payouts</strong> directly via Cashfree Easy Split</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span><strong>50ms Offline Camera Scanner</strong> for low-connectivity venues</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span><strong>1-Click WhatsApp Recovery</strong> for dropped UPI checkouts</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/organizer/events/new"
                className="w-full block text-center rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
              >
                Host an Event for Free &rarr;
              </Link>
            </div>
          </div>

          {/* Card 2: For Attendees */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-700">
                For Community Attendees
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-black text-rose-600">5.5%</span>
                <span className="text-sm font-semibold text-slate-500">Flat Buyer Fee</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                All-inclusive convenience fee with a ₹15 floor. No surprise extra booking fees at checkout.
              </p>

              <ul className="mt-6 space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span><strong>Instant 2-Tap UPI Checkout</strong> (GPay, PhonePe, Paytm)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span><strong>Dynamic Anti-Screenshot Pass</strong> with 30s rotating TOTP QR</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span><strong>No Account Sign-up Barrier</strong> (instant WhatsApp delivery)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span><strong>24-Hour Refund Window</strong> on eligible events</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/#events"
                className="w-full block text-center rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Explore Live Gigs &rarr;
              </Link>
            </div>
          </div>

        </div>

        {/* Competitor Benchmark Comparison Table */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Market Benchmark: How We Compare
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            SceneO saves organizers and attendees up to 60% compared to legacy ticketing giants.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Buyer Fee</th>
                  <th className="py-3 px-4">Host Commission</th>
                  <th className="py-3 px-4">Total Cut</th>
                  <th className="py-3 px-4 text-right">Host Payout Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr className="bg-rose-50/40 font-bold text-slate-900">
                  <td className="py-3.5 px-4 text-rose-600 font-extrabold">SceneO</td>
                  <td className="py-3.5 px-4">5.5% flat (inclusive)</td>
                  <td className="py-3.5 px-4 text-emerald-700">0% (Zero)</td>
                  <td className="py-3.5 px-4 text-rose-600">5.5% Total</td>
                  <td className="py-3.5 px-4 text-right text-emerald-700">Daily T+1 Rolling</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">BookMyShow</td>
                  <td className="py-3 px-4">10% – 15% + 18% GST</td>
                  <td className="py-3 px-4 text-rose-600">5% – 12% cut</td>
                  <td className="py-3 px-4 font-bold text-rose-600">15% – 25%</td>
                  <td className="py-3 px-4 text-right text-slate-500">14 – 21 Days Post-Event</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">SortMyScene</td>
                  <td className="py-3 px-4">6% – 10% + GST</td>
                  <td className="py-3 px-4 text-rose-600">8% – 15% promoter cut</td>
                  <td className="py-3 px-4 font-bold text-rose-600">14% – 22%</td>
                  <td className="py-3 px-4 text-right text-slate-500">7 – 14 Days Post-Event</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">Skillbox</td>
                  <td className="py-3 px-4">7% – 10% + GST</td>
                  <td className="py-3 px-4 text-rose-600">10% – 15% cut</td>
                  <td className="py-3 px-4 font-bold text-rose-600">17% – 25%</td>
                  <td className="py-3 px-4 text-right text-slate-500">7 – 14 Days Post-Event</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>

    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-rose-500 selection:text-white pb-20">
      
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">S</span>
            <span className="text-base font-bold text-slate-900">Scene<span className="text-rose-600">O</span></span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs">
          
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Buyer & Host Protection</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Refund & Cancellation Policy
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            Transparent, host-protected policies under Indian Consumer Protection Guidelines.
          </p>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-8">
            
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
              <h2 className="text-base font-bold text-emerald-900 mb-1">
                The 6-Hour Automated Refund Lock Window
              </h2>
              <p className="text-emerald-800 text-xs leading-relaxed">
                Independent event organizers commit non-refundable venue advances, artist fees, sound equipment rentals, and cinema auditorium bookings. As such, automated ticket cancellations and refunds are permitted up to <strong>6 hours before event gates open</strong>. Within 6 hours of start time, passes are locked to protect host venue guarantees.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">1. Event Cancellation & Force Majeure (100% Refund)</h2>
              <p>
                If a workshop, acoustic session, conference, or theater screening is officially cancelled due to severe weather, technical failure, or artist illness:
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>100% full refund</strong> of the ticket face value is automatically initiated to your original payment method (UPI / Bank Account).</li>
                <li>Refunds are credited via Cashfree within <strong>48 to 72 bank working hours</strong> without requiring support tickets.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">2. Rescheduling & Venue Changes</h2>
              <p>
                If an event is rescheduled to a different date or relocated to a venue farther than 15 km from the original location, ticket holders are given a 48-hour opt-out window to claim a full refund.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">3. Non-Refundable Scenarios</h2>
              <p>
                Refunds will <strong>not</strong> be granted in the following instances:
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
                <li>Entry refusal due to lack of valid physical Government Photo ID for 21+ licensed venues.</li>
                <li>Denial of entry due to venue rules, age policy non-compliance, or disorderly conduct.</li>
                <li>No-shows or failure to arrive before venue gates close.</li>
                <li>Attempts to present duplicate, screenshot, or black-market resold passes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">4. Initiating a Refund Request</h2>
              <p>
                To request a cancellation within the eligible 24-hour window, email your Order Number and phone number to{" "}
                <a href={`mailto:${siteConfig.supportEmail}`} className="font-bold text-rose-600 underline">
                  {siteConfig.supportEmail}
                </a>
                .
              </p>
            </section>

          </div>

        </div>
      </main>

    </div>
  );
}

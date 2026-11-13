import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { siteConfig } from "@/config/site";
import { BrandLogo } from "@/components/BrandLogo";

export default function TermsPage() {
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

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs">
          
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
            <FileText className="h-3.5 w-3.5" />
            <span>Legal Framework</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            Last updated: November 2026 • Effective across all events and transactions on SceneO (sceneo.in)
          </p>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-8">
            
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">1. Intermediary Technology Platform (Section 79, IT Act 2000)</h2>
              <p>
                SceneO Technologies operates strictly as an intermediary technology marketplace connecting independent event hosts, creators, theater collectives, and cultural organizers with attendees. SceneO facilitates pass issuance, payment routing, and digital gate verification. The admission contract is strictly between the Attendee and the independent Event Organizer (the Merchant of Record).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">2. Rule 33 &ldquo;Pure Agent&rdquo; Status (CGST Rules, 2017)</h2>
              <p>
                In compliance with Rule 33 of the Central Goods and Services Tax Rules, 2017, ticket revenues collected from buyers are received in trust as a pure agent and disbursed directly to the event host without platform deductions. SceneO charges only a platform convenience fee for software, ticketing infrastructure, and dynamic anti-screenshot technology.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">3. Right of Admission & Venue Rules</h2>
              <p>
                Right of Admission is strictly reserved by the independent event organizer and venue security. Attendees must comply with venue age restrictions and guidelines (valid physical Government photo ID; Censor ratings for cinema auditorium screenings). Venue management reserves the right to deny entry for policy violations or disorderly conduct without refund.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">4. Theater Concessions & Outside Food</h2>
              <p>
                For movie theater auditorium screenings (fan club screenings, anime festivals, community premieres), outside food and beverages are strictly prohibited as per cinema management guidelines. Concession packages are redeemable at cinema counters only if explicitly specified on your ticket pass.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">5. Anti-Scalping & Ticket Resale Ban</h2>
              <p>
                Digital passes issued by SceneO are equipped with rotating 30-second TOTP dynamic QR tokens. Unauthorized reproduction, screenshots, or reselling passes at inflated prices on secondary black markets will result in immediate revocation of the pass at the door scanner without refund.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">6. Grievance Officer & Contact</h2>
              <p>
                For inquiries or legal notices, contact our compliance desk at{" "}
                <a href={`mailto:${siteConfig.supportEmail}`} className="font-bold text-rose-600 underline">
                  {siteConfig.supportEmail}
                </a>
                . Response SLA: Within 24 hours.
              </p>
            </section>

          </div>

        </div>
      </main>

    </div>
  );
}

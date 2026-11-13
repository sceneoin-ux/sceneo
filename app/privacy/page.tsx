import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { siteConfig } from "@/config/site";
import { BrandLogo } from "@/components/BrandLogo";

export default function PrivacyPage() {
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
          
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <Lock className="h-3.5 w-3.5" />
            <span>Data Protection</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            Last updated: November 2026 • SceneO respects your privacy and adheres to Digital Personal Data Protection standards.
          </p>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-8">
            
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">1. Zero-Friction Ticketing & Minimal Data Collection</h2>
              <p>
                SceneO is designed to minimize personal data footprint. We do not require buyers to create permanent account profiles or remember passwords. We collect only what is strictly necessary to issue your digital entry pass: your Name, WhatsApp Mobile Number, and optional Email for booking invoices.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">2. Payment Data Security (RBI Regulated Processing)</h2>
              <p>
                SceneO never stores, processes, or retains your UPI PIN, Debit/Credit Card numbers, or net banking passwords. All payments are processed through Cashfree Payments India Pvt. Ltd., an RBI-authorized Payment Aggregator complying with PCI-DSS Level 1 standards and 256-bit TLS encryption.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">3. Use of Mobile Number & WhatsApp Notifications</h2>
              <p>
                Your phone number is used exclusively for:
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
                <li>Delivering your encrypted digital entry pass and rotating QR link.</li>
                <li>Emergency event updates (e.g. venue gate change, rain postponement).</li>
                <li>Facilitating instant checkout recovery if your UPI transaction timed out.</li>
              </ul>
              <p className="mt-2">
                We strictly ban spam marketing, unsolicited calls, and never sell your personal information to third-party ad brokers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">4. Event Organizer Access</h2>
              <p>
                The host of the specific event you book receives your name and mobile number on their sanitized door guestlist solely for attendee verification, seat allocation, and safety management during the event.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">5. Data Deletion & Privacy Inquiries</h2>
              <p>
                To request deletion of your booking history or update your details, email our privacy desk at{" "}
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

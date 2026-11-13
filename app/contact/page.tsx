import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, ShieldCheck, MessageSquare } from "lucide-react";
import { siteConfig } from "@/config/site";
import { BrandLogo } from "@/components/BrandLogo";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-rose-500 selection:text-white pb-20 font-sans">
      
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to SceneO</span>
          </Link>
          <Link href="/" className="flex items-center">
            <BrandLogo size="sm" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 pt-10 sm:px-6">
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Support &amp; Inquiries</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Contact SceneO
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Have questions about an upcoming event pass, organizer hosting, or need help with a payment? Our team is here to assist.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          
          {/* Email Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200 mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Email Support</h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                For booking assistance, refunds, pass re-issuance, or partnership inquiries.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="text-sm font-bold text-rose-600 hover:text-rose-700 transition"
              >
                {siteConfig.supportEmail}
              </a>
              <div className="text-[11px] text-slate-400 mt-0.5">Response SLA: Within 2 to 4 hours</div>
            </div>
          </div>

          {/* Phone / Mobile Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-4">
                <Phone className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Helpline &amp; WhatsApp</h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Direct phone support for hosts during event gate check-ins and urgent ticket queries.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <a
                href={`tel:${siteConfig.supportPhone.replace(/\s+/g, "")}`}
                className="text-sm font-bold text-slate-900 hover:text-rose-600 transition"
              >
                {siteConfig.supportPhone}
              </a>
              <div className="text-[11px] text-slate-400 mt-0.5">{siteConfig.operatingHours}</div>
            </div>
          </div>

          {/* Operating Address */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Operating Address</h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Registered office &amp; tech headquarters:
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-800 leading-relaxed">
                {siteConfig.operatingAddress}
              </div>
            </div>
          </div>

          {/* Grievance & Compliance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-200 mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Grievance Officer</h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                In compliance with the Information Technology Act, 2000 and Rule 33 of CGST Rules, 2017.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-800">{siteConfig.grievanceOfficer}</div>
              <a
                href={`mailto:${siteConfig.officialEmail}`}
                className="text-xs font-bold text-rose-600 hover:underline mt-0.5 inline-block"
              >
                {siteConfig.officialEmail}
              </a>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        &copy; 2026 SceneO India • Verified Real-time Ticketing Intermediary
      </footer>
    </div>
  );
}

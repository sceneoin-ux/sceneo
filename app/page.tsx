"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Compass, 
  Plus, 
  ShieldCheck, 
  Zap, 
  QrCode, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Lock,
  Ticket,
  Sparkles,
  LayoutDashboard,
  Search,
  X,
  Navigation,
  ChevronDown,
  Loader2,
  Mail,
  Phone,
  Check
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { BrandLogo } from "@/components/BrandLogo";
import { INDIAN_CITIES } from "@/config/cities";

// Category Tabs Definition
const CATEGORY_TABS = [
  { id: "all", label: "All Experiences" },
  { id: "screening", label: "Film Screenings" },
  { id: "music", label: "Live Music & Acoustic" },
  { id: "workshop", label: "Workshops & Masterclasses" },
  { id: "theater", label: "Theater & Comedy" },
  { id: "cultural", label: "Cultural Gatherings" },
] as const;

type CategoryId = typeof CATEGORY_TABS[number]["id"];

interface LiveEvent {
  id: string;
  slug: string;
  title: string;
  category: CategoryId;
  date: string;
  time: string;
  venue: string;
  city: string;
  startingPrice: number;
  bannerUrl: string;
  organizer: string;
  verified: boolean;
  tag: string;
  tagStyle: string;
}



function EventCardItem({ evt }: { evt: LiveEvent }) {
  const [imgSrc, setImgSrc] = useState(evt.bannerUrl);

  const getFallbackBanner = () => {
    if (evt.category === "screening" || evt.tag?.toLowerCase().includes("screening")) {
      return "/banners/theater-audi.svg";
    }
    if (evt.category === "workshop") {
      return "/banners/artisan-pottery.svg";
    }
    return "/banners/acoustic-sunset.svg";
  };

  return (
    <Link
      href={`/e/${evt.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
    >
      {/* Event Flyer Banner */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={evt.title}
          onError={() => setImgSrc(getFallbackBanner())}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-103"
        />
        <div className={`absolute top-3 left-3 rounded-full border px-3 py-1 text-[11px] font-semibold shadow-xs backdrop-blur-md ${evt.tagStyle}`}>
          {evt.tag}
        </div>
      </div>

      {/* Event Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{evt.date}</span>
          <span>•</span>
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{evt.time}</span>
        </div>

        <h3 className="mt-2 text-base font-bold text-slate-900 transition group-hover:text-rose-600 line-clamp-1">
          {evt.title}
        </h3>

        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{evt.venue}</span>
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className="truncate max-w-[120px]">by {evt.organizer}</span>
            {evt.verified && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">From</span>
            <span className="ml-1 text-base font-bold text-slate-900">
              ₹{evt.startingPrice}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sceneo_user_city") || "All Cities";
    }
    return "All Cities";
  });

  // City Selector Modal State
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  // Live Events State
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [activeCities, setActiveCities] = useState<string[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Auto-detect live location on first visit if not yet saved in localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("sceneo_user_city") && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          let nearestCity = INDIAN_CITIES[0].name;
          let minDistance = Infinity;
          for (const city of INDIAN_CITIES) {
            const dLat = city.lat - userLat;
            const dLng = city.lng - userLng;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            if (dist < minDistance) {
              minDistance = dist;
              nearestCity = city.name;
            }
          }
          setSelectedCity(nearestCity);
          localStorage.setItem("sceneo_user_city", nearestCity);
        },
        () => {
          // If permission denied or timed out, remain on default
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Fetch real events from Supabase / API
  useEffect(() => {
    let isMounted = true;
    const cityParam = encodeURIComponent(selectedCity);
    fetch(`/api/events/list?city=${cityParam}&category=${selectedCategory}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setEvents(data.events || []);
          if (Array.isArray(data.activeCities)) {
            setActiveCities(data.activeCities);
          }
          setIsLoadingEvents(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setEvents([]);
          setIsLoadingEvents(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCity, selectedCategory]);

  // Handle City Selection
  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    if (typeof window !== "undefined") {
      localStorage.setItem("sceneo_user_city", city);
    }
    setIsCityModalOpen(false);
    setCitySearchQuery("");
    setLocationMessage("");
  };

  // Detect Live User Location via Browser GPS
  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // Find nearest supported Indian city by Euclidean distance
        let nearestCity = INDIAN_CITIES[0].name;
        let minDistance = Infinity;

        for (const city of INDIAN_CITIES) {
          const dLat = city.lat - userLat;
          const dLng = city.lng - userLng;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);
          if (dist < minDistance) {
            minDistance = dist;
            nearestCity = city.name;
          }
        }

        setIsLocating(false);
        handleSelectCity(nearestCity);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage("Location permission denied. Please choose your city from the list.");
        } else {
          setLocationMessage("Unable to retrieve location. Please choose from the list.");
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Filtered Cities for Search Box
  const filteredCitiesList = INDIAN_CITIES.filter((c) =>
    c.name.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
    c.state.toLowerCase().includes(citySearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-rose-500 selection:text-white">
      
      {/* ────────────────── 1. SUBTLE TOP NOTIFICATION BAR ────────────────── */}
      <div className="border-b border-slate-200/80 bg-white px-3 py-1.5 text-center text-[11px] sm:text-xs font-medium text-slate-600 sm:px-6">
        <span className="inline-flex items-center gap-1.5 truncate max-w-full">
          <Sparkles className="h-3.5 w-3.5 text-rose-500 shrink-0" />
          <span className="hidden sm:inline">Independent Event Hosts: <strong>0% Platform Fees</strong> on all events.</span>
          <span className="sm:hidden">Event Hosts: <strong>0% Platform Fees</strong>.</span>
          <Link href="/organizer/events/new" className="font-semibold text-rose-600 underline underline-offset-2 hover:text-rose-700 shrink-0">
            Publish Free &rarr;
          </Link>
        </span>
      </div>

      {/* ────────────────── 2. CLEAN EDITORIAL HEADER ────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6 sm:py-3.5 lg:px-8">
          
          {/* Left: Brand & City Selector */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/" className="flex items-center shrink-0">
              <BrandLogo size="md" />
            </Link>

            {/* Interactive City Selector Pill */}
            <button
              type="button"
              onClick={() => setIsCityModalOpen(true)}
              className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-slate-800 transition hover:bg-slate-100 hover:border-slate-300 shadow-2xs shrink-0 cursor-pointer"
              title="Click to detect live GPS location or search city"
            >
              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-600 shrink-0" />
              <span className="max-w-[70px] sm:max-w-none truncate">{selectedCity}</span>
              <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* My Passes - Icon pill on mobile, full label on desktop */}
            <Link
              href="/passes"
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 shrink-0"
              title="Retrieve your booked passes anytime by phone number"
            >
              <Ticket className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span className="hidden sm:inline">My Passes</span>
            </Link>

            {/* Host Login - Tablet/Desktop only */}
            <Link
              href="/organizer"
              className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 shrink-0"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-slate-500" />
              <span>Host Portal</span>
            </Link>

            {/* Host CTA */}
            <Link
              href="/organizer/events/new"
              className="flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-slate-800 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Host</span>
            </Link>
          </div>

        </div>
      </header>

      {/* ────────────────── 3. WARM EDITORIAL HERO ────────────────── */}
      <section className="relative overflow-hidden bg-white px-4 pt-8 pb-10 border-b border-slate-200/80 sm:px-6 sm:pt-14 sm:pb-16 lg:pt-20 lg:pb-22">
        
        {/* Subtle Warm Backdrop Tint */}
        <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-96 w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-50/40 via-slate-50/20 to-transparent" />

        <div className="mx-auto max-w-3xl text-center">
          
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/70 px-3 py-1 text-[11px] sm:text-xs font-semibold text-rose-700">
            <Ticket className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-600 shrink-0" />
            <span className="hidden sm:inline">The Modern Ticketing Platform for Independent Gigs &amp; Screenings</span>
            <span className="sm:hidden">0% Fee Indie Gigs &amp; Screenings</span>
          </div>

          <h1 className="mt-4 sm:mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl sm:leading-[1.12] text-balance">
            Find the gig. Grab your pass. <br className="hidden sm:inline" />
            <span className="text-slate-500">
              {selectedCity === "All Cities" || selectedCity === "all"
                ? "Never miss a scene across India."
                : `Never miss a scene in ${selectedCity}.`}
            </span>
          </h1>

          <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-xs sm:text-base leading-relaxed text-slate-600 text-balance">
            Direct access to movie screenings, acoustic sessions, workshops, theater, and community cultural gatherings. Pay securely with instant UPI checkout and receive an encrypted digital pass on your phone.
          </p>

          <div className="mt-6 sm:mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:gap-3 max-w-md sm:max-w-none mx-auto">
            <Link
              href={`/explore?city=${encodeURIComponent(selectedCity)}`}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-2.5 sm:px-7 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-sm shadow-rose-600/20 transition hover:bg-rose-700"
            >
              <Compass className="h-4 w-4" />
              <span>
                {selectedCity === "All Cities" || selectedCity === "all"
                  ? "Explore Gigs Across India"
                  : `Explore Gigs in ${selectedCity}`}
              </span>
            </Link>
            <Link
              href="/organizer/events/new"
              className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5 text-rose-600" />
              <span>Host an Event (0% Fee)</span>
            </Link>
          </div>

        </div>
      </section>

      {/* ────────────────── 4. FEATURED SPOTLIGHT SECTION ────────────────── */}
      <section id="events" className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        
        {/* Spotlight Section Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/70 px-3 py-0.5 text-[11px] font-semibold text-rose-700">
              <Sparkles className="h-3 w-3 text-rose-600" />
              <span>Featured Spotlight</span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {selectedCity === "All Cities" || selectedCity === "all"
                ? "Handpicked Experiences Across India"
                : `Featured Experiences in ${selectedCity}`}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Curated film screenings, acoustic sessions, workshops, and gatherings happening this week.
            </p>
          </div>

          <Link
            href={`/explore?city=${encodeURIComponent(selectedCity)}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 group shrink-0"
          >
            <span>Explore All Gigs</span>
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* ── Category Filter: Mobile Segmented Dropdown (Zero Horizontal Scroll) + Desktop Pill Bar ── */}
        {/* Mobile View: Clean Category Selector Dropdown */}
        <div className="sm:hidden mb-5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Category:</span>
                <span className="text-slate-900 font-extrabold">
                  {CATEGORY_TABS.find((t) => t.id === selectedCategory)?.label || "All Experiences"}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isCategoryDropdownOpen ? "rotate-180 text-slate-900" : ""}`} />
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-30 mt-2 grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                {CATEGORY_TABS.map((tab) => {
                  const isActive = selectedCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(tab.id);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition text-left cursor-pointer ${
                        isActive
                          ? "bg-slate-900 text-white font-bold"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Desktop View: Clean Wrapping Pill Bar */}
        <div className="hidden sm:flex mb-6 flex-wrap gap-1.5">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Spotlight Events / Skeleton Loading / Clean Empty State */}
        {isLoadingEvents ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs animate-pulse">
                <div className="aspect-[16/9] w-full bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-1/3 bg-slate-200 rounded" />
                  <div className="h-4 w-4/5 bg-slate-200 rounded" />
                  <div className="h-3 w-1/2 bg-slate-200 rounded" />
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                    <div className="h-4 w-12 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg sm:text-xl font-bold text-slate-900">
              No Spotlight Gigs in {selectedCity} Right Now
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Be the first creator, collective, or host to publish an acoustic session, movie screening, or workshop in {selectedCity} with 0% platform commission.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
              {selectedCity !== "All Cities" && (
                <button
                  type="button"
                  onClick={() => handleSelectCity("All Cities")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-xs"
                >
                  <Compass className="h-3.5 w-3.5 text-rose-600" />
                  <span>View All Across India</span>
                </button>
              )}
              <Link
                href="/organizer/events/new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
              >
                <Plus className="h-4 w-4" />
                <span>+ Host an Event in {selectedCity}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Curated Spotlight Grid (Max 4 events) */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {events.slice(0, 4).map((evt) => (
                <EventCardItem key={evt.id} evt={evt} />
              ))}
            </div>

            {/* Prominent High-Converting Explore CTA */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/explore?city=${encodeURIComponent(selectedCity)}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Compass className="h-4 w-4 text-rose-400" />
                <span>
                  {selectedCity === "All Cities" || selectedCity === "all"
                    ? "Explore All Gigs Across India →"
                    : `Explore All Gigs in ${selectedCity} (${events.length}) →`}
                </span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ────────────────── 5. CLEAN TRUST PILLARS ────────────────── */}
      <section className="border-y border-slate-200/80 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              The Platform Advantage
            </span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Engineered for Friction-Free Events
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Built to solve on-ground ticketing issues for attendees, venues, and hosts.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            
            <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 transition hover:border-slate-300 hover:bg-white hover:shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Instant UPI Checkout</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                No compulsory app downloads or lengthy registrations. Pay in under 15 seconds via Google Pay, PhonePe, or Paytm.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 transition hover:border-slate-300 hover:bg-white hover:shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Encrypted Digital Pass</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Tamper-resistant digital pass with real-time verification pulses and offline-ready gate validation.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 transition hover:border-slate-300 hover:bg-white hover:shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">0% Host Commission</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Organizers retain 100% of their ticket face value. Transparent 5.5% convenience fee is covered by attendees.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 transition hover:border-slate-300 hover:bg-white hover:shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Rule 33 Pure Agent</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Fully compliant with Indian CGST Rule 33. Automated T+1 settlements directly to organizer bank accounts.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ────────────────── 6. ORGANIZER CALLOUT (LIGHT THEME) ────────────────── */}
      <section className="relative overflow-hidden bg-slate-50 px-4 py-16 sm:px-6 lg:px-8 border-b border-slate-200/80">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm text-center">
          
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <span>Direct Split Payouts via Cashfree Easy Split</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Hosting a Screening, Gig, or Workshop in {selectedCity}?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            Publish your ticket link in 3 minutes. Zero setup fees, zero monthly subscription, and 100% of ticket sales deposited directly into your UPI account.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/organizer/events/new"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 sm:w-auto"
            >
              <span>+ Create an Event</span>
              <ArrowRight className="h-4 w-4 text-rose-400" />
            </Link>

            <Link
              href="/organizer"
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 sm:w-auto"
            >
              <LayoutDashboard className="h-4 w-4 text-slate-500" />
              <span>Organizer Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ────────────────── 7. FOOTER ────────────────── */}
      <footer className="border-t border-slate-200/80 bg-white px-4 py-12 text-slate-600 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4 pb-10 border-b border-slate-100">
            {/* Col 1: Brand & Bio */}
            <div className="md:col-span-2">
              <Link href="/" className="inline-flex items-center">
                <BrandLogo size="md" />
              </Link>
              <p className="mt-3 text-xs text-slate-500 max-w-sm leading-relaxed">
                India&apos;s 0% platform fee ticketing platform for independent film screenings, acoustic sessions, workshops, theater, and community cultural gatherings.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                <a href={`mailto:${siteConfig.supportEmail}`} className="inline-flex items-center gap-1.5 hover:text-rose-600 transition">
                  <Mail className="h-3.5 w-3.5 text-rose-600" />
                  <span>{siteConfig.supportEmail}</span>
                </a>
                <a href={`tel:${siteConfig.supportPhone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-rose-600 transition">
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{siteConfig.supportPhone}</span>
                </a>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Platform</h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-500">
                <li><Link href="/passes" className="hover:text-rose-600 font-semibold text-slate-800 transition">🎟️ Find My Passes</Link></li>
                <li><Link href="/explore" className="hover:text-slate-900 transition">Explore All Gigs</Link></li>
                <li><Link href="/organizer/events/new" className="hover:text-slate-900 transition">+ Host Free Event</Link></li>
                <li><Link href="/pricing" className="hover:text-slate-900 transition">0% Host Pricing</Link></li>
                <li><Link href="/scanner" className="hover:text-slate-900 transition">Door QR Scanner</Link></li>
                <li><Link href="/contact" className="hover:text-rose-600 font-semibold text-slate-700 transition">Contact Us &amp; Support</Link></li>
              </ul>
            </div>

            {/* Col 3: Compliance & Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Compliance &amp; Legal</h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-500">
                <li><Link href="/terms" className="hover:text-slate-900 transition">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-slate-900 transition">Privacy Policy</Link></li>
                <li><Link href="/refunds" className="hover:text-slate-900 transition">Refund &amp; Cancellation</Link></li>
                <li><Link href="/security" className="hover:text-slate-900 transition">Anti-Fraud &amp; Security</Link></li>
                <li><Link href="/admin" className="hover:text-slate-900 transition">Master Admin</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>&copy; 2026 SceneO India. Rule 33 Pure Agent Platform.</p>
            <p className="text-[11px]">Registered Office: {siteConfig.operatingAddress}</p>
          </div>

        </div>
      </footer>

      {/* ────────────────── 8. CITY SELECTOR MODAL (LIVE GPS & SEARCH) ────────────────── */}
      {isCityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Select Your Location</h3>
                  <p className="text-xs text-slate-500">Discover live events and screenings in your city</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCityModalOpen(false);
                  setCitySearchQuery("");
                  setLocationMessage("");
                }}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* GPS Live Detect Button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleDetectLiveLocation}
                disabled={isLocating}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700 hover:bg-rose-100 transition disabled:opacity-60"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                    <span>Detecting GPS Location...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 text-rose-600" />
                    <span>📍 Detect My Live Location</span>
                  </>
                )}
              </button>

              {locationMessage && (
                <p className="mt-2 text-xs font-semibold text-rose-600 text-center bg-rose-50/50 p-1.5 rounded-lg">
                  {locationMessage}
                </p>
              )}
            </div>

            {/* Search Input */}
            <div className="relative mt-4">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                placeholder="Search city or state (e.g. Hyderabad, Bengaluru, Mumbai)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {/* Dynamic: Cities With Live Gigs */}
            {activeCities.length > 0 && (
              <div className="mt-4 border-b border-slate-100 pb-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cities With Live Gigs ({activeCities.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeCities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleSelectCity(c)}
                      className={`rounded-full border px-3 py-1 text-xs font-bold transition shadow-2xs ${
                        selectedCity.toLowerCase() === c.toLowerCase()
                          ? "border-rose-500 bg-rose-50 text-rose-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Cities Grid */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                <span>Popular Cultural Hubs</span>
                <button
                  type="button"
                  onClick={() => handleSelectCity("All Cities")}
                  className="text-rose-600 hover:underline capitalize font-semibold"
                >
                  View All Cities
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto no-scrollbar pr-1">
                <button
                  type="button"
                  onClick={() => handleSelectCity("All Cities")}
                  className={`rounded-xl border p-2.5 text-xs font-bold text-center transition ${
                    selectedCity === "All Cities"
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  All Cities
                </button>

                {filteredCitiesList.map((city) => {
                  const isSelected = selectedCity.toLowerCase() === city.name.toLowerCase();
                  return (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => handleSelectCity(city.name)}
                      className={`rounded-xl border p-2.5 text-xs font-bold text-center transition ${
                        isSelected
                          ? "border-rose-500 bg-rose-50 text-rose-700 shadow-2xs"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div>{city.name}</div>
                      <div className="text-[10px] font-normal text-slate-400 truncate">{city.state}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
              SceneO automatically filters ticket listings based on your chosen region.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

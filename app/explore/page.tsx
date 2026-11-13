"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  Plus, 
  Search, 
  X, 
  Navigation, 
  ChevronDown, 
  Loader2
} from "lucide-react";
import { INDIAN_CITIES } from "@/config/cities";
import { BrandLogo } from "@/components/BrandLogo";

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



function ExploreCardItem({ evt }: { evt: LiveEvent }) {
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

function ExploreDirectoryContent() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sceneo_user_city") || "All Cities";
    }
    return "All Cities";
  });
  const [searchQuery, setSearchQuery] = useState("");

  // City Selector Modal State
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  // Live Events State
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [activeCities, setActiveCities] = useState<string[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

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

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    if (typeof window !== "undefined") {
      localStorage.setItem("sceneo_user_city", city);
    }
    setIsCityModalOpen(false);
    setCitySearchQuery("");
    setLocationMessage("");
  };

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

  const filteredEvents = events.filter((evt) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      evt.title.toLowerCase().includes(query) ||
      evt.venue.toLowerCase().includes(query) ||
      evt.city.toLowerCase().includes(query) ||
      evt.organizer.toLowerCase().includes(query)
    );
  });

  const filteredCitiesList = INDIAN_CITIES.filter((c) =>
    c.name.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
    c.state.toLowerCase().includes(citySearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-rose-500 selection:text-white flex flex-col justify-between">
      <div>
        {/* ────────────────── TOP NAVIGATION ────────────────── */}
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3.5 lg:px-8">
            
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 shrink-0 mr-1">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>

              <Link href="/" className="flex items-center shrink-0">
                <BrandLogo size="md" />
              </Link>

              {/* City Pill */}
              <button
                type="button"
                onClick={() => setIsCityModalOpen(true)}
                className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-slate-800 transition hover:bg-slate-100 hover:border-slate-300 shadow-2xs shrink-0 cursor-pointer"
              >
                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-600 shrink-0" />
                <span className="max-w-[70px] sm:max-w-none truncate">{selectedCity}</span>
                <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <Link
                href="/passes"
                className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                <span>My Passes</span>
              </Link>
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

        {/* ────────────────── DIRECTORY SEARCH & TITLE ────────────────── */}
        <section className="bg-white border-b border-slate-200/80 px-4 pt-6 pb-6 sm:px-6 sm:pt-8 sm:pb-8 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/70 px-3 py-0.5 text-[11px] font-semibold text-rose-700">
                  <Compass className="h-3 w-3 text-rose-600" />
                  <span>Explore Live Gigs & Gatherings</span>
                </div>
                <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {selectedCity === "All Cities" || selectedCity === "all"
                    ? "Live Experiences Across India"
                    : `Live Gigs in ${selectedCity}`}
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  Find community screenings, intimate acoustic sessions, workshops, and theater events.
                </p>
              </div>

              {/* Real-time Search Box */}
              <div className="relative w-full md:w-80 shrink-0">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, artist, or venue..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="mt-6 flex w-full overflow-x-auto no-scrollbar gap-1.5 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              {CATEGORY_TABS.map((tab) => {
                const isActive = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold transition ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:bg-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ────────────────── FULL EVENTS GRID / EMPTY STATE ────────────────── */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          {isLoadingEvents ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 sm:p-14 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                <MapPin className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900">
                No Events Found {selectedCity !== "All Cities" ? `in ${selectedCity}` : ""}
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {searchQuery
                  ? `No experiences matched your search "${searchQuery}". Try a different keyword or reset filters.`
                  : `Be the first creator or host to publish an acoustic session, movie screening, or workshop in ${selectedCity} with 0% platform commission.`}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
                <Link
                  href="/organizer/events/new"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Host an Event</span>
                </Link>
                {selectedCity !== "All Cities" && (
                  <button
                    onClick={() => handleSelectCity("All Cities")}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <span>Browse All Cities</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-xs font-semibold text-slate-500">
                Showing {filteredEvents.length} live experience{filteredEvents.length !== 1 ? "s" : ""}
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredEvents.map((evt) => (
                  <ExploreCardItem key={evt.id} evt={evt} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ────────────────── FOOTER ────────────────── */}
      <footer className="bg-white border-t border-slate-200 px-4 py-8 text-slate-600 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <Link href="/" className="inline-flex items-center">
            <BrandLogo size="xs" />
          </Link>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <Link href="/pricing" className="hover:text-slate-900">Pricing (0% Fee)</Link>
            <Link href="/contact" className="font-semibold text-rose-600 hover:text-rose-700">Contact Us</Link>
            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
            <Link href="/refunds" className="hover:text-slate-900">Refunds</Link>
          </div>
          <div>&copy; 2026 SceneO India</div>
        </div>
      </footer>

      {/* ────────────────── CITY SELECTOR MODAL ────────────────── */}
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

export default function ExploreDirectoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-sm font-semibold text-slate-500">Loading Directory...</div>}>
      <ExploreDirectoryContent />
    </Suspense>
  );
}

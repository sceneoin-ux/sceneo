export const siteConfig = {
  name: "SceneO",
  tagline: "Find the gig. Grab your pass. Never miss a scene.",
  description: "The modern independent ticketing platform for movie screenings, live music, acoustic sessions, workshops, and cultural gatherings in India.",
  url: "https://sceneo.in",
  city: "Hyderabad",
  supportEmail: "support@sceneo.in",
  officialEmail: "support@sceneo.in",
  supportPhone: "+91 99887 76655",
  operatingAddress: "Plot 42, Jubilee Hills, Hyderabad, Telangana 500033, India",
  operatingHours: "Monday to Saturday, 10:00 AM – 8:00 PM IST",
  grievanceOfficer: "SceneO Legal & Compliance Officer",
  currency: "INR",
  currencySymbol: "₹",
  platformFeePercent: 5.5, // 5.5% flat platform convenience fee passed to buyer
  minPlatformFee: 15,      // Minimum floor fee to protect margins on micro-tickets
  feeTiers: {
    low: 4.5,              // Aggressive host acquisition tier
    default: 5.5,          // Recommended sweet spot (55-60% margin)
    high: 7.5              // High-demand premiere & festival ceiling
  },
  refundCutoffHours: 6,    // Automated refunds locked 6 hours prior to event start time

  // Venue Types Supported
  venueTypes: ["auditorium", "open_air", "theater", "studio", "rooftop"],

  // Legal & Regulatory Framework (IT Act 2000 Section 79 & Rule 33 CGST Pure Agent)
  regulatoryCompliance: {
    intermediaryStatus: "Technology Intermediary under Section 79 of the Information Technology Act, 2000",
    pureAgentStatus: "Pure Agent Intermediary under Rule 33 of CGST Rules, 2017 (Ticket funds collected in trust for host)",
    merchantOfRecord: "The independent Event Organizer is the sole Merchant of Record",
    ageVerification: "Valid physical Government Photo ID mandatory where required by venue or cinema censor board.",
    rightOfAdmission: "Right of Admission strictly reserved by venue management; non-refundable for ID or venue policy violations.",
    coverChargeDisclaimer: "Entry pass does not include venue mandatory cover charge or theater concessions unless explicitly stated.",
    theaterOutsideFoodDisclaimer: "Outside food and beverages are strictly prohibited inside movie theater auditoriums as per cinema house rules.",
    antiScalping: "Strictly for personal use. Unauthorized resale at inflated prices will result in pass revocation without refund.",
    forceMajeure: "In case of rainout, screening equipment failure, or police curfew cancellation, 100% automated refund processed via Cashfree within 48-72 hours."
  }
};

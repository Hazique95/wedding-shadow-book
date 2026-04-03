export const siteConfig = {
  name: "Wedding Shadow Book",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Wedding Shadow Book gives planners AI-powered vendor backup matching, escrow-safe replacement flows, and event-day no-show protection in one click.",
  stripeSignupUrl: process.env.NEXT_PUBLIC_STRIPE_SIGNUP_URL ?? "/signup",
  demoVideoUrl:
    process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ??
    "https://www.youtube.com/embed/ysz5S6PUM-U?autoplay=1&rel=0",
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_ID ?? "G-WSBBOOK2026",
};

export const stats = [
  { value: "< 90s", label: "Average time to surface shadow vendors" },
  { value: "92%", label: "High-risk vendors flagged before event week" },
  { value: "3x", label: "Faster replacement approvals with escrow flow" },
  { value: "24/7", label: "Coverage for weddings, rehearsals, and brunches" },
];

export const painPoints = [
  {
    label: "Photographer vanishes",
    title: "7:12am ghosting text",
    story:
      "The lead photographer stops replying on the morning of the ceremony. The planner has one assistant, no shortlist, and a family already asking whether the first look is delayed.",
    impact:
      "Wedding Shadow Book auto-pings nearby vetted shooters, ranks fit by style and travel time, and locks a replacement before glam finishes.",
  },
  {
    label: "Florals fail",
    title: "Truck breakdown panic",
    story:
      "Centerpieces are stuck on a freeway shoulder and reception doors open in four hours. The venue needs a same-day floral pivot without blowing the budget.",
    impact:
      "Instant Match pulls local studio inventory, proposes a scaled design backup, and routes escrow approval to the client with one tap.",
  },
  {
    label: "Hair team no-show",
    title: "Bridal suite meltdown",
    story:
      "A glam squad cancels after sunrise, leaving five bridesmaids, one bride, and a hard ceremony deadline. Everyone starts doom-scrolling for replacements at once.",
    impact:
      "Risk AI identifies beauty backups who can absorb the schedule, confirms rates, and preserves the original contract trail for reimbursement.",
  },
];

export const featureCards = [
  {
    title: "Risk AI",
    highlight: "Predictive",
    description:
      "Continuously scores vendor reliability using response lag, payment status, weather, route delays, and last-minute contract changes.",
    detail:
      "Planners see who needs a shadow vendor before the couple feels a wobble in the timeline.",
  },
  {
    title: "Instant Match",
    highlight: "1-click",
    description:
      "Pulls a ranked list of backup vendors by role, price, travel time, portfolio fit, and availability in one action.",
    detail:
      "No more separate spreadsheets, WhatsApp groups, or frantic Instagram DMs during load-in.",
  },
  {
    title: "Escrow Safe",
    highlight: "Protected",
    description:
      "Release replacement funds only after scope, timing, and deliverables are approved by the planner or client.",
    detail:
      "Your backup move stays accountable, documented, and financially clean when emotions are high.",
  },
];

export const pricingTiers = [
  {
    name: "Beta",
    price: "$0",
    billing: "during beta",
    tagline: "Perfect for solo planners validating their rescue playbook.",
    features: [
      "5 backup searches per month",
      "Risk alerts for 2 active weddings",
      "Basic vendor match recommendations",
    ],
    cta: "Start free beta",
    featured: false,
  },
  {
    name: "Studio",
    price: "$29",
    billing: "per month",
    tagline: "For growing teams who need dependable backup coverage every weekend.",
    features: [
      "Unlimited active weddings",
      "Instant Match vendor outreach",
      "Escrow approval workflow",
      "Team seats for coordinators",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Pro",
    price: "$99",
    billing: "per month",
    tagline: "For agencies, venues, and multi-brand operations managing many calendars.",
    features: [
      "White-glove onboarding",
      "Priority concierge rescue support",
      "Advanced analytics and reporting",
      "Venue and associate planner permissions",
    ],
    cta: "Book pro setup",
    featured: false,
  },
];

export const testimonials = [
  {
    name: "Mia Alvarez",
    role: "Luxury planner, Austin",
    initials: "MA",
    quote:
      "The backup photographer was confirmed before my couple even realized the original vendor had gone silent. That alone sold me.",
  },
  {
    name: "Jordan Pike",
    role: "Venue director, Charleston",
    initials: "JP",
    quote:
      "I like that the platform feels calm under pressure. It gives my team a script, a shortlist, and payment guardrails in one screen.",
  },
  {
    name: "Rina Patel",
    role: "Associate coordinator, New Jersey",
    initials: "RP",
    quote:
      "The escrow-safe replacement flow makes it much easier to say yes quickly because finance and logistics stop fighting each other.",
  },
];

export const faqLinks = [
  { label: "Privacy policy", href: "#privacy" },
  { label: "Terms of service", href: "#terms" },
  { label: "Demo library", href: "#testimonials" },
  { label: "Planner docs", href: "#features" },
];

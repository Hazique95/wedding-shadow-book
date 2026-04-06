export const VENDOR_SERVICES = [
  "mehndi",
  "catering",
  "dj",
  "venue",
  "photog",
  "decorator",
] as const;

export type VendorService = (typeof VENDOR_SERVICES)[number];
export type UploadProvider = "supabase" | "cloudinary";

export type VendorAvailability = {
  selectedDates: string[];
  exportedAt?: string;
};

export type VendorProfileRecord = {
  id: string;
  user_id: string | null;
  name: string;
  services: VendorService[];
  rating: number;
  no_shows: number;
  total_gigs: number;
  location_label: string | null;
  location_lat: number | null;
  location_lng: number | null;
  availability: VendorAvailability | null;
  portfolio_url: string[];
  primary_image_url: string | null;
  bio: string | null;
  hourly_rate: number;
  verified: boolean;
  claimed_at: string | null;
  stripe_account_id: string | null;
  stripe_account_country: "US" | "PK" | null;
  stripe_onboarding_complete: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
};

export type VendorGigRecord = {
  id: string;
  vendor_id: string;
  event_name: string;
  client_name: string | null;
  event_date: string;
  status: "confirmed" | "completed" | "cancelled" | "no_show";
  payout_amount: number | null;
  created_at: string;
};

export type VendorFormValues = {
  id?: string;
  name: string;
  services: VendorService[];
  locationLabel: string;
  locationLat: number | null;
  locationLng: number | null;
  availability: VendorAvailability;
  portfolioUrl: string[];
  primaryImageUrl: string | null;
  bio: string;
  hourlyRate: number | null;
  verified: boolean;
  claimedAt: string | null;
};

export const LAHORE_CENTER = {
  lat: 31.5204,
  lng: 74.3587,
};

export const LAHORE_RADIUS_KM = 50;
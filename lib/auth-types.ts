export type UserRole = "planner" | "vendor";
export type ServiceType = "decorator" | "caterer" | "dj" | "venue" | "photog";
export type CurrencyCode = "PKR" | "USD";

export type NotificationPreferences = {
  sms: boolean;
  email: boolean;
  in_app: boolean;
};

export type UTMParams = Partial<{
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  referrer: string;
}>;

export type UserProfile = {
  id: string;
  email?: string | null;
  phone_number?: string | null;
  role: UserRole;
  full_name: string;
  location_label: string;
  location_lat: number | null;
  location_lng: number | null;
  service: ServiceType | null;
  bio: string | null;
  hourly_rate: number | null;
  currency: CurrencyCode;
  signup_source_utm: UTMParams | null;
  notification_preferences?: NotificationPreferences | null;
};

export const ROLE_OPTIONS: Array<{ value: UserRole; label: string; description: string }> = [
  {
    value: "planner",
    label: "Planner",
    description: "Coordinate weddings, manage timelines, and keep backup coverage close.",
  },
  {
    value: "vendor",
    label: "Vendor",
    description: "Offer backup services and get surfaced in emergency replacement matching.",
  },
];

export const SERVICE_OPTIONS: Array<{ value: ServiceType; label: string }> = [
  { value: "decorator", label: "Decorator" },
  { value: "caterer", label: "Caterer" },
  { value: "dj", label: "DJ" },
  { value: "venue", label: "Venue" },
  { value: "photog", label: "Photographer" },
];

export const CURRENCY_OPTIONS: CurrencyCode[] = ["PKR", "USD"];
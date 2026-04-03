"use client";

import dynamic from "next/dynamic";
import { CheckCircle2Icon, ChevronRightIcon, LoaderCircleIcon, SparklesIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { GooglePlacesInput } from "@/components/auth/google-places-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CURRENCY_OPTIONS,
  ROLE_OPTIONS,
  SERVICE_OPTIONS,
  type CurrencyCode,
  type ServiceType,
  type UserProfile,
  type UserRole,
} from "@/lib/auth-types";
import { normalizeAuthError } from "@/lib/auth-errors";
import { withRetry } from "@/lib/retry";
import { createClient } from "@/lib/supabase/client";
import { readStoredUTM } from "@/lib/utm";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

type OnboardingWizardProps = {
  userId: string;
  email: string | null;
  initialProfile?: Partial<UserProfile> | null;
};

export function OnboardingWizard({
  userId,
  email,
  initialProfile,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(initialProfile?.role ? 2 : 1);
  const [role, setRole] = useState<UserRole | null>(initialProfile?.role ?? null);
  const [fullName, setFullName] = useState(initialProfile?.full_name ?? "");
  const [locationLabel, setLocationLabel] = useState(initialProfile?.location_label ?? "");
  const [locationLat, setLocationLat] = useState<number | null>(initialProfile?.location_lat ?? null);
  const [locationLng, setLocationLng] = useState<number | null>(initialProfile?.location_lng ?? null);
  const [service, setService] = useState<ServiceType | "">(initialProfile?.service ?? "");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [hourlyRate, setHourlyRate] = useState(initialProfile?.hourly_rate?.toString() ?? "");
  const [currency, setCurrency] = useState<CurrencyCode>(initialProfile?.currency ?? CURRENCY_OPTIONS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const isVendor = role === "vendor";
  const profileChecklist = useMemo(
    () => [Boolean(fullName.trim()), Boolean(locationLabel.trim()), !isVendor || Boolean(service), !isVendor || Boolean(hourlyRate)],
    [fullName, hourlyRate, isVendor, locationLabel, service]
  );

  function handleStepAdvance() {
    if (!role) {
      toast.error("Choose Planner or Vendor before continuing.");
      return;
    }

    setStep(2);
  }

  async function handleComplete() {
    if (!role) {
      toast.error("Choose a role before saving.");
      return;
    }

    if (!fullName.trim() || !locationLabel.trim()) {
      toast.error("Name and location are required.");
      return;
    }

    if (isVendor && !service) {
      toast.error("Choose a service category for the vendor profile.");
      return;
    }

    if (isVendor && !hourlyRate) {
      toast.error("Add an hourly rate for the vendor profile.");
      return;
    }

    setIsSaving(true);

    const supabase = createClient();

    try {
      await withRetry(async () => {
        const response = await supabase.from("users").upsert({
          id: userId,
          email,
          role,
          full_name: fullName.trim(),
          location_label: locationLabel.trim(),
          location_lat: locationLat,
          location_lng: locationLng,
          service: isVendor ? service : null,
          bio: bio.trim() || null,
          hourly_rate: isVendor ? Number(hourlyRate) : null,
          currency,
          signup_source_utm: readStoredUTM(),
        });

        if (response.error) {
          throw response.error;
        }

        return response;
      });

      setCelebrate(true);
      toast.success("Onboarding complete. Your dashboard is ready.");
      window.setTimeout(() => {
        router.replace("/dashboard");
        router.refresh();
      }, 1400);
    } catch (error) {
      toast.error(normalizeAuthError(error as { message?: string }));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {celebrate ? <Confetti width={viewport.width} height={viewport.height} recycle={false} numberOfPieces={320} /> : null}

      <div className="space-y-4">
        <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none">Onboarding wizard</Badge>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className={`rounded-2xl border px-4 py-3 ${step >= 1 ? "border-primary/40 bg-primary/6" : "border-border bg-background/70"}`}>
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Step 1</div>
            <div className="mt-1 font-medium">Planner or Vendor?</div>
          </div>
          <Separator className="hidden sm:block" />
          <div className={`rounded-2xl border px-4 py-3 ${step >= 2 ? "border-primary/40 bg-primary/6" : "border-border bg-background/70"}`}>
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Step 2</div>
            <div className="mt-1 font-medium">Profile details</div>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {ROLE_OPTIONS.map((option) => {
            const active = role === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                className={`rounded-[1.75rem] border p-5 text-left transition ${
                  active
                    ? "border-primary/40 bg-primary/8 shadow-[0_24px_70px_-45px_rgba(130,49,82,0.45)]"
                    : "border-border bg-background/70 hover:border-primary/20 hover:bg-white/80 dark:hover:bg-white/6"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-heading text-3xl leading-none">{option.label}</div>
                  {active ? <CheckCircle2Icon className="size-5 text-primary" /> : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{option.description}</p>
              </button>
            );
          })}

          <div className="md:col-span-2">
            <Button className="h-12 rounded-full px-6" onClick={handleStepAdvance}>
              Continue
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Areeba Khan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailReadOnly">Email</Label>
              <Input id="emailReadOnly" value={email ?? ""} readOnly className="text-muted-foreground" />
            </div>
          </div>

          <GooglePlacesInput
            value={locationLabel}
            onValueChange={setLocationLabel}
            onCoordinatesChange={({ lat, lng }) => {
              setLocationLat(lat);
              setLocationLng(lng);
            }}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service">Services</Label>
              <select
                id="service"
                value={service}
                onChange={(event) => setService(event.target.value as ServiceType | "")}
                className="flex h-11 w-full rounded-2xl border border-border bg-background/90 px-4 text-sm shadow-sm outline-none focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-primary/10 dark:bg-white/5"
              >
                <option value="">{isVendor ? "Choose a service" : "Optional for planners"}</option>
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly rate</Label>
              <div className="rounded-[1.5rem] border border-border bg-background/70 p-1 dark:bg-white/5">
                <div className="mb-2 flex items-center justify-between px-3 pt-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Currency</span>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span>PKR</span>
                    <Switch
                      checked={currency === "USD"}
                      onCheckedChange={(checked) => setCurrency(checked ? "USD" : "PKR")}
                      aria-label="Toggle currency"
                    />
                    <span>USD</span>
                  </div>
                </div>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(event) => setHourlyRate(event.target.value)}
                  placeholder={currency === "PKR" ? "15000" : "125"}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder={isVendor ? "What makes your service reliable when timelines get messy?" : "Tell us about your weddings, regions, and planning style."}
            />
          </div>

          <div className="rounded-[1.75rem] border border-primary/15 bg-primary/6 p-5 dark:bg-white/6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <SparklesIcon className="size-4 text-primary" />
              Profile checklist
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                "Name added",
                "Location captured",
                isVendor ? "Service selected" : "Service optional",
                isVendor ? "Rate added" : "Rate optional",
              ].map((label, index) => (
                <div key={label} className="flex items-center gap-2 text-sm text-foreground/85">
                  <CheckCircle2Icon className={`size-4 ${profileChecklist[index] ? "text-primary" : "text-muted-foreground"}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button variant="outline" className="h-12 rounded-full" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="h-12 rounded-full px-6" onClick={handleComplete} disabled={isSaving}>
              {isSaving ? <LoaderCircleIcon className="size-4 animate-spin" /> : <ChevronRightIcon className="size-4" />}
              {isSaving ? "Saving profile..." : "Complete onboarding"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

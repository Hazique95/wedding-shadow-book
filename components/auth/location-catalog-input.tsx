"use client";

import { MapPinIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCitiesForCountry, getCountryOptions, getPostalCodesForCity } from "@/lib/location-data";

type LocationCatalogInputProps = {
  country: string;
  city: string;
  postalCode: string;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
};

export function LocationCatalogInput({
  country,
  city,
  postalCode,
  onCountryChange,
  onCityChange,
  onPostalCodeChange,
}: LocationCatalogInputProps) {
  const countries = getCountryOptions();
  const cities = getCitiesForCountry(country);
  const postalCodes = getPostalCodesForCity(country, city);
  const postalListId = city ? `postal-codes-${city.toLowerCase().replace(/\s+/g, "-")}` : "postal-codes";

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="flex items-center gap-2" htmlFor="country">
          <MapPinIcon className="size-4 text-muted-foreground" />
          Location
        </Label>
        <p className="text-xs text-muted-foreground">
          Pick a country and city from the local list, then enter a matching postal code to finish onboarding.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <select
            id="country"
            value={country}
            onChange={(event) => onCountryChange(event.target.value)}
            className="flex h-11 w-full rounded-2xl border border-border bg-background/90 px-4 text-sm shadow-sm outline-none focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-primary/10 dark:bg-white/5"
          >
            <option value="">Choose country</option>
            {countries.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <select
            id="city"
            value={city}
            onChange={(event) => onCityChange(event.target.value)}
            disabled={!country}
            className="flex h-11 w-full rounded-2xl border border-border bg-background/90 px-4 text-sm shadow-sm outline-none focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5"
          >
            <option value="">Choose city</option>
            {cities.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal code</Label>
          <Input
            id="postalCode"
            value={postalCode}
            onChange={(event) => onPostalCodeChange(event.target.value.toUpperCase())}
            placeholder={city ? "Choose or type a listed postal code" : "Select city first"}
            disabled={!city}
            list={postalListId}
          />
          <datalist id={postalListId}>
            {postalCodes.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
}
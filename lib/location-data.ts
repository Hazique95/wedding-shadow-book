import locationCatalog from "@/data/location-catalog.json";

export type LocationCity = {
  name: string;
  postalCodes: string[];
};

export type LocationCountry = {
  country: string;
  cities: LocationCity[];
};

export type LocationSelection = {
  country: string;
  city: string;
  postalCode: string;
};

const LOCATION_CATALOG = locationCatalog as LocationCountry[];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function normalizePostalCode(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export function getLocationCatalog() {
  return LOCATION_CATALOG;
}

export function getCountryOptions() {
  return LOCATION_CATALOG.map((entry) => entry.country);
}

export function getCitiesForCountry(country: string) {
  return LOCATION_CATALOG.find((entry) => entry.country === country)?.cities ?? [];
}

export function getPostalCodesForCity(country: string, city: string) {
  return getCitiesForCountry(country).find((entry) => entry.name === city)?.postalCodes ?? [];
}

export function resolveLocationSelection(selection: Partial<LocationSelection>) {
  const countryMatch = LOCATION_CATALOG.find(
    (entry) => normalizeText(entry.country) === normalizeText(selection.country ?? "")
  );

  if (!countryMatch) {
    return null;
  }

  const cityMatch = countryMatch.cities.find(
    (entry) => normalizeText(entry.name) === normalizeText(selection.city ?? "")
  );

  if (!cityMatch) {
    return null;
  }

  const postalCodeMatch = cityMatch.postalCodes.find(
    (value) => normalizePostalCode(value) === normalizePostalCode(selection.postalCode ?? "")
  );

  if (!postalCodeMatch) {
    return null;
  }

  return {
    country: countryMatch.country,
    city: cityMatch.name,
    postalCode: postalCodeMatch,
  } satisfies LocationSelection;
}

export function isValidLocationSelection(selection: Partial<LocationSelection>) {
  return Boolean(resolveLocationSelection(selection));
}

export function buildLocationLabel(selection: LocationSelection) {
  return `${selection.city}, ${selection.country}, ${selection.postalCode}`;
}

export function parseStoredLocationLabel(locationLabel: string | null | undefined) {
  if (!locationLabel) {
    return null;
  }

  const segments = locationLabel
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length < 3) {
    return null;
  }

  return resolveLocationSelection({
    city: segments[0],
    country: segments[1],
    postalCode: segments.slice(2).join(", "),
  });
}
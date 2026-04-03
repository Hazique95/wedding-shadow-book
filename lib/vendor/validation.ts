import { LAHORE_CENTER, LAHORE_RADIUS_KM, type VendorFormValues } from "@/lib/vendor/types";

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceInKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function validateVendorProfile(values: VendorFormValues) {
  const errors: string[] = [];

  if (!values.name.trim()) {
    errors.push("Vendor name is required.");
  }

  if (values.services.length === 0) {
    errors.push("Choose at least one service.");
  }

  if (values.hourlyRate == null || Number.isNaN(values.hourlyRate)) {
    errors.push("Hourly rate is required.");
  } else if (values.hourlyRate < 100 || values.hourlyRate > 5000) {
    errors.push("Hourly rate must be between 100 and 5000.");
  }

  if (values.locationLat == null || values.locationLng == null) {
    errors.push("Choose a location inside the Lahore service radius.");
  } else {
    const distance = distanceInKm(
      LAHORE_CENTER.lat,
      LAHORE_CENTER.lng,
      values.locationLat,
      values.locationLng
    );

    if (distance > LAHORE_RADIUS_KM) {
      errors.push("Location must be within 50km of Lahore.");
    }
  }

  return errors;
}

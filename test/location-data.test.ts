import { describe, expect, it } from "vitest";

import {
  buildLocationLabel,
  getCitiesForCountry,
  getPostalCodesForCity,
  parseStoredLocationLabel,
  resolveLocationSelection,
} from "@/lib/location-data";

describe("location catalog", () => {
  it("resolves a valid country, city, and postal code combination", () => {
    expect(
      resolveLocationSelection({
        country: "pakistan",
        city: "lahore",
        postalCode: "54000",
      })
    ).toEqual({
      country: "Pakistan",
      city: "Lahore",
      postalCode: "54000",
    });
  });

  it("builds and parses the stored location label", () => {
    const label = buildLocationLabel({
      country: "United Kingdom",
      city: "London",
      postalCode: "SW1A 1AA",
    });

    expect(label).toBe("London, United Kingdom, SW1A 1AA");
    expect(parseStoredLocationLabel(label)).toEqual({
      country: "United Kingdom",
      city: "London",
      postalCode: "SW1A 1AA",
    });
  });

  it("returns cities and postal codes for a supported country", () => {
    expect(getCitiesForCountry("Pakistan").some((city) => city.name === "Lahore")).toBe(true);
    expect(getPostalCodesForCity("Pakistan", "Lahore")).toContain("54000");
  });
});
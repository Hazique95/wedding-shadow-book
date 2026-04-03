"use client";

import { MapPinIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

declare global {
  interface Window {
    google?: typeof google;
    __wsbGooglePlacesPromise?: Promise<void>;
  }
}

type GooglePlacesInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  onCoordinatesChange: (coords: { lat: number | null; lng: number | null }) => void;
};

function loadGooglePlaces(apiKey: string) {
  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  if (!window.__wsbGooglePlacesPromise) {
    window.__wsbGooglePlacesPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Places"));
      document.head.appendChild(script);
    });
  }

  return window.__wsbGooglePlacesPromise;
}

export function GooglePlacesInput({
  value,
  onValueChange,
  onCoordinatesChange,
}: GooglePlacesInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [placesReady, setPlacesReady] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setPlacesError("Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable Google Places autocomplete.");
      return;
    }

    let listener: google.maps.MapsEventListener | undefined;
    let autocomplete: google.maps.places.Autocomplete | undefined;

    loadGooglePlaces(apiKey)
      .then(() => {
        if (!inputRef.current || !window.google?.maps?.places) {
          return;
        }

        autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry"],
        });

        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete?.getPlace();
          const label = place?.formatted_address ?? inputRef.current?.value ?? "";
          const lat = place?.geometry?.location?.lat() ?? null;
          const lng = place?.geometry?.location?.lng() ?? null;

          onValueChange(label);
          onCoordinatesChange({ lat, lng });
        });

        setPlacesReady(true);
      })
      .catch((error: Error) => {
        setPlacesError(error.message);
      });

    return () => {
      listener?.remove();
    };
  }, [onCoordinatesChange, onValueChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor="location">Location</Label>
      <div className="relative">
        <MapPinIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="location"
          ref={inputRef}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            onCoordinatesChange({ lat: null, lng: null });
          }}
          className="pl-10"
          placeholder="Start typing a city, venue, or neighborhood"
          autoComplete="off"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {placesReady
          ? "Google Places autocomplete is active. Pick a suggestion to capture exact coordinates."
          : placesError ?? "Loading Google Places autocomplete..."}
      </p>
    </div>
  );
}

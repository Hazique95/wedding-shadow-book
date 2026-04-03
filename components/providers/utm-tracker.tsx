"use client";

import { useEffect } from "react";

import { extractUTM, persistUTM } from "@/lib/utm";

export function UtmTracker() {
  useEffect(() => {
    const payload = extractUTM(new URLSearchParams(window.location.search));

    if (payload) {
      persistUTM(payload);
    }
  }, []);

  return null;
}

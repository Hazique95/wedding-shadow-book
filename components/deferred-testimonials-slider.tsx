"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";

const TestimonialsSlider = dynamic(() => import("@/components/testimonials-slider"), {
  ssr: false,
});

type Testimonial = {
  name: string;
  role: string;
  quote: string;
  initials: string;
};

type DeferredTestimonialsSliderProps = {
  items: Testimonial[];
  fallback: ReactNode;
};

export function DeferredTestimonialsSlider({ items, fallback }: DeferredTestimonialsSliderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <TestimonialsSlider items={items} /> : <>{fallback}</>;
}
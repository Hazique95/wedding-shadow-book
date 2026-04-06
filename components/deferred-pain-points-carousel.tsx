"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";

const PainPointsCarousel = dynamic(() => import("@/components/pain-points-carousel"), {
  ssr: false,
});

type PainPoint = {
  title: string;
  story: string;
  impact: string;
  label: string;
};

type DeferredPainPointsCarouselProps = {
  items: PainPoint[];
  fallback: ReactNode;
};

export function DeferredPainPointsCarousel({ items, fallback }: DeferredPainPointsCarouselProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <PainPointsCarousel items={items} /> : <>{fallback}</>;
}
"use client";

import { ChevronLeftIcon, ChevronRightIcon, QuoteIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PainPoint = {
  title: string;
  story: string;
  impact: string;
  label: string;
};

type PainPointsCarouselProps = {
  items: PainPoint[];
};

export default function PainPointsCarousel({
  items,
}: PainPointsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 4800);

    return () => window.clearInterval(interval);
  }, [items.length]);

  return (
    <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
      <Card className="border-white/45 bg-white/76 dark:border-white/10 dark:bg-white/6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Flake horror stories
              </div>
              <h3 className="mt-2 font-heading text-3xl leading-none">
                One no-show becomes six fires
              </h3>
            </div>
            <QuoteIcon className="size-5 text-primary" />
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Rotate through the most common rescue scenarios and use the cards to
            preview how your A/B-tested hero copy can align with the fear buyers
            already feel.
          </p>
          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() =>
                setActiveIndex((activeIndex - 1 + items.length) % items.length)
              }
              aria-label="Previous pain point"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => setActiveIndex((activeIndex + 1) % items.length)}
              aria-label="Next pain point"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item, index) => {
          const isActive = index === activeIndex;

          return (
            <Card
              key={item.title}
              className={`min-h-full border-white/45 bg-white/76 transition-all duration-500 dark:border-white/10 dark:bg-white/6 ${
                isActive
                  ? "scale-[1.01] shadow-[0_36px_90px_-56px_rgba(150,75,95,0.75)] ring-1 ring-primary/30"
                  : "opacity-75"
              }`}
            >
              <CardContent className="flex h-full flex-col p-6">
                <div className="text-xs uppercase tracking-[0.24em] text-primary">
                  {item.label}
                </div>
                <h4 className="mt-3 font-heading text-3xl leading-none">{item.title}</h4>
                <p className="mt-4 flex-1 text-sm leading-7 text-muted-foreground">
                  {item.story}
                </p>
                <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/6 p-4 text-sm leading-6 dark:bg-white/6">
                  {item.impact}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Testimonial = {
  name: string;
  role: string;
  quote: string;
  initials: string;
};

type TestimonialsSliderProps = {
  items: Testimonial[];
};

export default function TestimonialsSlider({
  items,
}: TestimonialsSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 5600);

    return () => window.clearInterval(timer);
  }, [items.length]);

  return (
    <Card className="overflow-hidden border-white/45 bg-white/78 dark:border-white/10 dark:bg-white/6">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-primary">
              <StarIcon className="size-4 fill-current" />
              Fake testimonials slider
            </div>
            <h3 className="mt-3 font-heading text-4xl leading-none">
              Sample praise with real buying language
            </h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() =>
                setActiveIndex((activeIndex - 1 + items.length) % items.length)
              }
              aria-label="Previous testimonial"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => setActiveIndex((activeIndex + 1) % items.length)}
              aria-label="Next testimonial"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {items.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <Card
                key={item.name}
                className={`border-white/45 bg-white/85 transition-all duration-500 dark:border-white/10 dark:bg-white/8 ${
                  isActive
                    ? "translate-y-0 shadow-[0_32px_90px_-56px_rgba(150,75,95,0.75)] ring-1 ring-primary/30"
                    : "lg:translate-y-3"
                }`}
              >
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-11 border border-primary/20 bg-primary/10">
                      <AvatarFallback className="bg-primary/10 font-medium text-primary">
                        {item.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.role}</div>
                    </div>
                  </div>
                  <p className="mt-5 flex-1 text-sm leading-7 text-foreground/85">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div className="mt-4 flex gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <StarIcon key={starIndex} className="size-4 fill-current" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

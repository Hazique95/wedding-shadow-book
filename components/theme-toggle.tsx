"use client";

import { MoonStarIcon, SunMediumIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div aria-hidden className="size-8 rounded-full border border-transparent sm:size-9" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full border-white/50 bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/8"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {isDark ? <SunMediumIcon className="size-4" /> : <MoonStarIcon className="size-4" />}
    </Button>
  );
}

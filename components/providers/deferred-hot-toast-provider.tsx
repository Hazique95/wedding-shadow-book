"use client";

import dynamic from "next/dynamic";

const HotToastProvider = dynamic(
  () => import("@/components/providers/hot-toast-provider").then((module) => module.HotToastProvider),
  { ssr: false }
);

export function DeferredHotToastProvider() {
  return <HotToastProvider />;
}
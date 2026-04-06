"use client";

import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";

const DemoDialog = dynamic(() => import("@/components/demo-dialog"), {
  ssr: false,
  loading: () => (
    <Button
      variant="outline"
      className="h-12 rounded-full border-white/60 bg-white/72 px-6 text-sm shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/7"
      disabled
    >
      Watch Demo
    </Button>
  ),
});

type DeferredDemoDialogProps = {
  videoUrl: string;
};

export function DeferredDemoDialog({ videoUrl }: DeferredDemoDialogProps) {
  return <DemoDialog videoUrl={videoUrl} />;
}
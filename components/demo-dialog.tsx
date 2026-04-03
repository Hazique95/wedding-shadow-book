"use client";

import { PlayCircleIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DemoDialogProps = {
  videoUrl: string;
};

export default function DemoDialog({ videoUrl }: DemoDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-12 rounded-full border-white/60 bg-white/72 px-6 text-sm shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/7"
        >
          <PlayCircleIcon className="size-4" />
          Watch Demo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl overflow-hidden border-white/40 bg-background/96 p-0 sm:max-w-4xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="font-heading text-3xl">See the rescue flow in action</DialogTitle>
          <DialogDescription>
            Swap in your Loom, Vimeo, or YouTube product walkthrough with the
            <code className="mx-1 rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_DEMO_VIDEO_URL</code>
            environment variable.
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="overflow-hidden rounded-[1.5rem] border border-border bg-black">
            {open ? (
              <iframe
                title="Wedding Shadow Book demo"
                src={videoUrl}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <div className="aspect-video w-full bg-gradient-to-br from-rose-950 via-rose-900 to-amber-700" />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

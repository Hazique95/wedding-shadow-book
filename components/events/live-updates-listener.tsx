"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

import { createBrowserClient } from "@/lib/supabase/browser";

type NotificationPayload = {
  id: string;
  kind: string;
  title: string;
  body: string;
};

export function LiveUpdatesListener({ userId }: { userId: string }) {
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`user-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: NotificationPayload }) => {
          const next = payload.new as NotificationPayload;

          if (!next?.id || seenIds.current.has(next.id)) {
            return;
          }

          seenIds.current.add(next.id);
          toast.success(`${next.title}: ${next.body}`);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
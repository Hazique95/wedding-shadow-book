"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to sign out.");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign out.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="rounded-full"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      <LogOutIcon className="size-4" />
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
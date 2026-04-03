"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    router.replace("/login");
    router.refresh();
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

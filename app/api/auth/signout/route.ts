import { NextResponse } from "next/server";

import { createRouteClient } from "@/lib/supabase/route";

export async function POST() {
  const supabase = await createRouteClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
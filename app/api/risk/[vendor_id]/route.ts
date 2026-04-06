import { NextRequest, NextResponse } from "next/server";

import { getVendorRiskAnalysis, VendorRiskServiceError } from "@/lib/risk/service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, context: { params: Promise<{ vendor_id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { vendor_id: vendorId } = await context.params;

  if (!vendorId) {
    return NextResponse.json({ error: "Vendor id is required." }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const actorKey = user.id || forwardedFor || "anonymous";

  try {
    const analysis = await getVendorRiskAnalysis({
      supabase,
      vendorId,
      actorKey,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    if (error instanceof VendorRiskServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze vendor risk." },
      { status: 500 }
    );
  }
}
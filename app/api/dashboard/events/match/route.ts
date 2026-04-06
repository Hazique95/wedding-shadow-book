import { NextResponse } from "next/server";

import { getCachedVendorMatches, setCachedVendorMatches } from "@/lib/events/cache";
import type { MatchEventsResponse } from "@/lib/events/types";
import { buildEventMatchCacheKey, normalizeVendorMatch } from "@/lib/events/utils";
import { EventValidationError, parseEventSearchPayload } from "@/lib/events/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = parseEventSearchPayload(await request.json());

    const { data: eventRow, error: eventError } = await supabase
      .from("events")
      .insert({
        planner_user_id: user.id,
        venue_label: payload.venueLabel,
        venue: `POINT(${payload.venueLng} ${payload.venueLat})`,
        event_start_date: payload.startDate,
        event_end_date: payload.endDate,
        budget: payload.budget,
        services: payload.services,
        guest_count: payload.guestCount,
        search_radius_km: payload.radiusKm,
      })
      .select("id")
      .single();

    if (eventError || !eventRow) {
      return NextResponse.json({ error: eventError?.message ?? "Failed to create event." }, { status: 500 });
    }

    const cacheKey = buildEventMatchCacheKey(payload);
    const cachedMatches = await getCachedVendorMatches(cacheKey);

    const matches = cachedMatches
      ? cachedMatches
      : await (async () => {
          const { data, error } = await supabase.rpc("match_event_vendors", {
            search_lat: payload.venueLat,
            search_lng: payload.venueLng,
            range_start: payload.startDate,
            range_end: payload.endDate,
            service_filter: payload.services,
            radius_meters: payload.radiusKm * 1000,
            result_limit: 5,
          });

          if (error) {
            throw new Error(error.message);
          }

          const normalized = ((data ?? []) as Array<Record<string, unknown>>).map((entry) =>
            normalizeVendorMatch(entry as never)
          );

          await setCachedVendorMatches(cacheKey, normalized);
          return normalized;
        })();

    const response: MatchEventsResponse = {
      eventId: eventRow.id,
      matches,
      cached: Boolean(cachedMatches),
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof EventValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search vendors." },
      { status: 500 }
    );
  }
}
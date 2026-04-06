import { formatMoney } from "@/lib/currency";
import { createInAppNotification, queueNotificationJob } from "@/lib/notifications/queue";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

type BookingContext = {
  bookingId: string;
  type: "primary" | "shadow";
  status: string;
  currency: "USD" | "PKR";
  eventId: string;
  venueLabel: string;
  eventStartDate: string;
  plannerUserId: string;
  plannerEmail: string | null;
  plannerPhone: string | null;
  vendorId: string;
  vendorName: string;
  vendorUserId: string | null;
  vendorEmail: string | null;
  vendorPhone: string | null;
  escrowAmount: number;
};

function getAdminOrThrow(explicit?: AdminClient | null) {
  const admin = explicit ?? createAdminClient();

  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return admin;
}

function buildDateLabel(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function getBookingNotificationContext(bookingId: string, explicitAdmin?: AdminClient | null) {
  const admin = getAdminOrThrow(explicitAdmin);
  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .select(
      "id, event_id, planner_user_id, vendor_id, type, status, currency, escrow_amount, event:events!inner(venue_label, event_start_date), vendor:vendors!inner(name, user_id)"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError || !booking) {
    throw new Error(bookingError?.message ?? "Booking not found.");
  }

  const bookingRow = booking as {
    id: string;
    event_id: string;
    planner_user_id: string;
    vendor_id: string;
    type: "primary" | "shadow";
    status: string;
    currency: string;
    escrow_amount: number | string | null;
    event: { venue_label: string; event_start_date: string } | Array<{ venue_label: string; event_start_date: string }> | null;
    vendor: { name: string; user_id: string | null } | Array<{ name: string; user_id: string | null }> | null;
  };
  const eventRelation = Array.isArray(bookingRow.event) ? bookingRow.event[0] : bookingRow.event;
  const vendorRelation = Array.isArray(bookingRow.vendor) ? bookingRow.vendor[0] : bookingRow.vendor;
  const plannerUserId = bookingRow.planner_user_id;
  const vendorUserId = vendorRelation?.user_id ?? null;
  const [plannerProfileResult, vendorProfileResult] = await Promise.all([
    admin.from("users").select("email, phone_number").eq("id", plannerUserId).maybeSingle(),
    vendorUserId ? admin.from("users").select("email, phone_number").eq("id", vendorUserId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const plannerProfile = plannerProfileResult.data as { email?: string | null; phone_number?: string | null } | null;
  const vendorProfile = vendorProfileResult.data as { email?: string | null; phone_number?: string | null } | null;

  return {
    bookingId: bookingRow.id,
    type: bookingRow.type,
    status: bookingRow.status,
    currency: bookingRow.currency === "PKR" ? "PKR" : "USD",
    eventId: bookingRow.event_id,
    venueLabel: eventRelation?.venue_label ?? "Venue pending",
    eventStartDate: eventRelation?.event_start_date ?? new Date().toISOString().slice(0, 10),
    plannerUserId,
    plannerEmail: plannerProfile?.email ?? null,
    plannerPhone: plannerProfile?.phone_number ?? null,
    vendorId: bookingRow.vendor_id,
    vendorName: vendorRelation?.name ?? "Vendor",
    vendorUserId,
    vendorEmail: vendorProfile?.email ?? null,
    vendorPhone: vendorProfile?.phone_number ?? null,
    escrowAmount: Number(bookingRow.escrow_amount ?? 0),
  } satisfies BookingContext;
}

export async function notifyBookingPaid(bookingId: string, explicitAdmin?: AdminClient | null) {
  const admin = getAdminOrThrow(explicitAdmin);
  const context = await getBookingNotificationContext(bookingId, admin);
  const dateLabel = buildDateLabel(context.eventStartDate);
  const title = `${context.type === "shadow" ? "Shadow" : "Primary"} booking paid`;
  const body = `${context.vendorName} is secured for ${dateLabel} at ${context.venueLabel}.`;

  await createInAppNotification(
    {
      userId: context.plannerUserId,
      kind: "booking_paid",
      title,
      body,
      metadata: {
        bookingId: context.bookingId,
        eventId: context.eventId,
        vendorId: context.vendorId,
        type: context.type,
      },
    },
    admin
  );

  if (context.type === "shadow" && context.plannerPhone) {
    await queueNotificationJob(
      {
        userId: context.plannerUserId,
        bookingId: context.bookingId,
        channel: "sms",
        templateKey: "booking_shadow_locked",
        recipient: context.plannerPhone,
        payload: {
          vendorName: context.vendorName,
          dateLabel,
          venueLabel: context.venueLabel,
        },
      },
      admin
    );
  }
}

export async function notifyPaymentFailed(bookingId: string, explicitAdmin?: AdminClient | null) {
  const admin = getAdminOrThrow(explicitAdmin);
  const context = await getBookingNotificationContext(bookingId, admin);

  await createInAppNotification(
    {
      userId: context.plannerUserId,
      kind: "payment_failed",
      title: "Payment needs attention",
      body: `${context.vendorName}'s ${context.type} booking could not be charged. Retry the checkout to keep coverage live.`,
      metadata: {
        bookingId: context.bookingId,
        eventId: context.eventId,
      },
    },
    admin
  );
}

export async function notifyPrimaryCancelled(bookingId: string, explicitAdmin?: AdminClient | null) {
  const admin = getAdminOrThrow(explicitAdmin);
  const context = await getBookingNotificationContext(bookingId, admin);
  const dateLabel = buildDateLabel(context.eventStartDate);

  await createInAppNotification(
    {
      userId: context.plannerUserId,
      kind: "booking_cancelled",
      title: "Primary booking cancelled",
      body: `${context.vendorName} was released for ${dateLabel}. Shadow backups are being alerted now.`,
      metadata: {
        bookingId: context.bookingId,
        eventId: context.eventId,
        vendorId: context.vendorId,
      },
    },
    admin
  );

  const { data: shadowRows, error } = await admin
    .from("bookings")
    .select("id, vendor_id, vendors!inner(name, user_id)")
    .eq("event_id", context.eventId)
    .eq("type", "shadow")
    .in("status", ["paid", "confirmed"]);

  if (error) {
    throw error;
  }

  for (const shadowRow of (shadowRows ?? []) as Array<{ id: string; vendors: { name: string; user_id: string | null } | Array<{ name: string; user_id: string | null }> }>) {
    const vendor = Array.isArray(shadowRow.vendors) ? shadowRow.vendors[0] : shadowRow.vendors;

    if (!vendor?.user_id) {
      continue;
    }

    const { data: vendorProfile } = await admin.from("users").select("phone_number").eq("id", vendor.user_id).maybeSingle();
    const vendorContact = vendorProfile as { phone_number?: string | null } | null;

    await createInAppNotification(
      {
        userId: vendor.user_id,
        kind: "shadow_activation",
        title: "Primary failed - you're up!",
        body: `Planner coverage for ${dateLabel} at ${context.venueLabel} has escalated to you.`,
        metadata: {
          eventId: context.eventId,
          bookingId: shadowRow.id,
          primaryBookingId: context.bookingId,
        },
      },
      admin
    );

    if (vendorContact?.phone_number) {
      await queueNotificationJob(
        {
          userId: vendor.user_id,
          bookingId: shadowRow.id,
          channel: "sms",
          templateKey: "shadow_activation",
          recipient: vendorContact.phone_number,
          payload: {
            vendorName: vendor.name,
            dateLabel,
            venueLabel: context.venueLabel,
          },
        },
        admin
      );
    }
  }
}

export async function notifyNewMatches(input: { userId: string; eventId: string; matchCount: number; venueLabel: string }, explicitAdmin?: AdminClient | null) {
  if (input.matchCount <= 0) {
    return;
  }

  await createInAppNotification(
    {
      userId: input.userId,
      kind: "match_available",
      title: "New match available",
      body: `${input.matchCount} backup-ready vendors were found for ${input.venueLabel}.`,
      metadata: {
        eventId: input.eventId,
        matchCount: input.matchCount,
      },
    },
    explicitAdmin ?? undefined
  );
}

export async function queueWeeklyGigDigestEmails(options?: { vendorUserIds?: string[]; admin?: AdminClient | null }) {
  const admin = getAdminOrThrow(options?.admin ?? null);
  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  const startDate = today.toISOString().slice(0, 10);
  const endDate = weekEnd.toISOString().slice(0, 10);
  const weekLabel = `${today.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const { data: allVendors, error: vendorError } = await admin.from("vendors").select("id, user_id, name").not("user_id", "is", null);

  if (vendorError) {
    throw vendorError;
  }

  const vendorRows = (allVendors ?? []) as Array<{ id: string; user_id: string; name: string }>;
  const effectiveVendors = vendorRows.filter((vendor) =>
    options?.vendorUserIds?.length ? options.vendorUserIds.includes(vendor.user_id) : true
  );

  let queued = 0;

  for (const vendor of effectiveVendors as Array<{ id: string; user_id: string; name: string }>) {
    const [{ data: userProfile }, { data: bookings }, { data: gigs }] = await Promise.all([
      admin.from("users").select("email, currency").eq("id", vendor.user_id).maybeSingle(),
      admin
        .from("bookings")
        .select("id, status, vendor_payout_amount, currency, event:events!inner(venue_label, event_start_date)")
        .eq("vendor_id", vendor.id),
      admin
        .from("vendor_gigs")
        .select("id, event_name, event_date, status, payout_amount")
        .eq("vendor_id", vendor.id)
        .gte("event_date", startDate)
        .lte("event_date", endDate),
    ]);

    const vendorUser = userProfile as { email?: string | null; currency?: string | null } | null;

    if (!vendorUser?.email) {
      continue;
    }

    const digestRows = [
      ...((bookings ?? []) as Array<Record<string, unknown>>)
        .map((booking) => {
          const eventRelation = booking.event as { venue_label: string; event_start_date: string } | Array<{ venue_label: string; event_start_date: string }> | null;
          const eventRow = Array.isArray(eventRelation) ? eventRelation[0] : eventRelation;
          const eventDate = eventRow?.event_start_date;

          if (!eventDate || eventDate < startDate || eventDate > endDate) {
            return null;
          }

          return {
            id: booking.id as string,
            title: `${booking.status === "cancelled" ? "Cancelled" : "Platform"} booking`,
            date: new Date(`${eventDate}T00:00:00.000Z`).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            venue: eventRow?.venue_label ?? "Venue pending",
            status: (booking.status as string) ?? "pending",
            payoutLabel: formatMoney(Number(booking.vendor_payout_amount ?? 0), vendorUser.currency === "PKR" ? "PKR" : "USD"),
          };
        })
        .filter((booking): booking is NonNullable<typeof booking> => Boolean(booking)),
      ...((gigs ?? []) as Array<{ id: string; event_name: string; event_date: string; status: string; payout_amount: number | null }>).map((gig) => ({
        id: gig.id,
        title: gig.event_name,
        date: new Date(`${gig.event_date}T00:00:00.000Z`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        venue: "Manual gig record",
        status: gig.status,
        payoutLabel: gig.payout_amount ? formatMoney(Number(gig.payout_amount), vendorUser.currency === "PKR" ? "PKR" : "USD") : "TBD",
      })),
    ];

    if (!digestRows.length) {
      continue;
    }

    await queueNotificationJob(
      {
        userId: vendor.user_id,
        channel: "email",
        templateKey: "weekly_gig_digest",
        recipient: vendorUser.email,
        payload: {
          vendorName: vendor.name,
          weekLabel,
          gigs: digestRows,
        },
      },
      admin
    );
    queued += 1;
  }

  return { queued };
}
"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/log";
import type { ReviewDecision } from "@/lib/types";

const log = createLogger("action.review");

export interface ReviewResult {
  ok: boolean;
  error?: string;
}

/**
 * Record a human review decision on a flagged event: writes the reviewer,
 * timestamp and decision to the reviews table and moves the event out of the
 * pending queue. This is the accountable "who approved it, when" record.
 */
export async function recordReview(input: {
  eventId: string;
  reviewer: string;
  decision: ReviewDecision;
  note?: string;
}): Promise<ReviewResult> {
  const reviewer = input.reviewer.trim();
  if (!reviewer) return { ok: false, error: "A reviewer name is required." };
  if (input.decision !== "approved" && input.decision !== "rejected") {
    return { ok: false, error: "Invalid decision." };
  }

  const db = createServiceClient();
  const now = new Date().toISOString();

  const { error: reviewErr } = await db.from("reviews").insert({
    id: `rev_${crypto.randomUUID().slice(0, 12)}`,
    event_id: input.eventId,
    reviewer,
    decision: input.decision,
    note: input.note?.trim() || null,
    timestamp: now,
  });
  if (reviewErr) {
    log.error("review insert failed", { error: reviewErr.message });
    return { ok: false, error: "Could not save the review." };
  }

  const { error: updateErr } = await db
    .from("events")
    .update({ review_state: input.decision })
    .eq("id", input.eventId);
  if (updateErr) {
    log.error("event update failed", { error: updateErr.message });
    return { ok: false, error: "Review saved but event not updated." };
  }

  log.info("review recorded", { eventId: input.eventId, decision: input.decision, reviewer });
  revalidatePath("/reviews");
  revalidatePath("/");
  revalidatePath("/registry");
  return { ok: true };
}

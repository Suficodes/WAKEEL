"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/log";
import type { IncidentSeverity, IncidentStatus } from "@/lib/types";

const log = createLogger("action.incident");

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

function revalidateAll() {
  revalidatePath("/incidents");
  revalidatePath("/");
  revalidatePath("/registry");
}

/** Raise an incident — mark an agent (optionally a specific event) as wrong / challenged / escalated. */
export async function raiseIncident(input: {
  agentId: string;
  eventId?: string | null;
  title: string;
  severity: IncidentSeverity;
  openedBy: string;
}): Promise<ActionResult> {
  const title = input.title.trim();
  const openedBy = input.openedBy.trim();
  if (!title) return { ok: false, error: "A title is required." };
  if (!openedBy) return { ok: false, error: "Your name is required." };

  const db = createServiceClient();
  const id = `inc_${crypto.randomUUID().slice(0, 12)}`;
  const { error } = await db.from("incidents").insert({
    id,
    event_id: input.eventId ?? null,
    agent_id: input.agentId,
    title,
    status: "open",
    severity: input.severity,
    opened_by: openedBy,
    opened_at: new Date().toISOString(),
  });
  if (error) {
    log.error("raise failed", { error: error.message });
    return { ok: false, error: "Could not raise the incident." };
  }
  log.info("incident raised", { id, agentId: input.agentId });
  revalidateAll();
  return { ok: true, id };
}

/** Advance an incident through open → investigating → resolved. */
export async function updateIncidentStatus(input: {
  incidentId: string;
  status: IncidentStatus;
  resolutionNote?: string;
}): Promise<ActionResult> {
  const db = createServiceClient();
  const patch: Record<string, unknown> = { status: input.status };
  if (input.status === "resolved") {
    patch.resolved_at = new Date().toISOString();
    patch.resolution_note = input.resolutionNote?.trim() || null;
  } else {
    patch.resolved_at = null;
    patch.resolution_note = null;
  }

  const { error } = await db.from("incidents").update(patch).eq("id", input.incidentId);
  if (error) {
    log.error("status update failed", { error: error.message });
    return { ok: false, error: "Could not update the incident." };
  }
  log.info("incident status updated", { id: input.incidentId, status: input.status });
  revalidateAll();
  return { ok: true };
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { evaluatePolicy } from "@/lib/policy/evaluate";
import { DEFAULT_POLICY_RULES } from "@/lib/policy/rules";
import { createLogger } from "@/lib/log";

const log = createLogger("api.events");

/*
 * Event ingestion — the stack-agnostic seam any agent system reports through.
 * The contract is fixed and minimal (see CLAUDE.md); extend governance by
 * adding policy rules, never by growing this shape.
 *
 *   POST /api/events
 *   { agentId, action, input_summary, output_summary, confidence?, timestamp? }
 */
const EventInput = z.object({
  agentId: z.string().min(1),
  action: z.string().min(1),
  input_summary: z.string().default(""),
  output_summary: z.string().default(""),
  confidence: z.number().min(0).max(1).nullish(),
  timestamp: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = EventInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid event", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const input = parsed.data;

  const db = createServiceClient();

  // Agent must be registered — governance requires a known, owned actor.
  const { data: agent, error: agentErr } = await db
    .from("agents")
    .select("id")
    .eq("id", input.agentId)
    .maybeSingle();
  if (agentErr) {
    log.error("agent lookup failed", { error: agentErr.message });
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!agent) {
    return NextResponse.json(
      { error: `Unknown agent '${input.agentId}'. Register it first.` },
      { status: 404 },
    );
  }

  // Evaluate policy at ingestion — the exact function the seed data uses.
  const policy = evaluatePolicy(
    {
      action: input.action,
      input_summary: input.input_summary,
      output_summary: input.output_summary,
      confidence: input.confidence ?? null,
    },
    DEFAULT_POLICY_RULES,
  );

  const id = `evt_${crypto.randomUUID().slice(0, 12)}`;
  const row = {
    id,
    agent_id: input.agentId,
    action: input.action,
    input_summary: input.input_summary,
    output_summary: input.output_summary,
    confidence: input.confidence ?? null,
    timestamp: input.timestamp ?? new Date().toISOString(),
    flagged: policy.flagged,
    flag_reason: policy.reason,
    review_state: "pending",
  };

  const { error: insertErr } = await db.from("events").insert(row);
  if (insertErr) {
    log.error("insert failed", { error: insertErr.message });
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  log.info("event ingested", { id, agentId: input.agentId, flagged: policy.flagged });
  return NextResponse.json(
    {
      id,
      flagged: policy.flagged,
      flag_reason: policy.reason,
      matched_rules: policy.matched,
      review_required: policy.flagged,
    },
    { status: 201 },
  );
}

/*
 * Deterministic seed-data generator. Produces a populated, lived-in dataset:
 * ~48 agents across HR / Finance / Procurement, a realistic trickle of flagged
 * actions, and a handful of incidents (some resolved). Pure and seeded, so the
 * same data seeds Supabase and backs local UI verification.
 *
 * Flags come from the real policy engine (lib/policy) — never hand-set — so the
 * demo's flags are exactly what the ingestion API would produce.
 */

import type {
  Agent,
  AgentEvent,
  Department,
  Incident,
  Review,
} from "@/lib/types";
import { DEPARTMENTS } from "@/lib/types";
import { orbPalette } from "@/lib/orb";
import { evaluatePolicy } from "@/lib/policy/evaluate";
import { DEFAULT_POLICY_RULES } from "@/lib/policy/rules";
import {
  ACTIONS,
  AGENT_TEMPLATES,
  INCIDENT_TEMPLATES,
  OWNERS,
  UNITS,
  VENDORS,
} from "@/lib/data/vocab";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(rng: () => number, arr: T[]): T => arr[Math.floor(rng() * arr.length)];

export interface SeedData {
  agents: Agent[];
  events: AgentEvent[];
  reviews: Review[];
  incidents: Incident[];
}

export function generateSeedData(seed = 42, now = Date.now()): SeedData {
  const rng = mulberry32(seed);
  const agents: Agent[] = [];
  const events: AgentEvent[] = [];
  const reviews: Review[] = [];
  const incidents: Incident[] = [];

  // --- Agents (~48: templates deployed across business units, ~2/3 active) ---
  let agtCounter = 0;
  for (const dept of DEPARTMENTS) {
    AGENT_TEMPLATES[dept].forEach((tpl) => {
      // deploy each template into 1–3 units → dozens of agents overall
      const unitCount = 1 + Math.floor(rng() * 2.4);
      const units = [...UNITS].sort(() => rng() - 0.5).slice(0, unitCount);
      for (const unit of units) {
        const id = `agt_${dept.toLowerCase()}_${String(++agtCounter).padStart(2, "0")}`;
        const vendor = pick(rng, VENDORS);
        agents.push({
          id,
          name: `${tpl.name} · ${unit}`,
          owner: pick(rng, OWNERS),
          department: dept,
          purpose: tpl.purpose,
          risk_tier: tpl.risk,
          model: pick(rng, vendor.models),
          vendor: vendor.vendor,
          status: rng() > 0.34 ? "active" : "idle",
          orb_color: orbPalette(id).swatch,
          created_at: new Date(now - Math.floor(rng() * 200 + 30) * 864e5).toISOString(),
        });
      }
    });
  }

  // --- Events (3–9 per agent over the last ~10 days, newest first) ---
  let evtCounter = 0;
  for (const agent of agents) {
    const count = 3 + Math.floor(rng() * 7);
    for (let e = 0; e < count; e++) {
      const tpl = pick(rng, ACTIONS[agent.department as Department]);
      const confidence = Math.round((0.55 + rng() * 0.44) * 100) / 100;
      const ts = new Date(now - Math.floor(rng() * 10 * 864e5) - e * 36e5).toISOString();
      const id = `evt_${String(++evtCounter).padStart(5, "0")}`;

      const policy = evaluatePolicy(
        { action: tpl.action, input_summary: tpl.input, output_summary: tpl.output, confidence },
        DEFAULT_POLICY_RULES,
      );

      // flagged events resolve to pending / approved / rejected
      let review_state: AgentEvent["review_state"] = "pending";
      if (policy.flagged) {
        const roll = rng();
        review_state = roll < 0.45 ? "pending" : roll < 0.85 ? "approved" : "rejected";
      }

      events.push({
        id,
        agent_id: agent.id,
        action: tpl.action,
        input_summary: tpl.input,
        output_summary: tpl.output,
        confidence,
        timestamp: ts,
        flagged: policy.flagged,
        flag_reason: policy.reason,
        review_state: policy.flagged ? review_state : "pending",
      });

      if (policy.flagged && review_state !== "pending") {
        reviews.push({
          id: `rev_${id}`,
          event_id: id,
          reviewer: pick(rng, OWNERS),
          decision: review_state,
          note:
            review_state === "approved"
              ? "Checked against policy; within delegated authority."
              : "Returned to agent owner — exceeds threshold, needs manual handling.",
          timestamp: new Date(new Date(ts).getTime() + 36e5).toISOString(),
        });
      }
    }
  }

  events.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  // --- Incidents (a handful; ~half resolved) ---
  const flaggedEvents = events.filter((e) => e.flagged);
  INCIDENT_TEMPLATES.forEach((tpl, i) => {
    const src = flaggedEvents[Math.floor(rng() * flaggedEvents.length)];
    if (!src) return;
    const openedAt = new Date(new Date(src.timestamp).getTime() + 2 * 36e5).toISOString();
    const resolved = i % 2 === 0;
    incidents.push({
      id: `inc_${String(i + 1).padStart(3, "0")}`,
      event_id: src.id,
      agent_id: src.agent_id,
      title: tpl.title,
      status: resolved ? "resolved" : i === 1 ? "investigating" : "open",
      severity: tpl.severity,
      opened_by: pick(rng, OWNERS),
      opened_at: openedAt,
      resolved_at: resolved
        ? new Date(new Date(openedAt).getTime() + 2 * 864e5).toISOString()
        : null,
      resolution_note: resolved
        ? "Root cause traced to a stale threshold; policy rule updated and agent owner briefed."
        : null,
    });
  });

  return { agents, events, reviews, incidents };
}

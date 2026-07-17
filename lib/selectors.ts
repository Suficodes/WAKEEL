/*
 * Pure derivations over the domain data — department rollups, per-agent orb
 * state, review queue, KPI tiles. Shared by the dashboard and the PDF report so
 * both tell the identical story.
 */

import type { Agent, AgentEvent, Department, Incident } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/types";
import { resolveOrbState, type OrbState } from "@/lib/orb";

export interface AgentDerived extends Agent {
  orbState: OrbState;
  openFlags: number;
  openIncidents: number;
  eventCount: number;
  lastActive: string | null;
}

function indexOpenFlags(events: AgentEvent[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of events) {
    if (e.flagged && e.review_state === "pending") {
      m.set(e.agent_id, (m.get(e.agent_id) ?? 0) + 1);
    }
  }
  return m;
}

function indexOpenIncidents(incidents: Incident[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const i of incidents) {
    if (i.status !== "resolved") m.set(i.agent_id, (m.get(i.agent_id) ?? 0) + 1);
  }
  return m;
}

export function deriveAgents(
  agents: Agent[],
  events: AgentEvent[],
  incidents: Incident[],
): AgentDerived[] {
  const flags = indexOpenFlags(events);
  const incs = indexOpenIncidents(incidents);
  const lastByAgent = new Map<string, string>();
  const countByAgent = new Map<string, number>();
  for (const e of events) {
    countByAgent.set(e.agent_id, (countByAgent.get(e.agent_id) ?? 0) + 1);
    const prev = lastByAgent.get(e.agent_id);
    if (!prev || e.timestamp > prev) lastByAgent.set(e.agent_id, e.timestamp);
  }

  return agents.map((a) => {
    const openFlags = flags.get(a.id) ?? 0;
    const openIncidents = incs.get(a.id) ?? 0;
    return {
      ...a,
      openFlags,
      openIncidents,
      eventCount: countByAgent.get(a.id) ?? 0,
      lastActive: lastByAgent.get(a.id) ?? null,
      orbState: resolveOrbState({
        status: a.status,
        hasOpenFlag: openFlags > 0,
        hasOpenIncident: openIncidents > 0,
      }),
    };
  });
}

export interface DepartmentRollup {
  department: Department;
  total: number;
  live: number;
  idle: number;
  openFlags: number;
  openIncidents: number;
  agentIds: string[];
  /** ids of alert-state agents first, so the cluster leads with what needs attention */
  clusterIds: string[];
}

export function departmentRollups(agents: AgentDerived[]): DepartmentRollup[] {
  return DEPARTMENTS.map((dept) => {
    const inDept = agents.filter((a) => a.department === dept);
    const alerting = inDept.filter((a) => a.orbState === "alert");
    const rest = inDept.filter((a) => a.orbState !== "alert");
    return {
      department: dept,
      total: inDept.length,
      live: inDept.filter((a) => a.status === "active").length,
      idle: inDept.filter((a) => a.status === "idle").length,
      openFlags: inDept.reduce((s, a) => s + a.openFlags, 0),
      openIncidents: inDept.reduce((s, a) => s + a.openIncidents, 0),
      agentIds: inDept.map((a) => a.id),
      clusterIds: [...alerting, ...rest].map((a) => a.id),
    };
  });
}

export interface Kpis {
  totalAgents: number;
  liveAgents: number;
  pendingReviews: number;
  openIncidents: number;
  eventsToday: number;
  avgConfidence: number;
}

export function computeKpis(
  agents: Agent[],
  events: AgentEvent[],
  incidents: Incident[],
  now = Date.now(),
): Kpis {
  const dayAgo = now - 864e5;
  const withConf = events.filter((e) => e.confidence != null);
  return {
    totalAgents: agents.length,
    liveAgents: agents.filter((a) => a.status === "active").length,
    pendingReviews: events.filter((e) => e.flagged && e.review_state === "pending").length,
    openIncidents: incidents.filter((i) => i.status !== "resolved").length,
    eventsToday: events.filter((e) => +new Date(e.timestamp) >= dayAgo).length,
    avgConfidence: withConf.length
      ? withConf.reduce((s, e) => s + (e.confidence ?? 0), 0) / withConf.length
      : 0,
  };
}

export interface TrendPoint {
  label: string;
  events: number;
  flagged: number;
}

/** Bucket events into the last `days` days for the activity area chart. */
export function eventsTrend(events: AgentEvent[], days = 14, now = Date.now()): TrendPoint[] {
  const buckets: TrendPoint[] = [];
  const dayMs = 864e5;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start.getTime() - i * dayMs);
    buckets.push({
      label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      events: 0,
      flagged: 0,
    });
  }
  const firstDay = start.getTime() - (days - 1) * dayMs;
  for (const e of events) {
    const t = +new Date(e.timestamp);
    if (t < firstDay) continue;
    const idx = Math.floor((t - firstDay) / dayMs);
    if (idx < 0 || idx >= days) continue;
    buckets[idx].events += 1;
    if (e.flagged) buckets[idx].flagged += 1;
  }
  return buckets;
}

export interface DeptDatum {
  department: Department;
  agents: number;
  flags: number;
  incidents: number;
}

export function departmentChartData(agents: AgentDerived[]): DeptDatum[] {
  return departmentRollups(agents).map((r) => ({
    department: r.department,
    agents: r.total,
    flags: r.openFlags,
    incidents: r.openIncidents,
  }));
}

/**
 * A single 0–100 "governance health" score for the hero gauge: rewards a
 * responsive review queue and controlled incidents.
 */
export function governanceScore(events: AgentEvent[], incidents: Incident[]): number {
  const flagged = events.filter((e) => e.flagged);
  const decided = flagged.filter((e) => e.review_state !== "pending").length;
  const reviewRatio = flagged.length ? decided / flagged.length : 1;
  const openInc = incidents.filter((i) => i.status !== "resolved").length;
  const incidentRatio = incidents.length ? openInc / incidents.length : 0;
  const raw = reviewRatio * 0.6 + (1 - incidentRatio) * 0.4;
  return Math.round(60 + raw * 39); // keep it in a believable 60–99 band
}

export function reviewQueue(events: AgentEvent[]): AgentEvent[] {
  return events
    .filter((e) => e.flagged && e.review_state === "pending")
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
}

export function agentName(agents: Agent[], id: string): string {
  return agents.find((a) => a.id === id)?.name ?? id;
}

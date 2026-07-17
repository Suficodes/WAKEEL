import "server-only";
import { getAllData } from "@/lib/data/store";
import {
  computeKpis,
  deriveAgents,
  departmentRollups,
  type AgentDerived,
  type DepartmentRollup,
  type Kpis,
} from "@/lib/selectors";
import type { AgentEvent, Department, Incident, Review } from "@/lib/types";

export type ReportScope =
  | { kind: "organisation" }
  | { kind: "department"; department: Department }
  | { kind: "agent"; agentId: string };

export interface ReportModel {
  scope: ReportScope;
  title: string;
  subtitle: string;
  generatedAt: string;
  kpis: Kpis;
  rollups: DepartmentRollup[];
  agents: AgentDerived[];
  events: AgentEvent[];
  reviews: Review[];
  incidents: Incident[];
  /** flagged events with a recorded decision, for the review-history table */
  reviewHistory: Array<{ event: AgentEvent; review?: Review; agentName: string }>;
}

/** Assemble everything a report needs for a given scope. Pure gather + derive. */
export async function buildReportModel(scope: ReportScope): Promise<ReportModel> {
  const all = await getAllData();
  const derivedAll = deriveAgents(all.agents, all.events, all.incidents);

  // narrow to scope
  let agents = derivedAll;
  let title = "Organisation Governance Report";
  let subtitle = "All departments · every registered agent";

  if (scope.kind === "department") {
    agents = derivedAll.filter((a) => a.department === scope.department);
    title = `${scope.department} Governance Report`;
    subtitle = `${scope.department} department · ${agents.length} agents`;
  } else if (scope.kind === "agent") {
    agents = derivedAll.filter((a) => a.id === scope.agentId);
    title = `${agents[0]?.name ?? scope.agentId} — Agent Report`;
    subtitle = `${agents[0]?.department ?? ""} · owner ${agents[0]?.owner ?? "—"}`;
  }

  const agentIds = new Set(agents.map((a) => a.id));
  const events = all.events.filter((e) => agentIds.has(e.agent_id));
  const incidents = all.incidents.filter((i) => agentIds.has(i.agent_id));
  const eventIds = new Set(events.map((e) => e.id));
  const reviews = all.reviews.filter((r) => eventIds.has(r.event_id));

  const kpis = computeKpis(agents, events, incidents);
  const rollups = departmentRollups(agents).filter((r) => r.total > 0);

  const reviewByEvent = new Map(reviews.map((r) => [r.event_id, r]));
  const agentNameById = new Map(agents.map((a) => [a.id, a.name]));
  const reviewHistory = events
    .filter((e) => e.flagged)
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    .slice(0, 40)
    .map((event) => ({
      event,
      review: reviewByEvent.get(event.id),
      agentName: agentNameById.get(event.agent_id) ?? event.agent_id,
    }));

  return {
    scope,
    title,
    subtitle,
    generatedAt: new Date().toISOString(),
    kpis,
    rollups,
    agents,
    events,
    reviews,
    incidents,
    reviewHistory,
  };
}

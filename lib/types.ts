/*
 * WAKEEL domain model — shared by the API, seed generator, UI and reports.
 * The four pillars: agents (registry), events (audit trail), reviews
 * (review workflow), incidents (incident register), plus the policy config.
 */

export type Department = "HR" | "Finance" | "Procurement";
export type RiskTier = "low" | "medium" | "high" | "critical";
export type AgentStatus = "active" | "idle";

export interface Agent {
  id: string;
  name: string;
  owner: string;
  department: Department;
  purpose: string;
  risk_tier: RiskTier;
  model: string;
  vendor: string;
  status: AgentStatus;
  orb_color: string; // stored hsl swatch, derived from id at seed time
  created_at: string;
}

export type ReviewDecision = "approved" | "rejected";
export type ReviewState = "pending" | ReviewDecision;

export interface AgentEvent {
  id: string;
  agent_id: string;
  action: string;
  input_summary: string;
  output_summary: string;
  confidence: number | null;
  timestamp: string;
  flagged: boolean;
  flag_reason: string | null;
  review_state: ReviewState;
}

export interface Review {
  id: string;
  event_id: string;
  reviewer: string;
  decision: ReviewDecision;
  note: string | null;
  timestamp: string;
}

export type IncidentStatus = "open" | "investigating" | "resolved";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface Incident {
  id: string;
  event_id: string | null;
  agent_id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  opened_by: string;
  opened_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
}

// Policy engine: a small config table of thresholds. NOT a DSL.
export type PolicyOperator = "lt" | "lte" | "gt" | "gte" | "eq" | "contains";

export interface PolicyRule {
  id: string;
  description: string;
  field: "confidence" | "action" | "input_summary" | "output_summary";
  operator: PolicyOperator;
  value: string | number;
  /** all conditions of a rule must hold (simple AND) */
  and?: Array<{
    field: PolicyRule["field"];
    operator: PolicyOperator;
    value: string | number;
  }>;
  action: "require_approval";
  enabled: boolean;
}

export const DEPARTMENTS: Department[] = ["HR", "Finance", "Procurement"];
export const RISK_TIERS: RiskTier[] = ["low", "medium", "high", "critical"];

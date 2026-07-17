import type { PolicyOperator, PolicyRule } from "@/lib/types";

/** The subset of an event the policy engine reads. */
export interface PolicyInput {
  action: string;
  input_summary: string;
  output_summary: string;
  confidence: number | null;
}

export interface PolicyResult {
  flagged: boolean;
  /** ids of the rules that matched */
  matched: string[];
  /** human-readable reason (first matching rule's description) */
  reason: string | null;
}

function testOperator(
  actual: string | number | null,
  operator: PolicyOperator,
  expected: string | number,
): boolean {
  if (actual === null || actual === undefined) return false;

  if (operator === "contains") {
    return String(actual).toLowerCase().includes(String(expected).toLowerCase());
  }
  if (operator === "eq") {
    return String(actual).toLowerCase() === String(expected).toLowerCase();
  }
  // numeric comparisons
  const a = Number(actual);
  const b = Number(expected);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  switch (operator) {
    case "lt": return a < b;
    case "lte": return a <= b;
    case "gt": return a > b;
    case "gte": return a >= b;
    default: return false;
  }
}

function fieldValue(input: PolicyInput, field: PolicyRule["field"]): string | number | null {
  switch (field) {
    case "confidence": return input.confidence;
    case "action": return input.action;
    case "input_summary": return input.input_summary;
    case "output_summary": return input.output_summary;
  }
}

function ruleMatches(input: PolicyInput, rule: PolicyRule): boolean {
  if (!testOperator(fieldValue(input, rule.field), rule.operator, rule.value)) return false;
  // all AND conditions must also hold
  for (const cond of rule.and ?? []) {
    if (!testOperator(fieldValue(input, cond.field), cond.operator, cond.value)) return false;
  }
  return true;
}

/**
 * Evaluate an event against the policy table. Returns whether it must be
 * flagged for human approval, and why. Pure and deterministic — the seed
 * generator and the ingestion API share this exact function so flags are
 * consistent everywhere.
 */
export function evaluatePolicy(input: PolicyInput, rules: PolicyRule[]): PolicyResult {
  const matched: string[] = [];
  let reason: string | null = null;
  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (ruleMatches(input, rule)) {
      matched.push(rule.id);
      if (!reason) reason = rule.description;
    }
  }
  return { flagged: matched.length > 0, matched, reason };
}

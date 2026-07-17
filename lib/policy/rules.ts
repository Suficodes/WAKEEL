import type { PolicyRule } from "@/lib/types";

/*
 * Default policy config. Deliberately a small table of thresholds, not a DSL.
 * Governance is "active" the moment these exist; extend by adding rows, never
 * by growing the schema or inventing a rule language.
 */
export const DEFAULT_POLICY_RULES: PolicyRule[] = [
  {
    id: "pol-financial-low-confidence",
    description: "Financial action with confidence below 0.80 needs human approval",
    field: "action",
    operator: "contains",
    value: "payment",
    and: [{ field: "confidence", operator: "lt", value: 0.8 }],
    action: "require_approval",
    enabled: true,
  },
  {
    id: "pol-approve-payment",
    description: "Any payment approval is reviewed before release",
    field: "action",
    operator: "eq",
    value: "approve_payment",
    action: "require_approval",
    enabled: true,
  },
  {
    id: "pol-tender-evaluation",
    description: "Tender evaluations require committee sign-off",
    field: "action",
    operator: "eq",
    value: "evaluate_tender",
    action: "require_approval",
    enabled: true,
  },
  {
    id: "pol-generate-po",
    description: "Generated purchase orders are reviewed before issue",
    field: "action",
    operator: "eq",
    value: "generate_po",
    and: [{ field: "confidence", operator: "lt", value: 0.85 }],
    action: "require_approval",
    enabled: true,
  },
  {
    id: "pol-low-confidence",
    description: "Any action with confidence below 0.60 needs human approval",
    field: "confidence",
    operator: "lt",
    value: 0.6,
    action: "require_approval",
    enabled: true,
  },
  {
    id: "pol-contract-clause",
    description: "Contract clause reviews are checked by a human",
    field: "action",
    operator: "eq",
    value: "review_contract_clause",
    and: [{ field: "output_summary", operator: "contains", value: "flagged" }],
    action: "require_approval",
    enabled: true,
  },
];

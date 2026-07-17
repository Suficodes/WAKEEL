/*
 * Vocabulary pools for the seed generator. Grounded in what HR, Finance and
 * Procurement agents actually do inside a UAE semi-government enterprise, so
 * the demo reads as a real, lived-in system to a compliance / PMO reviewer.
 */

import type { Department, RiskTier } from "@/lib/types";

export const OWNERS = [
  "Aisha Al Mansoori",
  "Omar Haddad",
  "Fatima Al Suwaidi",
  "Rashid Khan",
  "Layla Nasser",
  "Yousef Al Balushi",
  "Mariam Farah",
  "Tariq Abdullah",
  "Noura Al Hashimi",
  "Hassan Rahimi",
  "Sara Ibrahim",
  "Khalid Al Zaabi",
];

// Business units an agent type can be deployed into — the same agent often runs
// per unit, which is how a real enterprise reaches dozens of agents.
export const UNITS = ["Corporate", "Shared Services", "Projects", "Retail"];

export const VENDORS: Array<{ vendor: string; models: string[] }> = [
  { vendor: "OpenAI", models: ["GPT-4o", "GPT-4o-mini", "o3"] },
  { vendor: "Anthropic", models: ["Claude Opus 4", "Claude Sonnet 4"] },
  { vendor: "Google", models: ["Gemini 2.5 Pro", "Gemini 2.5 Flash"] },
  { vendor: "Meta", models: ["Llama 4 Maverick"] },
  { vendor: "In-house (GRASP)", models: ["GRASP Loop v2"] },
];

interface AgentTemplate {
  name: string;
  purpose: string;
  risk: RiskTier;
}

export const AGENT_TEMPLATES: Record<Department, AgentTemplate[]> = {
  HR: [
    { name: "CV Screening Agent", purpose: "Ranks applicants against role criteria", risk: "high" },
    { name: "Onboarding Assistant", purpose: "Guides new joiners through day-one tasks", risk: "low" },
    { name: "Leave Balance Bot", purpose: "Answers leave and entitlement queries", risk: "low" },
    { name: "Performance Summary Agent", purpose: "Drafts appraisal summaries from notes", risk: "medium" },
    { name: "Payroll Query Agent", purpose: "Explains payslip and deduction questions", risk: "high" },
    { name: "Policy Advisor", purpose: "Answers HR policy questions for staff", risk: "medium" },
    { name: "Grievance Intake Agent", purpose: "Logs and triages staff grievances", risk: "high" },
    { name: "Shift Roster Planner", purpose: "Proposes rosters within labour rules", risk: "medium" },
  ],
  Finance: [
    { name: "Invoice Reconciliation Agent", purpose: "Matches invoices to purchase orders", risk: "high" },
    { name: "Expense Audit Agent", purpose: "Flags out-of-policy expense claims", risk: "high" },
    { name: "Budget Variance Analyst", purpose: "Explains monthly budget variances", risk: "medium" },
    { name: "Payment Approval Assistant", purpose: "Pre-checks payment runs before release", risk: "critical" },
    { name: "Tax Filing Helper", purpose: "Prepares VAT return line items", risk: "high" },
    { name: "Cashflow Forecaster", purpose: "Projects short-term liquidity", risk: "medium" },
    { name: "Vendor Statement Matcher", purpose: "Reconciles vendor statements", risk: "medium" },
    { name: "Journal Entry Drafter", purpose: "Drafts month-end journal entries", risk: "high" },
  ],
  Procurement: [
    { name: "Supplier Sourcing Agent", purpose: "Shortlists suppliers for RFQs", risk: "medium" },
    { name: "Contract Clause Reviewer", purpose: "Flags risky clauses in contracts", risk: "high" },
    { name: "PO Generation Agent", purpose: "Drafts purchase orders from requisitions", risk: "high" },
    { name: "Spend Analysis Agent", purpose: "Summarises category spend trends", risk: "low" },
    { name: "Tender Evaluation Assistant", purpose: "Scores tender responses against criteria", risk: "critical" },
    { name: "Supplier Risk Monitor", purpose: "Tracks supplier compliance status", risk: "medium" },
    { name: "Delivery Tracking Bot", purpose: "Chases and logs delivery status", risk: "low" },
  ],
};

// Action templates → [action, inputSummary, outputSummary]. `touchesFinancial`
// marks actions the policy engine treats as financially sensitive.
interface ActionTemplate {
  action: string;
  input: string;
  output: string;
  touchesFinancial?: boolean;
}

export const ACTIONS: Record<Department, ActionTemplate[]> = {
  HR: [
    { action: "screen_candidate", input: "CV for Senior Analyst role", output: "Ranked 3rd of 18; strong on SQL, thin on domain" },
    { action: "answer_leave_query", input: "Remaining annual leave for staff #4821", output: "12.5 days remaining, 3 pending approval" },
    { action: "draft_appraisal", input: "Manager notes for Q2 review", output: "Drafted 400-word summary, rating 'exceeds'" },
    { action: "explain_payslip", input: "Query on July deduction", output: "Deduction is pension top-up per policy HR-14", touchesFinancial: true },
    { action: "triage_grievance", input: "Reported workload concern", output: "Categorised as 'workload', routed to line manager" },
  ],
  Finance: [
    { action: "reconcile_invoice", input: "Invoice INV-20418 vs PO-9931", output: "Matched; AED 42,900 within tolerance", touchesFinancial: true },
    { action: "audit_expense", input: "Expense claim EXP-3320", output: "Flagged: AED 1,200 meal over per-diem cap", touchesFinancial: true },
    { action: "approve_payment", input: "Payment run batch #77", output: "Pre-approved 61 of 63 payments", touchesFinancial: true },
    { action: "forecast_cashflow", input: "30-day liquidity request", output: "Projected AED 2.1M closing balance", touchesFinancial: true },
    { action: "draft_journal", input: "Month-end accruals", output: "Drafted 14 journal lines for review", touchesFinancial: true },
  ],
  Procurement: [
    { action: "shortlist_supplier", input: "RFQ for network hardware", output: "Shortlisted 4 of 22 suppliers" },
    { action: "review_contract_clause", input: "Draft MSA v3", output: "Flagged uncapped liability in clause 11.2" },
    { action: "generate_po", input: "Requisition REQ-5540", output: "Drafted PO for AED 88,000", touchesFinancial: true },
    { action: "evaluate_tender", input: "Tender T-2025-19 responses", output: "Scored 6 bids; top score 87/100", touchesFinancial: true },
    { action: "check_supplier_risk", input: "Supplier ACME Trading", output: "Trade licence expires in 21 days" },
  ],
};

export const INCIDENT_TEMPLATES = [
  { title: "Incorrect payslip deduction communicated to staff", severity: "high" as const },
  { title: "Duplicate purchase order raised for single requisition", severity: "medium" as const },
  { title: "Candidate ranking challenged as biased by hiring manager", severity: "high" as const },
  { title: "Payment pre-approved above delegated authority limit", severity: "critical" as const },
  { title: "Tender score disputed by evaluation committee", severity: "medium" as const },
];

export const FLAG_REASONS = [
  "Touches financial data with confidence below 0.80",
  "Payment action above AED 50,000 threshold",
  "Contract clause flagged as high-risk",
  "Candidate ranking affects employment decision",
  "Tender evaluation requires committee sign-off",
];

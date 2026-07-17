# WAKEEL — Agent Registry & Governance Layer for Agentic AI

"Wakeel" (وكيل) is Arabic for an appointed agent or trustee — someone given
authority to act on your behalf, and who is accountable for how they use it.
That's exactly the product: a control layer that sits above whatever AI agents
a company runs, tracking who they are, what they're allowed to do, what they
did, and what happens when they get it wrong.

## What this is

Enterprises across the UAE are being mandated onto agentic AI faster than
their oversight of it can mature. Companies are deploying dozens of agents
across departments — often without a central inventory of what exists, who
owns it, or what it's touched. WAKEEL is the missing control layer: a
lightweight platform that gives a company a live registry of its AI agents,
an audit trail of their actions, a human-review workflow for high-risk
actions, and an incident log for when something goes wrong.

This is a portfolio-and-pitch project, aimed at UAE/GCC semi-government and
regulated enterprises (utilities, banks, energy) as the target buyer, and
positioned toward risk, PMO, and compliance stakeholders — not security
teams. Its purpose is to demonstrate:
1. Real product thinking grounded in an active, named market gap — not a
   speculative feature list.
2. The ability to design for a specific enterprise buyer (board-ready
   reporting, named accountability, auditability) rather than a generic
   dashboard.
3. A working integration with a real agent system (see "Real integration"
   below), proving this isn't just mockup data.

## Non-goals — do not add these without asking

- No security/threat-detection features (prompt injection defense, anomaly
  detection, etc.) — that's a different, already crowded category. WAKEEL is
  about **evidence and accountability**, not security.
- No general-purpose "rules engine" or policy DSL. The policy engine is a
  simple config table of thresholds — do not over-engineer it into a
  programming language.
- No multi-tenant SaaS infrastructure, billing, or public signup flow. This
  is a pitch-ready product for design-partner demos, not a live commercial
  service yet.
- Do not build integrations with specific enterprise tools (SAP, ServiceNow,
  etc.) — the ingestion SDK must stay generic and stack-agnostic.
- Do not let the feature list grow past the four core pillars below. A
  focused four-pillar product is a stronger pitch than a sprawling one.

## The four pillars (the entire MVP scope)

1. **Agent registry** — every AI agent in use: owner, department, purpose,
   risk tier, model/vendor.
2. **Audit trail** — a live event log per agent: action taken, input/output
   summary, timestamp, confidence score.
3. **Review workflow** — actions above a configured risk threshold are
   flagged for human approval; capture reviewer identity, timestamp, and
   decision.
4. **Incident register** — mark any event as wrong/challenged/escalated,
   track it through to resolution.

## Architecture

### Stack
- **Frontend**: Next.js + Tailwind, shadcn/ui components, Framer Motion for
  animation. Use a normal, fast-to-ship stack here — unlike GRASP, the
  differentiator in this project is domain insight and the pilot
  relationship, not framework-building. Motion is where the craft shows;
  see "Visual design direction" below.
- **Backend/DB**: Supabase (Postgres + auth + row-level security) to move
  fast. Prisma if a plain Node/Express backend is preferred instead.
- **Reports**: server-side PDF/Word generation for exportable audit reports
  (see below).

### Ingestion layer — the one piece to build carefully
A small, stack-agnostic SDK/webhook so any agent system can report activity:
```
POST /api/events
{
  agentId: string,
  action: string,
  input_summary: string,
  output_summary: string,
  confidence?: number,
  timestamp: string
}
```
Keep this contract minimal and stable — it's what lets WAKEEL plug into any
agent stack (n8n, LangChain, a custom loop like GRASP) without per-vendor
integration work. Don't add fields speculatively.

### Policy engine
Deliberately simple: a config table of rules of the shape
`{ condition: field + operator + value, action: "require_approval" }`
(e.g. "action touches financial data AND confidence < 0.8 → require
approval"). This is enough to prove governance is active, not a full DSL.

### Report export
One-click PDF/Word audit report, per agent or per department, covering
registry status, review history, and open incidents. This is the artifact a
compliance officer would actually bring into a board meeting — reuse the
branded-document instincts from the DEWA Phase 2 Strategic Review and Value
Realization Framework work for tone and structure.

### Real integration
Wire GRASP's action log (or a simple n8n flow) into WAKEEL's `/api/events`
endpoint, so at least one agent in the registry is reporting real activity,
not simulated data. This is what turns "mockup" into "working system" in a
pitch meeting.

### Seed data generator
A script that populates ~40-60 simulated agents across HR, finance, and
procurement, with a realistic trickle of flagged actions and a couple of
resolved incidents — so the first demo shows a populated, lived-in system,
not an empty state.

## Visual design direction

The product's pitch depends on being read as a serious enterprise risk tool
by compliance and PMO stakeholders, not a consumer app. Visual polish should
build trust and speed of comprehension, not spectacle. Within that
constraint, avoid generic dashboard-template defaults — but hold the line
against effects that belong on a marketing site, not a working tool someone
opens repeatedly during a workday.

- **Motion**: Framer Motion throughout, spring-based transitions by default,
  not linear/stiff CSS. Motion must always communicate a real state change —
  a new event arriving, an agent going idle, a flag being raised — never be
  decorative for its own sake.
- **Signature visual: the agent orb.** Each agent gets a persistent, uniquely
  colored orb, assigned per agent and stable across sessions, that pulses
  while the agent is active, dims when idle, and shifts to a distinct alert
  state (sharper pulse, red-shifted ring) when it has a flagged action or
  open incident. This is the product's one bold visual element. Use it
  consistently: in the registry list, on department summary cards, and in
  the live event feed.
- **Department rollups**: cards showing agent count, live/idle split, and
  open flags/incidents at a glance, with a small clustered preview of that
  department's orb colors, not just a number.
- **Subtle depth, used sparingly**: light glassmorphism and layered elevation
  on cards is fine for a premium feel. A gentle 3D tilt on hover is fine on
  summary/department cards specifically, where it's low-stakes. Do not apply
  tilt or hover-reveal effects to data tables, the event feed, or anything a
  user needs to scan quickly and reliably — clarity beats flair wherever
  someone is reading data to make a decision.
- **Entrance animations**: reserved for real, meaningful moments — a new live
  event sliding into the feed, a card transitioning when an agent gets
  flagged. No scroll-triggered storytelling, parallax, or "exploding object"
  reveals. This is a single-viewport working dashboard, not a landing page.
- **No decorative ambient effects** — floating particles, stardust, heavy
  noise textures — beyond a very restrained background texture that doesn't
  compete with data. A government-adjacent risk officer needs to trust this
  at a glance; overwrought motion undermines that more than it impresses
  anyone.

The direction to hold onto: execute one outstanding signature element (the
agent orb system) with real craft, rather than layering in every high-end
pattern available. That restraint is what reads as considered and expensive
to the people evaluating this — not the density of effects.

## Suggested structure
```
/app              - Next.js app (dashboard, registry, review, incidents)
/api              - event ingestion, policy evaluation, report generation
/lib/policy       - policy engine (rule evaluation)
/lib/reports      - PDF/Word report generation
/scripts/seed     - seed data generator
/integrations     - GRASP (or n8n) → WAKEEL event bridge
CLAUDE.md
README.md
```

## Build order / milestones
- [ ] M1: DB schema (agents, events, reviews, incidents) + seed data
      generator producing a populated demo dataset.
- [ ] M2: Event ingestion API, tested against the seed generator and a
      manual curl/Postman call.
- [ ] M3: Dashboard — registry view + live event feed, reading real data.
- [ ] M4: Policy engine — flagging rules, review queue UI, reviewer log.
- [ ] M5: Incident register — flag, track, resolve.
- [ ] M6: Report export — PDF/Word, branded, per-agent and per-department.
- [ ] M7: Real integration — GRASP (or n8n) events flowing into WAKEEL live.
- [ ] M8: Auth/roles (admin vs. reviewer vs. viewer) if demoing to multiple
      stakeholders at once.

## Conventions
- Every screen should answer a question a compliance officer or PMO lead
  would actually ask — not a generic "AI dashboard" aesthetic. Ground copy
  and layout in that persona throughout.
- Keep the ingestion contract and policy config small and stable; extend
  by adding rules/data, not by growing the schema ad hoc.
- Every commit should map to a milestone above.
- This project is pitched at a named, real market gap (see project overview)
  — when in doubt about a feature, ask whether a UAE compliance/PMO
  stakeholder would recognize it as solving their actual problem.

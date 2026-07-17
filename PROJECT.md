---
goal: Give UAE/GCC regulated enterprises a live registry, audit trail, human-review workflow and incident register for the AI agents acting on their behalf — a governance layer built for risk/PMO/compliance buyers.
domain: Enterprise AI governance / GRC
audience: Risk, PMO and compliance stakeholders at UAE/GCC semi-government and regulated enterprises (utilities, banks, energy)
status: building
---

# PROJECT.md — WAKEEL

> Agent Registry & Governance Layer for Agentic AI. Single source of truth for
> project status, decisions and lessons. Maintained throughout the lifecycle.

## Project Identification

| Field | Value |
|---|---|
| **Project Name** | WAKEEL (وكيل — "appointed agent / trustee") |
| **Status** | Building — M1–M6 complete, paused before M7 for stakeholder review |
| **Start Date** | 2026-07-17 |
| **Last Updated** | 2026-07-17 |
| **Repository** | local (not yet under git) |

## Purpose

Enterprises across the UAE are being mandated onto agentic AI faster than their
oversight of it can mature — dozens of agents deployed across departments with no
central inventory of what exists, who owns it, or what it touched. WAKEEL is the
missing control layer: evidence and accountability, not security.

## Scope — the four pillars (entire MVP)

1. **Agent registry** — owner, department, purpose, risk tier, model/vendor.
2. **Audit trail** — per-agent event log: action, in/out summary, confidence, time.
3. **Review workflow** — actions above a policy threshold held for human approval.
4. **Incident register** — mark actions wrong/challenged, track to resolution.

Non-goals held to: no security/threat detection, no policy DSL (a simple config
table only), no multi-tenant SaaS/billing, no vendor-specific integrations, no
feature growth beyond the four pillars.

## Stack Deviation

The DAK default is React 19 + Vite + FastAPI + Postgres + DEWA-Astryx. WAKEEL's
own `CLAUDE.md` explicitly overrides this: **Next.js (App Router) + Tailwind +
shadcn/ui + Framer Motion + Supabase**. Rationale (from the brief): the
differentiator here is domain insight and the pilot relationship, not
framework-building, so a fast-to-ship mainstream stack is correct. Approved by
the project owner at kickoff. PDF export uses **Puppeteer** (HTML→PDF) for full
design fidelity of the board-ready report.

## Architecture

- **Frontend/API**: Next.js App Router. Server Components read data; Server
  Actions perform reviews/incident writes; Route Handlers cover ingestion,
  reports and health.
- **Database**: Supabase Postgres (5 tables) with realtime on `events` /
  `incidents` and permissive-read RLS (tighten at M8).
- **Policy engine** (`lib/policy`): a config table of thresholds evaluated by a
  single pure function shared by the seed generator and the ingestion API.
- **Ingestion** (`POST /api/events`): the fixed, stack-agnostic contract.
- **Reports** (`lib/reports`): Puppeteer renders a branded print-HTML template
  (Fraunces/Public Sans, the agent orbs as still SVGs, inline SVG charts).
- **Signature visual**: the agent orb — deterministic per-agent colour, spring
  pulse, alert state; one SVG generator shared by the UI and the PDF.

## Milestones

| # | Milestone | Status |
|---|---|---|
| M1 | Schema + seed generator (46 agents, 257 events, 5 incidents) | ✅ applied & seeded |
| M2 | Event ingestion API + health/ready | ✅ verified live (201/404/422) |
| M3 | Dashboard: overview, registry, live feed | ✅ verified |
| M4 | Policy engine + review queue + reviewer log | ✅ verified (DB write) |
| M5 | Incident register (raise → track → resolve) | ✅ verified |
| M6 | Report export (org/dept/agent, branded PDF) | ✅ verified |
| M7 | Real integration — GRASP → /api/events | ⏸ **paused for review** |
| M8 | Auth/roles (admin/reviewer/viewer) | ⏳ deferred |

## Current State & Next Steps

M1–M6 are complete and verified end-to-end against a live Supabase database.
**Paused before M7 (GRASP integration) at the owner's request** for a full
product review. Next: on approval, wire GRASP's action log into
`POST /api/events` so at least one registry agent reports real activity, then
M8 auth/roles for multi-stakeholder demos.

## Design system

Premium **light-default** enterprise theme (Linear/Stripe/21st.dev register) with
a dark toggle. Geist Sans + Geist Mono in the app; Fraunces reserved for the PDF.
Depth via a soft elevation scale (`shadow-e1…e4`) + hairlines; a restrained
ambient mesh for "vibrancy" (no particles/parallax/scroll-storytelling — held the
line per the brief's "working tool, not a landing page"). Signature agent orb is a
glossy, pulsating 3D sphere; the expanded agent/review/incident panels lead with a
large floating hero orb + name.

## Lessons

- Chromium paged-media ignores fixed `height` on the cover element; `min-height:
  100vh` fills the page box reliably.
- Keeping the policy engine a single pure function let the seed data and the live
  API flag events identically — the demo's flags are exactly what production
  would produce.

# CONVENTIONS — WAKEEL

Read this at the start of every session. Project-specific naming, layout and patterns.

## Layout

```
app/
  (dashboard)/        route group wrapped by the AppShell
    page.tsx          Overview
    registry/ reviews/ incidents/ reports/
    */actions.ts      Server Actions (reviews, incidents) — "use server"
  api/
    events/           ingestion (fixed contract) — POST
    reports/          PDF export — POST, nodejs runtime
    healthz/ readyz/  observability
components/
  orb/                AgentOrb, OrbCluster (the signature)
  shell/ dashboard/ registry/ reviews/ incidents/ reports/
  ui/                 shadcn primitives + StatusBadge
lib/
  orb.ts              orb colour + shared SVG generator (web + PDF)
  policy/             rules.ts (config) + evaluate.ts (pure engine)
  data/               generate.ts (seed), store.ts (data access), vocab.ts
  reports/            report-data, report-html, report-charts, render-pdf
  selectors.ts        pure derivations (rollups, orb state, KPIs)
  types.ts format.ts log.ts supabase/
scripts/
  db/migrate.ts  seed/index.ts  dev/ (puppeteer helpers)
supabase/migrations/  *.sql (idempotent)
```

## Rules

- **The ingestion contract and policy config are fixed.** Extend governance by
  adding policy rows / data, never by growing the schema or inventing a rule DSL.
- **One orb SVG generator** (`lib/orb.ts::orbSvg`) is the single source for the
  agent orb in both the UI and the PDF. Don't fork it.
- **Flagging logic lives only in `lib/policy/evaluate.ts`** — used by the seed
  generator and the ingestion API. Never hand-set `flagged`.
- **Data access goes through `lib/data/store.ts`** (Supabase, with a generator
  fallback when unconfigured). Pages don't query Supabase directly.
- **Writes use the service-role client** (`createServiceClient`) in Server
  Actions / Route Handlers; reads in Server Components use the SSR client.
- **Motion is truthful** — only for real state changes (event arriving, flag
  raised, item leaving the queue). No decorative animation. Tilt on summary
  cards only, never on tables/feed.
- **Panels, not modals** — use `Sheet` (slide-in) for detail/review/incident.
- **Theme**: light is the default; dark is the toggle (app-owned, no OS switch).
  Depth comes from the elevation scale (`shadow-e1…e4` utilities) + hairlines, not
  flat borders. Cards: `rounded-2xl border border-hairline bg-card shadow-e1`.
- **Type roles**: Geist Sans = display + UI (headings use `.font-display` for
  tight tracking); Geist Mono = data (ids, timestamps, confidence). Fraunces is
  used **only in the PDF report** (`lib/reports`) for board-document gravitas.
  Use the `.tabular` class for figures.
- **Ambient/vibrancy**: the soft mesh lives in `.wakeel-surface::before` only —
  restrained, never stardust/particles. Glass chrome via the `.glass` class.
- **Every screen answers a compliance/PMO question** — set it via `PageHeader`'s
  `question` prop.

## Commands

- `npm run dev` — app on :3000
- `npm run migrate` — apply `supabase/migrations` (needs `DATABASE_URL`)
- `npm run seed` — reset + populate the demo dataset
- `npm run typecheck` / `npm run lint`
- `node scripts/dev/shot.mjs <url> <out.png> [light]` — screenshot a page

## Env (`.env.local`, gitignored)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`.

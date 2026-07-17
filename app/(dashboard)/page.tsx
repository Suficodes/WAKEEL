import { ActivityChart } from "@/components/dashboard/activity-chart";
import { DepartmentCard } from "@/components/dashboard/department-card";
import { GaugeCard } from "@/components/dashboard/gauge-card";
import { LiveFeed, type FeedAgentInfo } from "@/components/dashboard/live-feed";
import { PageHeader, SectionHeader } from "@/components/shell/page-header";
import { getAllData, isSupabaseConfigured } from "@/lib/data/store";
import {
  computeKpis,
  departmentRollups,
  deriveAgents,
  eventsTrend,
  governanceScore,
} from "@/lib/selectors";
import { confidencePct } from "@/lib/format";

export default async function OverviewPage() {
  const { agents, events, incidents } = await getAllData();
  const derived = deriveAgents(agents, events, incidents);
  const rollups = departmentRollups(derived);
  const kpis = computeKpis(agents, events, incidents);
  const trend = eventsTrend(events, 14);
  const score = governanceScore(events, incidents);
  const flaggedTotal = events.filter((e) => e.flagged).length;

  const agentInfo: Record<string, FeedAgentInfo> = Object.fromEntries(
    derived.map((a) => [a.id, { name: a.name, department: a.department, orbState: a.orbState }]),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        question="Who is acting on our behalf right now?"
        title="Oversight Overview"
        subtitle="Every AI agent operating across the organisation, what it is doing, and what needs a human before it goes further."
      />

      {/* Gauge KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GaugeCard
          label="Governance health"
          value={score / 100}
          display={String(score)}
          sublabel="/ 100"
          tone="brand"
          hint="review + incident control"
        />
        <GaugeCard
          label="Live agents"
          value={kpis.totalAgents ? kpis.liveAgents / kpis.totalAgents : 0}
          display={String(kpis.liveAgents)}
          sublabel={`of ${kpis.totalAgents}`}
          tone="live"
          hint="active right now"
        />
        <GaugeCard
          label="Awaiting review"
          value={flaggedTotal ? kpis.pendingReviews / flaggedTotal : 0}
          display={String(kpis.pendingReviews)}
          sublabel="pending"
          tone="flag"
          hint={`${flaggedTotal} flagged total`}
        />
        <GaugeCard
          label="Avg confidence"
          value={kpis.avgConfidence}
          display={confidencePct(kpis.avgConfidence)}
          tone="violet"
          hint="across recorded actions"
        />
      </div>

      {/* Departments */}
      <section className="mt-8">
        <SectionHeader title="Departments" hint="live ratio · open flags · incidents" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {rollups.map((r) => (
            <DepartmentCard key={r.department} rollup={r} />
          ))}
        </div>
      </section>

      {/* Activity chart + live feed */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Agent activity</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Recorded actions over the last 14 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <Legend color="#4f7cff" label="Actions" />
              <Legend color="#ffb547" label="Flagged" />
            </div>
          </div>
          <ActivityChart data={trend} />
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-hairline pt-4">
            <MiniStat label="Registered agents" value={kpis.totalAgents} />
            <MiniStat label="Actions / 24h" value={kpis.eventsToday} />
            <MiniStat
              label="Open incidents"
              value={kpis.openIncidents}
              tone={kpis.openIncidents ? "text-incident" : undefined}
            />
          </div>
        </section>

        <section className="flex min-h-0 flex-col">
          <SectionHeader
            title="Live activity"
            hint={isSupabaseConfigured() ? "realtime" : "latest"}
          />
          <div className="glass-panel max-h-[520px] overflow-y-auto rounded-2xl px-5">
            <LiveFeed
              initialEvents={events}
              agents={agentInfo}
              realtime={isSupabaseConfigured()}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <div className={`font-display text-xl font-semibold tabular ${tone ?? ""}`}>{value}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

import { IncidentList } from "@/components/incidents/incident-list";
import { PageHeader } from "@/components/shell/page-header";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { getAllData } from "@/lib/data/store";

export default async function IncidentsPage() {
  const { agents, events, incidents } = await getAllData();

  const agentNames = Object.fromEntries(agents.map((a) => [a.id, a.name]));
  const eventMap = Object.fromEntries(events.map((e) => [e.id, e]));

  // open/investigating first, then resolved; newest first within each
  const sorted = [...incidents].sort((a, b) => {
    const rank = (s: string) => (s === "resolved" ? 1 : 0);
    if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
    return +new Date(b.opened_at) - +new Date(a.opened_at);
  });

  const open = incidents.filter((i) => i.status !== "resolved").length;
  const resolved = incidents.filter((i) => i.status === "resolved").length;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        question="When an agent got it wrong, what happened next?"
        title="Incident Register"
        subtitle="Actions challenged as wrong, escalated, or disputed — tracked from raised through to resolution, with a named owner and a root-cause note."
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <KpiTile label="Open" value={open} tone={open ? "incident" : "default"} />
        <KpiTile label="Resolved" value={resolved} tone="live" />
        <KpiTile label="Total" value={incidents.length} />
      </div>

      {incidents.length === 0 ? (
        <div className="rounded-xl border border-hairline bg-card py-16 text-center text-sm text-muted-foreground">
          No incidents on record.
        </div>
      ) : (
        <IncidentList incidents={sorted} agentNames={agentNames} events={eventMap} />
      )}
    </div>
  );
}

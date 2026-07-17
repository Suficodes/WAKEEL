import { ReviewQueue, type QueueAgentInfo } from "@/components/reviews/review-queue";
import { PageHeader } from "@/components/shell/page-header";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { getAllData } from "@/lib/data/store";
import { deriveAgents, reviewQueue } from "@/lib/selectors";

export default async function ReviewsPage() {
  const { agents, events, incidents } = await getAllData();
  const derived = deriveAgents(agents, events, incidents);
  const queue = reviewQueue(events);

  const agentInfo: Record<string, QueueAgentInfo> = Object.fromEntries(
    derived.map((a) => [
      a.id,
      { name: a.name, department: a.department, orbState: a.orbState, risk_tier: a.risk_tier },
    ]),
  );

  const decidedToday = events.filter(
    (e) => e.flagged && e.review_state !== "pending",
  ).length;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        question="What is an agent about to do that a human must approve first?"
        title="Review Queue"
        subtitle="Actions that tripped a policy threshold, held until a named reviewer approves or rejects them. Every decision is logged against a person."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiTile label="Awaiting review" value={queue.length} tone={queue.length ? "flag" : "default"} />
        <KpiTile label="Decided" value={decidedToday} tone="live" />
        <KpiTile
          label="Approval rate"
          value={
            decidedToday
              ? `${Math.round(
                  (events.filter((e) => e.review_state === "approved").length / decidedToday) * 100,
                )}%`
              : "—"
          }
        />
      </div>

      <ReviewQueue events={queue} agents={agentInfo} />
    </div>
  );
}

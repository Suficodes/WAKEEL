import { ReportBuilder } from "@/components/reports/report-builder";
import { PageHeader } from "@/components/shell/page-header";
import { getAgents } from "@/lib/data/store";

export default async function ReportsPage() {
  const agents = await getAgents();
  const list = agents
    .map((a) => ({ id: a.id, name: a.name, department: a.department }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        question="Can I put the evidence in front of the board?"
        title="Reports"
        subtitle="Export a branded, board-ready PDF of the governance record — per agent, per department, or across the whole organisation."
      />
      <ReportBuilder agents={list} />
    </div>
  );
}

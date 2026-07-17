import { RegistryTable } from "@/components/registry/registry-table";
import { PageHeader } from "@/components/shell/page-header";
import { getAllData } from "@/lib/data/store";
import { deriveAgents } from "@/lib/selectors";

export default async function RegistryPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const { department } = await searchParams;
  const { agents, events, incidents } = await getAllData();
  const derived = deriveAgents(agents, events, incidents);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        question="Which agents exist, who owns them, and what can they touch?"
        title="Agent Registry"
        subtitle="The single inventory of every AI agent in use — its owner, department, risk tier and model. Select a row for the full dossier."
      />
      <RegistryTable
        agents={derived}
        events={events}
        incidents={incidents}
        initialDepartment={department}
      />
    </div>
  );
}

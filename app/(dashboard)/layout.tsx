import { AppShell } from "@/components/shell/app-shell";
import { getAllData } from "@/lib/data/store";
import { computeKpis } from "@/lib/selectors";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { agents, events, incidents } = await getAllData();
  const kpis = computeKpis(agents, events, incidents);

  const navCounts: Record<string, number> = {
    "/reviews": kpis.pendingReviews,
    "/incidents": kpis.openIncidents,
  };

  return <AppShell navCounts={navCounts}>{children}</AppShell>;
}

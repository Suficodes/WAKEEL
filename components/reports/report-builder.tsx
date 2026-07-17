"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DEPARTMENTS } from "@/lib/types";

type ScopeKind = "organisation" | "department" | "agent";

interface Props {
  agents: Array<{ id: string; name: string; department: string }>;
}

export function ReportBuilder({ agents }: Props) {
  const [kind, setKind] = useState<ScopeKind>("organisation");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const body =
        kind === "organisation"
          ? { kind }
          : kind === "department"
            ? { kind, department }
            : { kind, agentId };
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "wakeel-report.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report generated", { description: "Your PDF has been downloaded." });
    } catch (err) {
      toast.error("Could not generate report", { description: String((err as Error).message) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
        <h2 className="text-sm font-semibold">Report scope</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose what the report covers. Each export includes registry status, review history and
          open incidents for the selected scope.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ScopeButton active={kind === "organisation"} onClick={() => setKind("organisation")} title="Whole organisation" desc="All departments" />
          <ScopeButton active={kind === "department"} onClick={() => setKind("department")} title="A department" desc="HR, Finance or Procurement" />
          <ScopeButton active={kind === "agent"} onClick={() => setKind("agent")} title="A single agent" desc="One agent's full dossier" />
        </div>

        {kind === "department" && (
          <div className="mt-4">
            <Label>Department</Label>
            <Select value={department} onValueChange={(v) => setDepartment((v as typeof department) ?? DEPARTMENTS[0])}>
              <SelectTrigger className="mt-1.5 w-full max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {kind === "agent" && (
          <div className="mt-4">
            <Label>Agent</Label>
            <Select value={agentId} onValueChange={(v) => setAgentId(v ?? "")}>
              <SelectTrigger className="mt-1.5 w-full max-w-md"><SelectValue /></SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} · {a.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={generate} disabled={busy} className="mt-6">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {busy ? "Generating…" : "Generate PDF"}
        </Button>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-brand" />
          <h2 className="text-sm font-semibold">What&apos;s inside</h2>
        </div>
        <ol className="mt-4 space-y-3">
          {[
            ["01", "Executive summary", "KPIs, the governance narrative, and a review-outcome breakdown."],
            ["02", "Department breakdown", "Agents, live split and open flags per department."],
            ["03", "Agent register", "Every agent with owner, risk tier, model and status."],
            ["04", "Review history", "Flagged actions, why, the decision and the named reviewer."],
            ["05", "Incident register", "Open and resolved incidents with root-cause notes."],
          ].map(([no, t, d]) => (
            <li key={no} className="flex gap-3">
              <span className="font-mono text-[11px] text-brand">{no}</span>
              <div>
                <div className="text-[13px] font-medium">{t}</div>
                <div className="text-[12px] text-muted-foreground">{d}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ScopeButton({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 text-left transition-colors",
        active ? "border-brand bg-brand/10" : "border-hairline hover:border-brand/40",
      )}
    >
      <div className="text-[13px] font-medium">{title}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{desc}</div>
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

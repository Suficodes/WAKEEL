"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AgentOrb } from "@/components/orb/agent-orb";
import { RiskBadge } from "@/components/registry/risk-badge";
import { AgentDetailSheet } from "@/components/registry/agent-detail-sheet";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { relativeTime } from "@/lib/format";
import { DEPARTMENTS, RISK_TIERS } from "@/lib/types";
import type { AgentEvent, Incident } from "@/lib/types";
import type { AgentDerived } from "@/lib/selectors";

interface RegistryTableProps {
  agents: AgentDerived[];
  events: AgentEvent[];
  incidents: Incident[];
  initialDepartment?: string;
}

export function RegistryTable({
  agents,
  events,
  incidents,
  initialDepartment,
}: RegistryTableProps) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>(initialDepartment ?? "all");
  const [risk, setRisk] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<AgentDerived | null>(null);

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      if (dept !== "all" && a.department !== dept) return false;
      if (risk !== "all" && a.risk_tier !== risk) return false;
      if (status === "attention" && a.orbState !== "alert") return false;
      if (status === "active" && a.status !== "active") return false;
      if (status === "idle" && a.status !== "idle") return false;
      if (q && !`${a.name} ${a.owner} ${a.vendor} ${a.model}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      return true;
    });
  }, [agents, dept, risk, status, q]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search agent, owner, vendor…"
            className="pl-9"
          />
        </div>
        <FilterSelect value={dept} onChange={setDept} placeholder="Department" all="All departments" options={DEPARTMENTS} />
        <FilterSelect value={risk} onChange={setRisk} placeholder="Risk" all="All risk tiers" options={RISK_TIERS} />
        <FilterSelect
          value={status}
          onChange={setStatus}
          placeholder="Status"
          all="All statuses"
          options={["active", "idle", "attention"]}
        />
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b border-hairline text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-4 font-medium">Agent</th>
                <th className="px-5 py-4 font-medium">Owner</th>
                <th className="px-5 py-4 font-medium">Dept</th>
                <th className="px-5 py-4 font-medium">Risk</th>
                <th className="px-5 py-4 font-medium">Model</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 text-right font-medium">Last active</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="cursor-pointer border-b border-hairline/60 transition-colors last:border-0 hover:bg-accent/40"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3.5">
                      <AgentOrb agentId={a.id} state={a.orbState} size={34} still />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{a.name}</div>
                        <div className="truncate font-mono text-xs text-muted-foreground">
                          {a.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{a.owner}</td>
                  <td className="px-5 py-4 text-muted-foreground">{a.department}</td>
                  <td className="px-5 py-4">
                    <RiskBadge tier={a.risk_tier} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm">{a.model}</div>
                    <div className="font-mono text-xs text-muted-foreground">{a.vendor}</div>
                  </td>
                  <td className="px-5 py-4">
                    {a.orbState === "alert" ? (
                      <StatusBadge tone={a.openIncidents ? "incident" : "flag"} dot>
                        {a.openIncidents ? "Incident" : "Needs review"}
                      </StatusBadge>
                    ) : a.status === "active" ? (
                      <StatusBadge tone="live" dot>Live</StatusBadge>
                    ) : (
                      <StatusBadge tone="idle" dot>Idle</StatusBadge>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-xs text-muted-foreground tabular">
                    {a.lastActive ? relativeTime(a.lastActive) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No agents match these filters. Clear a filter to widen the view.
          </div>
        )}
      </div>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        {filtered.length} of {agents.length} agents
      </p>

      <AgentDetailSheet
        agent={selected}
        events={events}
        incidents={incidents}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  all,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  all: string;
  options: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "all")}>
      <SelectTrigger className="w-40" aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{all}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

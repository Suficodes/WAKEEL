"use client";

import { AgentOrb } from "@/components/orb/agent-orb";
import { RiskBadge } from "@/components/registry/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { confidencePct, relativeTime, shortDateTime, titleCaseAction } from "@/lib/format";
import type { AgentEvent, Incident } from "@/lib/types";
import type { AgentDerived } from "@/lib/selectors";

interface Props {
  agent: AgentDerived | null;
  events: AgentEvent[];
  incidents: Incident[];
  onOpenChange: (open: boolean) => void;
}

/** Slide-in agent dossier (a panel, not a modal). The evidence for one agent. */
export function AgentDetailSheet({ agent, events, incidents, onOpenChange }: Props) {
  const agentEvents = agent
    ? events.filter((e) => e.agent_id === agent.id).slice(0, 12)
    : [];
  const agentIncidents = agent
    ? incidents.filter((i) => i.agent_id === agent.id)
    : [];

  return (
    <Sheet open={!!agent} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {agent && (
          <>
            <SheetHeader className="items-center border-b border-hairline px-6 pb-7 pt-9 text-center">
              <div className="flex h-40 items-center justify-center">
                <AgentOrb agentId={agent.id} state={agent.orbState} size={140} float />
              </div>
              <SheetTitle className="mt-5 font-display text-2xl leading-tight">
                {agent.name}
              </SheetTitle>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{agent.id}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <RiskBadge tier={agent.risk_tier} />
                {agent.orbState === "alert" ? (
                  <StatusBadge tone={agent.openIncidents ? "incident" : "flag"} dot>
                    {agent.openIncidents ? "Open incident" : "Needs review"}
                  </StatusBadge>
                ) : (
                  <StatusBadge tone={agent.status === "active" ? "live" : "idle"} dot>
                    {agent.status === "active" ? "Live" : "Idle"}
                  </StatusBadge>
                )}
              </div>
            </SheetHeader>

            <div className="grid grid-cols-2 gap-px bg-hairline">
              <Fact label="Owner" value={agent.owner} />
              <Fact label="Department" value={agent.department} />
              <Fact label="Model" value={agent.model} />
              <Fact label="Vendor" value={agent.vendor} />
            </div>

            <div className="p-6">
              <p className="text-sm text-muted-foreground">{agent.purpose}</p>
            </div>

            {agentIncidents.length > 0 && (
              <Section title="Incidents">
                {agentIncidents.map((i) => (
                  <div key={i.id} className="border-b border-hairline/60 py-3 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">{i.title}</span>
                      <StatusBadge tone={i.status === "resolved" ? "resolved" : "incident"}>
                        {i.status}
                      </StatusBadge>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      opened {relativeTime(i.opened_at)} · {i.severity}
                    </p>
                  </div>
                ))}
              </Section>
            )}

            <Section title="Recent activity" hint={`${agentEvents.length} shown`}>
              {agentEvents.map((e) => (
                <div key={e.id} className="border-b border-hairline/60 py-3 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[12px]">{titleCaseAction(e.action)}</span>
                    <div className="flex items-center gap-2">
                      {e.flagged && (
                        <StatusBadge tone="flag">
                          {e.review_state === "pending" ? "review" : e.review_state}
                        </StatusBadge>
                      )}
                      <span className="font-mono text-[11px] text-muted-foreground tabular">
                        {confidencePct(e.confidence)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">{e.output_summary}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                    {shortDateTime(e.timestamp)}
                  </p>
                </div>
              ))}
              {agentEvents.length === 0 && (
                <p className="py-3 text-sm text-muted-foreground">No recorded activity yet.</p>
              )}
            </Section>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-6 py-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-hairline px-6 py-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <span className="font-mono text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

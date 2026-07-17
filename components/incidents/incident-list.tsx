"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { AgentOrb } from "@/components/orb/agent-orb";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { updateIncidentStatus } from "@/app/(dashboard)/incidents/actions";
import { relativeTime, shortDateTime } from "@/lib/format";
import type { AgentEvent, Incident, IncidentStatus } from "@/lib/types";

const SEVERITY_TONE = {
  low: "neutral",
  medium: "brand",
  high: "flag",
  critical: "incident",
} as const;

const STATUS_TONE: Record<IncidentStatus, "incident" | "flag" | "resolved"> = {
  open: "incident",
  investigating: "flag",
  resolved: "resolved",
};

interface Props {
  incidents: Incident[];
  agentNames: Record<string, string>;
  events: Record<string, AgentEvent>;
}

export function IncidentList({ incidents, agentNames, events }: Props) {
  const [active, setActive] = useState<Incident | null>(null);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function transition(status: IncidentStatus) {
    if (!active) return;
    const id = active.id;
    startTransition(async () => {
      const res = await updateIncidentStatus({
        incidentId: id,
        status,
        resolutionNote: status === "resolved" ? note : undefined,
      });
      if (!res.ok) {
        toast.error(res.error ?? "Could not update.");
        return;
      }
      toast.success(
        status === "resolved" ? "Incident resolved" : `Marked ${status}`,
      );
      setActive({ ...active, status, resolution_note: status === "resolved" ? note : null });
      setNote("");
    });
  }

  return (
    <>
      <div className="space-y-3">
        {incidents.map((inc) => (
          <motion.button
            layout
            key={inc.id}
            onClick={() => {
              setActive(inc);
              setNote(inc.resolution_note ?? "");
            }}
            className="glass-panel glass-panel-hover flex w-full items-start gap-4 rounded-2xl p-5 text-left"
          >
            <AgentOrb
              agentId={inc.agent_id}
              state={inc.status === "resolved" ? "idle" : "alert"}
              size={34}
              still
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{inc.title}</span>
                <StatusBadge tone={SEVERITY_TONE[inc.severity]}>{inc.severity}</StatusBadge>
              </div>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {agentNames[inc.agent_id] ?? inc.agent_id} · opened by {inc.opened_by} ·{" "}
                {relativeTime(inc.opened_at)}
              </p>
            </div>
            <StatusBadge tone={STATUS_TONE[inc.status]} dot>
              {inc.status}
            </StatusBadge>
          </motion.button>
        ))}
      </div>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
          {active && (
            <>
              <SheetHeader className="items-center border-b border-hairline px-6 pb-7 pt-9 text-center">
                <div className="flex h-32 items-center justify-center">
                  <AgentOrb
                    agentId={active.agent_id}
                    state={active.status === "resolved" ? "idle" : "alert"}
                    size={116}
                    float
                  />
                </div>
                <SheetTitle className="mt-4 font-display text-xl leading-tight">
                  {active.title}
                </SheetTitle>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {agentNames[active.agent_id] ?? active.agent_id}
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <StatusBadge tone={STATUS_TONE[active.status]} dot>
                    {active.status}
                  </StatusBadge>
                  <StatusBadge tone={SEVERITY_TONE[active.severity]}>{active.severity}</StatusBadge>
                </div>
              </SheetHeader>

              {active.event_id && events[active.event_id] && (
                <div className="border-b border-hairline p-6">
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Originating action
                  </div>
                  <p className="text-sm">{events[active.event_id].output_summary}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {events[active.event_id].action} · {shortDateTime(events[active.event_id].timestamp)}
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div className="border-b border-hairline p-6">
                <Timeline
                  opened_at={active.opened_at}
                  opened_by={active.opened_by}
                  status={active.status}
                  resolved_at={active.resolved_at}
                  resolution_note={active.resolution_note}
                />
              </div>

              {/* Controls */}
              <div className="space-y-3 p-6">
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Advance
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={active.status === "open" ? "default" : "outline"}
                    disabled={pending || active.status === "open"}
                    onClick={() => transition("open")}
                  >
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant={active.status === "investigating" ? "default" : "outline"}
                    disabled={pending || active.status === "investigating"}
                    onClick={() => transition("investigating")}
                  >
                    Investigating
                  </Button>
                </div>
                {active.status !== "resolved" && (
                  <div className="rounded-lg border border-hairline p-3">
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Resolution note — root cause and what changed…"
                      rows={3}
                    />
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => transition("resolved")}
                      className="mt-2 w-full bg-live text-white hover:bg-live/90"
                    >
                      Resolve incident
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Timeline({
  opened_at,
  opened_by,
  status,
  resolved_at,
  resolution_note,
}: {
  opened_at: string;
  opened_by: string;
  status: IncidentStatus;
  resolved_at: string | null;
  resolution_note: string | null;
}) {
  return (
    <ol className="relative ml-2 space-y-4 border-l border-hairline pl-5">
      <li className="relative">
        <span className="absolute -left-[23px] top-1 size-2.5 rounded-full bg-incident" />
        <div className="text-sm">Opened by {opened_by}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{shortDateTime(opened_at)}</div>
      </li>
      {status === "investigating" && (
        <li className="relative">
          <span className="absolute -left-[23px] top-1 size-2.5 rounded-full bg-flag" />
          <div className="text-sm">Under investigation</div>
        </li>
      )}
      {resolved_at && (
        <li className="relative">
          <span className="absolute -left-[23px] top-1 size-2.5 rounded-full bg-live" />
          <div className="text-sm">Resolved</div>
          <div className="font-mono text-[11px] text-muted-foreground">{shortDateTime(resolved_at)}</div>
          {resolution_note && (
            <p className="mt-1 text-[13px] text-muted-foreground">{resolution_note}</p>
          )}
        </li>
      )}
    </ol>
  );
}

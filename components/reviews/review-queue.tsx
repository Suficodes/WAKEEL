"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useTransition } from "react";
import { Check, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AgentOrb } from "@/components/orb/agent-orb";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { recordReview } from "@/app/(dashboard)/reviews/actions";
import { confidencePct, relativeTime, shortDateTime, titleCaseAction } from "@/lib/format";
import type { AgentEvent } from "@/lib/types";
import type { OrbState } from "@/lib/orb";

export interface QueueAgentInfo {
  name: string;
  department: string;
  orbState: OrbState;
  risk_tier: string;
}

interface Props {
  events: AgentEvent[];
  agents: Record<string, QueueAgentInfo>;
}

export function ReviewQueue({ events, agents }: Props) {
  const [queue, setQueue] = useState(events);
  const [active, setActive] = useState<AgentEvent | null>(null);
  const [reviewer, setReviewer] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    try {
      // restore the reviewer name from localStorage (external system)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReviewer(localStorage.getItem("wakeel-reviewer") || "");
    } catch {}
  }, []);

  function persistReviewer(v: string) {
    setReviewer(v);
    try {
      localStorage.setItem("wakeel-reviewer", v);
    } catch {}
  }

  function decide(decision: "approved" | "rejected") {
    if (!active) return;
    if (!reviewer.trim()) {
      toast.error("Enter your name as the reviewer first.");
      return;
    }
    const eventId = active.id;
    startTransition(async () => {
      const res = await recordReview({ eventId, reviewer, decision, note });
      if (!res.ok) {
        toast.error(res.error ?? "Could not record the decision.");
        return;
      }
      setQueue((q) => q.filter((e) => e.id !== eventId));
      setActive(null);
      setNote("");
      toast.success(decision === "approved" ? "Action approved" : "Action rejected", {
        description: `Recorded against ${reviewer}.`,
      });
    });
  }

  if (queue.length === 0) {
    return (
      <div className="glass-panel flex flex-col items-center justify-center rounded-2xl py-20 text-center">
        <ShieldCheck className="size-8 text-live" />
        <p className="mt-3 font-display text-lg">The queue is clear</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No agent actions are waiting for human approval right now.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-panel overflow-hidden rounded-2xl">
        <AnimatePresence initial={false}>
          {queue.map((e) => {
            const info = agents[e.agent_id];
            return (
              <motion.button
                key={e.id}
                layout
                exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                onClick={() => setActive(e)}
                className="flex w-full items-start gap-3 border-b border-hairline/60 p-4 text-left transition-colors last:border-0 hover:bg-accent/40"
              >
                <AgentOrb agentId={e.agent_id} state="alert" size={30} still className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{info?.name ?? e.agent_id}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {titleCaseAction(e.action)}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">{e.flag_reason}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-xs tabular text-flag">
                    {confidencePct(e.confidence)}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                    {relativeTime(e.timestamp)}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
          {active && (
            <>
              <SheetHeader className="items-center border-b border-hairline px-6 pb-7 pt-9 text-center">
                <div className="flex h-32 items-center justify-center">
                  <AgentOrb agentId={active.agent_id} state="alert" size={116} float />
                </div>
                <SheetTitle className="mt-4 font-display text-xl leading-tight">
                  {agents[active.agent_id]?.name ?? active.agent_id}
                </SheetTitle>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {titleCaseAction(active.action)} · {agents[active.agent_id]?.department}
                </p>
                <div className="mt-4">
                  <StatusBadge tone="flag" dot>
                    {active.flag_reason}
                  </StatusBadge>
                </div>
              </SheetHeader>

              <div className="space-y-4 p-6">
                <Field label="Input">{active.input_summary}</Field>
                <Field label="Output">{active.output_summary}</Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Confidence">{confidencePct(active.confidence)}</Field>
                  <Field label="When">{shortDateTime(active.timestamp)}</Field>
                </div>
              </div>

              <div className="space-y-3 border-t border-hairline p-6">
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Reviewer
                  </label>
                  <Input
                    value={reviewer}
                    onChange={(e) => persistReviewer(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Note <span className="normal-case opacity-60">(optional)</span>
                  </label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Rationale for the decision…"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <Button
                    onClick={() => decide("approved")}
                    disabled={pending}
                    className="flex-1 bg-live text-white hover:bg-live/90"
                  >
                    <Check className="size-4" /> Approve
                  </Button>
                  <Button
                    onClick={() => decide("rejected")}
                    disabled={pending}
                    variant="outline"
                    className="flex-1 border-incident/40 text-incident hover:bg-incident/10"
                  >
                    <X className="size-4" /> Reject
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

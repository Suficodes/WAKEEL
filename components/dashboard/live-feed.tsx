"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AgentOrb } from "@/components/orb/agent-orb";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import { confidencePct, relativeTime, titleCaseAction } from "@/lib/format";
import type { AgentEvent } from "@/lib/types";
import type { OrbState } from "@/lib/orb";

export interface FeedAgentInfo {
  name: string;
  department: string;
  orbState: OrbState;
}

interface LiveFeedProps {
  initialEvents: AgentEvent[];
  agents: Record<string, FeedAgentInfo>;
  realtime?: boolean;
  limit?: number;
}

/**
 * Live event feed. New events slide in with a spring entrance — reserved for a
 * real state change (an event genuinely arriving), never decorative. Subscribes
 * to Supabase realtime when available; otherwise renders the loaded events.
 */
export function LiveFeed({
  initialEvents,
  agents,
  realtime = false,
  limit = 24,
}: LiveFeedProps) {
  const [events, setEvents] = useState<AgentEvent[]>(initialEvents.slice(0, limit));

  useEffect(() => {
    if (!realtime) return;
    const supabase = createClient();
    const channel = supabase
      .channel("events-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        (payload) => {
          const row = payload.new as AgentEvent;
          setEvents((prev) => [row, ...prev].slice(0, limit));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [realtime, limit]);

  return (
    <ul className="flex flex-col">
      <AnimatePresence initial={false}>
        {events.map((e) => {
          const info = agents[e.agent_id];
          return (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0, y: -14, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="border-b border-hairline last:border-0"
            >
              <div className="flex items-start gap-3 py-3">
                <AgentOrb
                  agentId={e.agent_id}
                  state={info?.orbState ?? "idle"}
                  size={30}
                  still
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {info?.name ?? e.agent_id}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {titleCaseAction(e.action)}
                    </span>
                    {e.flagged && (
                      <StatusBadge tone="flag" dot>
                        {e.review_state === "pending" ? "Needs review" : e.review_state}
                      </StatusBadge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                    {e.output_summary}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-xs text-muted-foreground tabular">
                    {confidencePct(e.confidence)}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                    {relativeTime(e.timestamp)}
                  </div>
                </div>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/selectors";

/** Glowing gradient area chart of agent activity over time (events + flagged). */
export function ActivityChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-events" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f7cff" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#4f7cff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-flagged" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffb547" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#ffb547" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="stroke-events" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4f7cff" />
              <stop offset="100%" stopColor="#2fe0d0" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ stroke: "var(--brand)", strokeOpacity: 0.3 }}
            content={<ChartTooltip />}
          />
          <Area
            type="monotone"
            dataKey="events"
            stroke="url(#stroke-events)"
            strokeWidth={2.5}
            fill="url(#grad-events)"
            style={{ filter: "drop-shadow(0 6px 14px rgba(79,124,255,0.35))" }}
          />
          <Area
            type="monotone"
            dataKey="flagged"
            stroke="#ffb547"
            strokeWidth={2}
            fill="url(#grad-flagged)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const events = payload.find((p) => p.dataKey === "events")?.value ?? 0;
  const flagged = payload.find((p) => p.dataKey === "flagged")?.value ?? 0;
  return (
    <div className="glass rounded-lg border border-hairline px-3 py-2 text-xs shadow-e2">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-[#4f7cff]" />
        {events} actions
      </div>
      <div className="mt-0.5 flex items-center gap-2">
        <span className="size-2 rounded-full bg-flag" />
        {flagged} flagged
      </div>
    </div>
  );
}

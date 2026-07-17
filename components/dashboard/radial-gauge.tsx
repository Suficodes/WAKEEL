"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export type GaugeTone = "brand" | "live" | "flag" | "incident" | "violet";

const GRADIENTS: Record<GaugeTone, [string, string]> = {
  brand: ["#4f7cff", "#2fe0d0"],
  live: ["#2fe0a8", "#35d0ff"],
  flag: ["#ffb547", "#ff7a5c"],
  incident: ["#ff5c7c", "#ff9a5c"],
  violet: ["#a06bff", "#4f7cff"],
};

interface RadialGaugeProps {
  /** 0..1 fill fraction */
  value: number;
  /** big centre text (e.g. "77%" or "26") */
  display: string;
  label?: string;
  sublabel?: string;
  tone?: GaugeTone;
  size?: number;
  thickness?: number;
  className?: string;
}

/**
 * Circular gauge meter — the signature KPI visual (à la the reference dashboards):
 * a faint track with a gradient, glowing progress arc that animates up on mount,
 * and the value at the centre. Replaces flat "big number" tiles.
 */
export function RadialGauge({
  value,
  display,
  label,
  sublabel,
  tone = "brand",
  size = 132,
  thickness = 11,
  className,
}: RadialGaugeProps) {
  const id = useId().replace(/:/g, "");
  const [from, to] = GRADIENTS[tone];
  const v = Math.max(0, Math.min(1, value));
  const r = (size - thickness) / 2 - 3;
  const c = 2 * Math.PI * r;
  const center = size / 2;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-muted/70"
          strokeWidth={thickness}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={`url(#g-${id})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${from}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-2xl font-semibold leading-none tabular">
          {display}
        </span>
        {sublabel && (
          <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {sublabel}
          </span>
        )}
      </div>
      {label && (
        <span className="sr-only">
          {label}: {display}
        </span>
      )}
    </div>
  );
}

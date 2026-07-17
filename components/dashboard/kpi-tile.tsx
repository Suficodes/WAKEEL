"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface KpiTileProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "flag" | "incident" | "live";
  className?: string;
}

const ACCENT: Record<NonNullable<KpiTileProps["tone"]>, { text: string; bar: string }> = {
  default: { text: "text-foreground", bar: "bg-brand/60" },
  flag: { text: "text-flag", bar: "bg-flag" },
  incident: { text: "text-incident", bar: "bg-incident" },
  live: { text: "text-live", bar: "bg-live" },
};

/** A single board-ready metric: elevated card, big figure, quiet label. */
export function KpiTile({ label, value, hint, tone = "default", className }: KpiTileProps) {
  const a = ACCENT[tone];
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "glass-panel group relative flex min-h-[118px] flex-col justify-between overflow-hidden rounded-2xl p-5",
        className,
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-0.5 opacity-70", a.bar)} />
      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={cn(
            "font-display text-[2.9rem] font-semibold leading-none tabular",
            a.text,
          )}
        >
          {value}
        </span>
        {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "motion/react";

/**
 * A quiet "system is live" indicator for the top bar — a single breathing dot.
 * Communicates real state (the registry is receiving activity), not decoration.
 */
export function SystemPulse({ label = "Live" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-hairline bg-card/60 px-3 py-1">
      <span className="relative flex size-2">
        <motion.span
          className="absolute inline-flex size-full rounded-full bg-live"
          animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <span className="relative inline-flex size-2 rounded-full bg-live" />
      </span>
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

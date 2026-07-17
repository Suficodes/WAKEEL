"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { RadialGauge } from "@/components/dashboard/radial-gauge";
import type { DepartmentRollup } from "@/lib/selectors";

const DEPT_TINT: Record<string, string> = {
  HR: "#4f7cff",
  Finance: "#2fe0d0",
  Procurement: "#a06bff",
};

/**
 * Department rollup card. A mini live-ratio gauge (not the orb cluster) carries
 * the visual; gentle 3D tilt + lift on hover — a low-stakes summary surface.
 */
export function DepartmentCard({ rollup }: { rollup: DepartmentRollup }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), { stiffness: 200, damping: 18 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  const tint = DEPT_TINT[rollup.department] ?? "#4f7cff";
  const liveRatio = rollup.total ? rollup.live / rollup.total : 0;
  const tone = rollup.department === "Finance" ? "live" : rollup.department === "Procurement" ? "violet" : "brand";

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ y: -6 }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="group [transform-style:preserve-3d]"
    >
      <Link
        href={`/registry?department=${rollup.department}`}
        className="glass-panel relative flex items-center gap-5 overflow-hidden rounded-2xl p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-50"
          style={{ background: tint }}
        />
        <RadialGauge
          value={liveRatio}
          display={String(rollup.live)}
          sublabel={`of ${rollup.total}`}
          tone={tone as "brand" | "live" | "violet"}
          size={96}
          thickness={9}
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold">{rollup.department}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular">{rollup.total}</span> agents ·{" "}
            {rollup.live} live
          </p>
          <div className="mt-3 flex gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-flag" />
              <span className="tabular font-medium">{rollup.openFlags}</span>
              <span className="text-muted-foreground">flags</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-incident" />
              <span className="tabular font-medium">{rollup.openIncidents}</span>
              <span className="text-muted-foreground">incidents</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

"use client";

import { orbPalette } from "@/lib/orb";
import { cn } from "@/lib/utils";

interface OrbClusterProps {
  /** agent ids whose orb colours to preview */
  agentIds: string[];
  /** number of orbs to actually render before collapsing to a +N chip */
  max?: number;
  size?: number;
  className?: string;
}

/**
 * A tight clustered preview of a department's orb colours — used on rollup
 * cards so a department reads as its constellation of agents, not just a count.
 * Flat swatches (no pulse) to stay quiet at card scale.
 */
export function OrbCluster({
  agentIds,
  max = 6,
  size = 18,
  className,
}: OrbClusterProps) {
  const shown = agentIds.slice(0, max);
  const overflow = agentIds.length - shown.length;

  return (
    <div className={cn("flex items-center", className)}>
      {shown.map((id, i) => {
        const p = orbPalette(id);
        return (
          <span
            key={id}
            className="rounded-full ring-2 ring-card"
            style={{
              width: size,
              height: size,
              marginLeft: i === 0 ? 0 : -size * 0.32,
              background: `radial-gradient(circle at 35% 30%, ${p.core}, ${p.body} 55%, ${p.rim})`,
              boxShadow: `0 0 ${size * 0.5}px ${p.glow}55`,
              zIndex: shown.length - i,
            }}
          />
        );
      })}
      {overflow > 0 && (
        <span
          className="ml-1.5 font-mono text-[11px] text-muted-foreground tabular"
          aria-label={`${overflow} more agents`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

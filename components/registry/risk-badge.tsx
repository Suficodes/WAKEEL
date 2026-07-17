import { StatusBadge } from "@/components/ui/status-badge";
import type { RiskTier } from "@/lib/types";

const TONE: Record<RiskTier, "neutral" | "brand" | "flag" | "incident"> = {
  low: "neutral",
  medium: "brand",
  high: "flag",
  critical: "incident",
};

export function RiskBadge({ tier }: { tier: RiskTier }) {
  return (
    <StatusBadge tone={TONE[tier]}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </StatusBadge>
  );
}

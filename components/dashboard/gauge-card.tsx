import { RadialGauge, type GaugeTone } from "@/components/dashboard/radial-gauge";

interface GaugeCardProps {
  label: string;
  value: number;
  display: string;
  sublabel?: string;
  hint?: string;
  tone?: GaugeTone;
}

/** A KPI expressed as a glowing gauge meter on a glass panel. */
export function GaugeCard({ label, value, display, sublabel, hint, tone = "brand" }: GaugeCardProps) {
  return (
    <div className="glass-panel glass-panel-hover flex flex-col items-center gap-3 rounded-2xl p-5 text-center">
      <RadialGauge value={value} display={display} sublabel={sublabel} tone={tone} size={124} />
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}

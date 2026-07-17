import { cn } from "@/lib/utils";

type Tone = "live" | "idle" | "flag" | "incident" | "resolved" | "neutral" | "brand";

const TONE: Record<Tone, string> = {
  live: "text-live border-live/30 bg-live/10",
  idle: "text-idle border-idle/30 bg-idle/10",
  flag: "text-flag border-flag/30 bg-flag/10",
  incident: "text-incident border-incident/30 bg-incident/10",
  resolved: "text-resolved border-resolved/30 bg-resolved/10",
  brand: "text-brand border-brand/30 bg-brand/10",
  neutral: "text-muted-foreground border-hairline bg-muted/40",
};

export function StatusBadge({
  tone,
  children,
  dot = false,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        TONE[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  question,
  actions,
}: {
  title: string;
  subtitle?: string;
  /** the compliance/PMO question this screen answers */
  question?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        {question && (
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-brand">
            {question}
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {hint && <span className="font-mono text-xs text-muted-foreground">{hint}</span>}
      </div>
      {action}
    </div>
  );
}

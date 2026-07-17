/**
 * WAKEEL wordmark — a small "trustee's seal" orb beside the name. The Arabic
 * وكيل (agent / trustee) sits under the Latin wordmark. Used in the shell and,
 * in a print variant, on the PDF report cover.
 */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 100 100" aria-hidden className="shrink-0">
        <defs>
          <radialGradient id="brand-orb" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#8ff4e6" />
            <stop offset="45%" stopColor="#3ed0c8" />
            <stop offset="100%" stopColor="#0c4f4a" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="30" fill="url(#brand-orb)" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="#3ed0c8" strokeWidth="1.5" opacity="0.5" />
        <ellipse cx="41" cy="39" rx="10" ry="7" fill="#ffffff" opacity="0.8" />
      </svg>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-lg font-semibold tracking-tight">
            WAKEEL
          </div>
          <div
            className="mt-0.5 text-[11px] text-muted-foreground"
            style={{ direction: "rtl" }}
            lang="ar"
          >
            وكيل
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * The agent orb — WAKEEL's signature visual.
 *
 * Every agent gets a persistent, uniquely coloured orb, deterministically
 * derived from its id so it is stable across sessions. The orb pulses while
 * the agent is active, dims when idle, and shifts to a red-shifted alert
 * state when the agent has a flagged action or open incident.
 *
 * The SVG is produced by a plain string generator so the *identical* markup
 * renders in the React UI and in the server-rendered PDF report.
 */

export type OrbState = "active" | "idle" | "alert";

export interface OrbPalette {
  hue: number;
  /** luminous inner core */
  core: string;
  /** main sphere body */
  body: string;
  /** dark rim / terminator */
  rim: string;
  /** ambient glow */
  glow: string;
  /** flat swatch for clusters / legends */
  swatch: string;
}

/** Stable 32-bit hash of a string (FNV-1a). */
function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministic palette for an agent. Hues are spread with the golden angle so
 * that adjacent ids land far apart on the wheel and the whole set reads as one
 * family — same saturation/lightness, jewel-like on deep ink.
 */
export function orbPalette(agentId: string): OrbPalette {
  const hash = hashString(agentId);
  const hue = Math.round((hash * 137.508) % 360);
  return {
    hue,
    core: `hsl(${hue} 92% 74%)`,
    body: `hsl(${hue} 78% 56%)`,
    rim: `hsl(${(hue + 8) % 360} 62% 26%)`,
    glow: `hsl(${hue} 90% 62%)`,
    swatch: `hsl(${hue} 74% 58%)`,
  };
}

const ALERT_RING = "#ff5a5f";

interface OrbSvgOptions {
  palette: OrbPalette;
  state: OrbState;
  size?: number;
  /** unique suffix for gradient ids (avoids collisions when many orbs render) */
  uid: string;
  /** animate with CSS keyframes; disable for a still PDF frame */
  animated?: boolean;
}

/**
 * Returns a self-contained <svg> string. Pulse is CSS-keyframe driven (inside
 * the SVG) so it animates in the browser and can be frozen for the PDF without
 * any JavaScript.
 */
export function orbSvg({
  palette,
  state,
  size = 40,
  uid,
  animated = true,
}: OrbSvgOptions): string {
  const isAlert = state === "alert";
  const isIdle = state === "idle";
  const glowColor = isAlert ? ALERT_RING : palette.glow;
  const rimLight = isAlert ? "#ffd1d2" : palette.core;
  const bodyOpacity = isIdle ? 0.6 : 1;
  const glowOpacity = isIdle ? 0.1 : isAlert ? 0.6 : 0.42;
  const dur = isAlert ? "1.15s" : "3s";

  // A breathing sphere + pulsing halo. Idle sits still and dimmed.
  const animation =
    !animated || isIdle
      ? ""
      : `
      .orb-${uid} .orb-halo, .orb-${uid} .orb-body { transform-box: fill-box; transform-origin: center; }
      .orb-${uid} .orb-halo { animation: orbHalo-${uid} ${dur} ease-in-out infinite; }
      .orb-${uid} .orb-body { animation: orbBody-${uid} ${dur} ease-in-out infinite; }
      @keyframes orbHalo-${uid} {
        0%, 100% { opacity: ${glowOpacity}; transform: scale(1); }
        50% { opacity: ${glowOpacity + (isAlert ? 0.3 : 0.2)}; transform: scale(${isAlert ? 1.18 : 1.12}); }
      }
      @keyframes orbBody-${uid} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(${isAlert ? 1.05 : 1.035}); }
      }`;

  return `<svg class="orb-${uid}" width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="agent status ${state}" style="overflow:visible">
  <defs>
    <radialGradient id="body-${uid}" cx="36%" cy="30%" r="76%">
      <stop offset="0%" stop-color="${palette.core}"/>
      <stop offset="34%" stop-color="${palette.body}"/>
      <stop offset="78%" stop-color="${palette.body}"/>
      <stop offset="100%" stop-color="${palette.rim}"/>
    </radialGradient>
    <radialGradient id="glow-${uid}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.85"/>
      <stop offset="55%" stop-color="${glowColor}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${glowColor}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vig-${uid}" cx="68%" cy="72%" r="60%">
      <stop offset="0%" stop-color="${palette.rim}" stop-opacity="0"/>
      <stop offset="72%" stop-color="${palette.rim}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${palette.rim}" stop-opacity="0.55"/>
    </radialGradient>
    <radialGradient id="rim-${uid}" cx="70%" cy="74%" r="42%">
      <stop offset="0%" stop-color="${rimLight}" stop-opacity="0"/>
      <stop offset="62%" stop-color="${rimLight}" stop-opacity="0"/>
      <stop offset="84%" stop-color="${rimLight}" stop-opacity="${isIdle ? 0.25 : 0.7}"/>
      <stop offset="100%" stop-color="${rimLight}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="spec-${uid}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${isIdle ? 0.5 : 0.95}"/>
      <stop offset="70%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <style>${animation}</style>
  </defs>
  <circle class="orb-halo" cx="50" cy="50" r="47" fill="url(#glow-${uid})" opacity="${glowOpacity}"/>
  <g class="orb-body" opacity="${bodyOpacity}">
    <circle cx="50" cy="50" r="30" fill="url(#body-${uid})"/>
    <circle cx="50" cy="50" r="30" fill="url(#rim-${uid})"/>
    <circle cx="50" cy="50" r="30" fill="url(#vig-${uid})"/>
    <ellipse cx="40" cy="37" rx="15" ry="11" fill="url(#spec-${uid})" transform="rotate(-28 40 37)"/>
    <circle cx="43" cy="36" r="4" fill="#ffffff" opacity="${isIdle ? 0.5 : 0.92}"/>
  </g>
</svg>`;
}

/** Resolve an agent's orb state from its live/idle status and open flags. */
export function resolveOrbState(opts: {
  status: "active" | "idle";
  hasOpenFlag?: boolean;
  hasOpenIncident?: boolean;
}): OrbState {
  if (opts.hasOpenFlag || opts.hasOpenIncident) return "alert";
  return opts.status === "active" ? "active" : "idle";
}

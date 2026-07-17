/*
 * Hand-rolled inline-SVG charts for the PDF report. Self-contained (no chart
 * library in the print HTML) and print-palette (ink on paper). Kept minimal:
 * a horizontal bar set and a status donut are all the report needs.
 */

const INK = "#16202a";
const MUTED = "#6b7b88";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

export function barChart(data: BarDatum[], opts: { width?: number; unit?: string } = {}): string {
  const width = opts.width ?? 560;
  const rowH = 34;
  const labelW = 150;
  const max = Math.max(1, ...data.map((d) => d.value));
  const trackW = width - labelW - 60;

  const rows = data
    .map((d, i) => {
      const y = i * rowH;
      const w = Math.max(2, (d.value / max) * trackW);
      const color = d.color ?? "#0e9c92";
      return `
      <g transform="translate(0 ${y})">
        <text x="0" y="20" font-size="12" fill="${INK}" font-family="'Public Sans',sans-serif">${escapeXml(d.label)}</text>
        <rect x="${labelW}" y="8" width="${trackW}" height="14" rx="7" fill="#e6ebef"/>
        <rect x="${labelW}" y="8" width="${w}" height="14" rx="7" fill="${color}"/>
        <text x="${labelW + trackW + 10}" y="20" font-size="12" fill="${MUTED}" font-family="'JetBrains Mono',monospace">${d.value}${opts.unit ?? ""}</text>
      </g>`;
    })
    .join("");

  return `<svg width="${width}" height="${data.length * rowH}" viewBox="0 0 ${width} ${data.length * rowH}" xmlns="http://www.w3.org/2000/svg">${rows}</svg>`;
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function donutChart(segments: DonutSegment[], size = 160): string {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  const arcs = segments
    .map((seg) => {
      const frac = seg.value / total;
      const dash = `${frac * circ} ${circ}`;
      const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="16"
        stroke-dasharray="${dash}" stroke-dashoffset="${-offset * circ}" transform="rotate(-90 ${cx} ${cy})"/>`;
      offset += frac;
      return el;
    })
    .join("");

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#eef1f4" stroke-width="16"/>
    ${arcs}
    <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="26" font-weight="600" fill="${INK}" font-family="'Fraunces',serif">${total}</text>
    <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="10" fill="${MUTED}" font-family="'JetBrains Mono',monospace">TOTAL</text>
  </svg>`;
}

export function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );
}

/*
 * Branded print-HTML for the PDF audit report. This is the artifact a
 * compliance officer brings into a board meeting, so it carries the app's
 * design language into print: the Fraunces "seal" voice, Public Sans body,
 * the agent orbs (as still SVGs), and a light/paper palette.
 *
 * One responsibility (compose the report document); over the module line cap by
 * intent — splitting the template would hurt readability more than help.
 */

import { orbPalette, orbSvg } from "@/lib/orb";
import { barChart, donutChart, escapeXml } from "@/lib/reports/report-charts";
import { confidencePct, dateOnly, shortDateTime, titleCaseAction } from "@/lib/format";
import type { ReportModel } from "@/lib/reports/report-data";
import type { AgentDerived } from "@/lib/selectors";

const ACCENT = "#0e9c92";
const DEPT_COLORS: Record<string, string> = {
  HR: "#3b7dd8",
  Finance: "#0e9c92",
  Procurement: "#7c5cd6",
};

function orb(a: AgentDerived, size: number): string {
  return orbSvg({
    palette: orbPalette(a.id),
    state: a.orbState,
    size,
    uid: `rpt-${a.id}`,
    animated: false,
  });
}

function cover(m: ReportModel): string {
  const seal = orbSvg({
    palette: { hue: 170, core: "#8ff4e6", body: "#3ed0c8", rim: "#0c4f4a", glow: "#3ed0c8", swatch: "#3ed0c8" },
    state: "active",
    size: 92,
    uid: "cover-seal",
    animated: false,
  });
  return `
  <section class="cover">
    <div class="cover-top">
      <div class="seal">${seal}</div>
      <div class="wordmark">
        <div class="wm-name">WAKEEL</div>
        <div class="wm-ar">وكيل</div>
      </div>
    </div>
    <div class="cover-mid">
      <div class="eyebrow">Agent Registry &amp; Governance · Audit Report</div>
      <h1>${escapeXml(m.title)}</h1>
      <p class="cover-sub">${escapeXml(m.subtitle)}</p>
    </div>
    <div class="cover-foot">
      <div><span class="k">Generated</span><span class="v">${shortDateTime(m.generatedAt)}</span></div>
      <div><span class="k">Scope</span><span class="v">${m.scope.kind}</span></div>
      <div><span class="k">Classification</span><span class="v">Confidential — Board &amp; Risk Committee</span></div>
    </div>
  </section>`;
}

function kpiGrid(m: ReportModel): string {
  const items = [
    ["Registered agents", String(m.kpis.totalAgents)],
    ["Live now", String(m.kpis.liveAgents)],
    ["Awaiting review", String(m.kpis.pendingReviews)],
    ["Open incidents", String(m.kpis.openIncidents)],
    ["Recorded actions", String(m.events.length)],
    ["Avg confidence", confidencePct(m.kpis.avgConfidence)],
  ];
  return `<div class="kpis">${items
    .map(
      ([l, v]) =>
        `<div class="kpi"><div class="kpi-v">${v}</div><div class="kpi-l">${l}</div></div>`,
    )
    .join("")}</div>`;
}

function execSummary(m: ReportModel): string {
  const flagged = m.events.filter((e) => e.flagged).length;
  const approved = m.events.filter((e) => e.review_state === "approved").length;
  const rejected = m.events.filter((e) => e.review_state === "rejected").length;
  const donut = donutChart([
    { label: "Approved", value: approved, color: "#17a862" },
    { label: "Rejected", value: rejected, color: "#d0403f" },
    { label: "Pending", value: m.kpis.pendingReviews, color: "#c98213" },
  ]);
  return `
  <section class="section">
    <div class="sec-head"><span class="sec-no">01</span><h2>Executive summary</h2></div>
    ${kpiGrid(m)}
    <div class="two-col">
      <p class="lede">
        ${m.kpis.totalAgents} AI agents are registered with a named owner and risk tier.
        Of ${m.events.length} recorded actions, <b>${flagged}</b> tripped a policy threshold and
        were held for human approval — ${approved} approved, ${rejected} rejected, and
        <b>${m.kpis.pendingReviews}</b> still awaiting a decision.
        ${m.incidents.filter((i) => i.status !== "resolved").length} incident(s) remain open and are
        being tracked to resolution.
      </p>
      <div class="donut">
        ${donut}
        <div class="legend">
          <span><i style="background:#17a862"></i>Approved ${approved}</span>
          <span><i style="background:#d0403f"></i>Rejected ${rejected}</span>
          <span><i style="background:#c98213"></i>Pending ${m.kpis.pendingReviews}</span>
        </div>
      </div>
    </div>
  </section>`;
}

function departments(m: ReportModel): string {
  if (m.rollups.length <= 1 && m.scope.kind === "agent") return "";
  const bars = barChart(
    m.rollups.map((r) => ({
      label: r.department,
      value: r.total,
      color: DEPT_COLORS[r.department] ?? ACCENT,
    })),
    { unit: "" },
  );
  const flagBars = barChart(
    m.rollups.map((r) => ({ label: r.department, value: r.openFlags, color: "#c98213" })),
    { unit: "" },
  );
  return `
  <section class="section">
    <div class="sec-head"><span class="sec-no">02</span><h2>Department breakdown</h2></div>
    <div class="two-col">
      <div><div class="chart-title">Agents per department</div>${bars}</div>
      <div><div class="chart-title">Actions awaiting review</div>${flagBars}</div>
    </div>
    <div class="dept-cards">
      ${m.rollups
        .map(
          (r) => `<div class="dept-card">
            <div class="dept-name">${r.department}</div>
            <div class="dept-stats">
              <span><b>${r.total}</b> agents</span>
              <span><b>${r.live}</b> live</span>
              <span class="flag"><b>${r.openFlags}</b> flags</span>
              <span class="inc"><b>${r.openIncidents}</b> incidents</span>
            </div>
          </div>`,
        )
        .join("")}
    </div>
  </section>`;
}

function registry(m: ReportModel): string {
  const rows = m.agents
    .slice(0, 60)
    .map(
      (a) => `<tr>
        <td class="orb-cell">${orb(a, 20)}</td>
        <td><div class="agent-name">${escapeXml(a.name)}</div><div class="mono muted">${a.id}</div></td>
        <td>${escapeXml(a.owner)}</td>
        <td>${a.department}</td>
        <td><span class="pill pill-${a.risk_tier}">${a.risk_tier}</span></td>
        <td>${escapeXml(a.model)}<div class="mono muted">${escapeXml(a.vendor)}</div></td>
        <td><span class="dot dot-${a.orbState}"></span>${a.orbState === "alert" ? "Attention" : a.status === "active" ? "Live" : "Idle"}</td>
      </tr>`,
    )
    .join("");
  return `
  <section class="section">
    <div class="sec-head"><span class="sec-no">03</span><h2>Agent register</h2></div>
    <table class="grid">
      <thead><tr><th></th><th>Agent</th><th>Owner</th><th>Dept</th><th>Risk</th><th>Model</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

function reviewHistory(m: ReportModel): string {
  if (m.reviewHistory.length === 0) return "";
  const rows = m.reviewHistory
    .map(
      ({ event, review, agentName }) => `<tr>
        <td>${titleCaseAction(event.action)}<div class="mono muted">${escapeXml(agentName)}</div></td>
        <td class="wrap">${escapeXml(event.flag_reason ?? "")}</td>
        <td class="mono">${confidencePct(event.confidence)}</td>
        <td><span class="pill pill-${event.review_state}">${event.review_state}</span></td>
        <td>${review ? escapeXml(review.reviewer) : "—"}</td>
        <td class="mono muted">${review ? shortDateTime(review.timestamp) : "—"}</td>
      </tr>`,
    )
    .join("");
  return `
  <section class="section">
    <div class="sec-head"><span class="sec-no">04</span><h2>Review history</h2></div>
    <table class="grid">
      <thead><tr><th>Action</th><th>Why flagged</th><th>Conf.</th><th>Decision</th><th>Reviewer</th><th>When</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

function incidents(m: ReportModel): string {
  if (m.incidents.length === 0) return "";
  const rows = m.incidents
    .map(
      (i) => `<tr>
        <td class="wrap"><b>${escapeXml(i.title)}</b><div class="mono muted">opened by ${escapeXml(i.opened_by)} · ${dateOnly(i.opened_at)}</div></td>
        <td><span class="pill pill-${i.severity}">${i.severity}</span></td>
        <td><span class="dot dot-${i.status === "resolved" ? "idle" : "alert"}"></span>${i.status}</td>
        <td class="wrap muted">${i.resolution_note ? escapeXml(i.resolution_note) : "—"}</td>
      </tr>`,
    )
    .join("");
  return `
  <section class="section">
    <div class="sec-head"><span class="sec-no">05</span><h2>Incident register</h2></div>
    <table class="grid">
      <thead><tr><th>Incident</th><th>Severity</th><th>Status</th><th>Resolution</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

export function renderReportHtml(m: ReportModel): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
html { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
body { font-family:'Public Sans',sans-serif; color:#16202a; font-size:12px; line-height:1.5; }
.mono { font-family:'JetBrains Mono',monospace; }
.muted { color:#6b7b88; }

.cover { min-height:100vh; padding:64px; display:flex; flex-direction:column; justify-content:space-between;
  background:linear-gradient(158deg,#eaf4f1 0%, #e2ecef 55%, #dbe6ea 100%); page-break-after:always; }
.cover-top { display:flex; align-items:center; gap:18px; }
.wordmark .wm-name { font-family:'Fraunces',serif; font-size:30px; font-weight:600; letter-spacing:-0.02em; }
.wordmark .wm-ar { font-size:15px; color:#6b7b88; direction:rtl; }
.cover-mid .eyebrow { font-family:'JetBrains Mono',monospace; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:${ACCENT}; margin-bottom:20px; }
.cover-mid h1 { font-family:'Fraunces',serif; font-size:52px; font-weight:600; line-height:1.05; letter-spacing:-0.02em; max-width:680px; }
.cover-sub { font-size:16px; color:#556773; margin-top:16px; }
.cover-foot { display:flex; gap:48px; border-top:1px solid #d6dee4; padding-top:22px; }
.cover-foot .k { display:block; font-family:'JetBrains Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:#6b7b88; margin-bottom:4px; }
.cover-foot .v { font-size:13px; }

.section { padding:40px 48px; page-break-inside:auto; }
.sec-head { display:flex; align-items:baseline; gap:12px; border-bottom:2px solid #16202a; padding-bottom:10px; margin-bottom:22px; }
.sec-no { font-family:'JetBrains Mono',monospace; font-size:13px; color:${ACCENT}; }
.sec-head h2 { font-family:'Fraunces',serif; font-size:22px; font-weight:600; letter-spacing:-0.01em; }

.kpis { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; margin-bottom:26px; }
.kpi { border:1px solid #d6dee4; border-radius:10px; padding:14px; }
.kpi-v { font-family:'Fraunces',serif; font-size:28px; font-weight:600; }
.kpi-l { font-family:'JetBrains Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; color:#6b7b88; margin-top:6px; }

.two-col { display:grid; grid-template-columns:1fr auto; gap:36px; align-items:start; }
.lede { font-size:14px; line-height:1.7; max-width:560px; }
.donut { text-align:center; }
.legend { display:flex; flex-direction:column; gap:5px; margin-top:12px; font-size:11px; text-align:left; }
.legend i { display:inline-block; width:9px; height:9px; border-radius:2px; margin-right:7px; }
.chart-title { font-family:'JetBrains Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:#6b7b88; margin-bottom:12px; }

.dept-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:26px; }
.dept-card { border:1px solid #d6dee4; border-radius:10px; padding:16px; }
.dept-name { font-family:'Fraunces',serif; font-size:17px; font-weight:600; margin-bottom:10px; }
.dept-stats { display:flex; flex-direction:column; gap:4px; font-size:12px; color:#556773; }
.dept-stats b { color:#16202a; }
.dept-stats .flag b { color:#c98213; } .dept-stats .inc b { color:#d0403f; }

table.grid { width:100%; border-collapse:collapse; }
table.grid th { text-align:left; font-family:'JetBrains Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; color:#6b7b88; padding:8px 10px; border-bottom:1px solid #d6dee4; }
table.grid td { padding:9px 10px; border-bottom:1px solid #e6ebef; vertical-align:top; font-size:11.5px; }
table.grid tr { page-break-inside:avoid; }
.orb-cell { width:26px; }
.agent-name { font-weight:600; }
td.wrap { max-width:230px; }
.pill { display:inline-block; padding:1px 8px; border-radius:20px; font-size:10px; font-weight:600; border:1px solid; text-transform:capitalize; }
.pill-low,.pill-pending { color:#6b7b88; border-color:#c3ccd3; }
.pill-medium { color:${ACCENT}; border-color:#9fd6cf; }
.pill-high,.pill-flag { color:#c98213; border-color:#e6c68a; }
.pill-critical,.pill-rejected { color:#d0403f; border-color:#e6a3a2; }
.pill-approved { color:#17a862; border-color:#9ad9ba; }
.dot { display:inline-block; width:7px; height:7px; border-radius:50%; margin-right:6px; vertical-align:middle; }
.dot-active { background:#17a862; } .dot-idle { background:#7a8b98; } .dot-alert { background:#d0403f; }
</style></head>
<body>
  ${cover(m)}
  ${execSummary(m)}
  ${departments(m)}
  ${registry(m)}
  ${reviewHistory(m)}
  ${incidents(m)}
</body></html>`;
}

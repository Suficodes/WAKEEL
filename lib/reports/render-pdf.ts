import "server-only";
import puppeteer from "puppeteer";
import { renderReportHtml } from "@/lib/reports/report-html";
import type { ReportModel } from "@/lib/reports/report-data";

/**
 * Render the branded report HTML to PDF via headless Chromium. Waits for web
 * fonts to load so Fraunces/Public Sans/JetBrains Mono land in the document,
 * and paints a running footer with page numbers + confidentiality mark.
 */
export async function renderReportPdf(model: ReportModel): Promise<Uint8Array> {
  const html = renderReportHtml(model);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    // wait for the @import web fonts (Fraunces / Public Sans / JetBrains Mono)
    await page.evaluate(async () => {
      await (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready;
    });

    const footer = `
      <div style="width:100%; font-family:'JetBrains Mono',monospace; font-size:8px; color:#8595a1;
                  padding:0 48px; display:flex; justify-content:space-between;">
        <span>WAKEEL · Confidential — Board &amp; Risk Committee</span>
        <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>`;

    return await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: footer,
      margin: { top: "0", bottom: "48px", left: "0", right: "0" },
    });
  } finally {
    await browser.close();
  }
}

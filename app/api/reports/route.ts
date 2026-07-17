import { z } from "zod";
import { buildReportModel, type ReportScope } from "@/lib/reports/report-data";
import { renderReportPdf } from "@/lib/reports/render-pdf";
import { createLogger } from "@/lib/log";

const log = createLogger("api.reports");

// PDF rendering needs the Node runtime (Chromium), not the edge.
export const runtime = "nodejs";
export const maxDuration = 60;

const ReportRequest = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("organisation") }),
  z.object({ kind: z.literal("department"), department: z.enum(["HR", "Finance", "Procurement"]) }),
  z.object({ kind: z.literal("agent"), agentId: z.string().min(1) }),
]);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ReportRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid report scope", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const model = await buildReportModel(parsed.data as ReportScope);
    const pdf = await renderReportPdf(model);
    const slug = model.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    log.info("report generated", { scope: parsed.data.kind, bytes: pdf.byteLength });

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="wakeel-${slug}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    log.error("report failed", { error: String((err as Error).message) });
    return Response.json({ error: "Report generation failed" }, { status: 500 });
  }
}

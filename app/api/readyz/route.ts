import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/data/store";
import { createServiceClient } from "@/lib/supabase/server";

/** Readiness: dependencies (the database) are reachable. */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { status: "degraded", db: "not-configured" },
      { status: 200 },
    );
  }
  try {
    const db = createServiceClient();
    const { error } = await db.from("agents").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ status: "ok", db: "reachable" });
  } catch (err) {
    return NextResponse.json(
      { status: "unready", db: "unreachable", error: String((err as Error).message) },
      { status: 503 },
    );
  }
}

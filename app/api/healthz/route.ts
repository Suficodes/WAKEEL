import { NextResponse } from "next/server";

/** Liveness: the process is up. */
export async function GET() {
  return NextResponse.json({ status: "ok", ts: new Date().toISOString() });
}

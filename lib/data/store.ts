import "server-only";
import type { Agent, AgentEvent, Incident, Review } from "@/lib/types";
import { generateSeedData, type SeedData } from "@/lib/data/generate";

/*
 * Server-side data access. Uses Supabase when configured; otherwise falls back
 * to the in-memory seed generator so the UI is fully viewable before the DB is
 * wired. Pages call these helpers and never care which source is live.
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

// Cache the fixture for the lifetime of the server process so ids/timestamps
// stay stable across requests during local (no-DB) development.
let fixtureCache: SeedData | null = null;
function fixture(): SeedData {
  if (!fixtureCache) fixtureCache = generateSeedData();
  return fixtureCache;
}

async function sb() {
  const { createClient } = await import("@/lib/supabase/server");
  return createClient();
}

export async function getAgents(): Promise<Agent[]> {
  if (!isSupabaseConfigured()) return fixture().agents;
  const client = await sb();
  const { data } = await client.from("agents").select("*").order("name");
  return (data as Agent[]) ?? [];
}

export async function getEvents(limit = 500): Promise<AgentEvent[]> {
  if (!isSupabaseConfigured()) return fixture().events.slice(0, limit);
  const client = await sb();
  const { data } = await client
    .from("events")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);
  return (data as AgentEvent[]) ?? [];
}

export async function getIncidents(): Promise<Incident[]> {
  if (!isSupabaseConfigured()) return fixture().incidents;
  const client = await sb();
  const { data } = await client
    .from("incidents")
    .select("*")
    .order("opened_at", { ascending: false });
  return (data as Incident[]) ?? [];
}

export async function getReviews(): Promise<Review[]> {
  if (!isSupabaseConfigured()) return fixture().reviews;
  const client = await sb();
  const { data } = await client
    .from("reviews")
    .select("*")
    .order("timestamp", { ascending: false });
  return (data as Review[]) ?? [];
}

export async function getAllData(): Promise<SeedData> {
  const [agents, events, incidents, reviews] = await Promise.all([
    getAgents(),
    getEvents(),
    getIncidents(),
    getReviews(),
  ]);
  return { agents, events, incidents, reviews };
}

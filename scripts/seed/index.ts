/*
 * Seed the Supabase database with the generated demo dataset.
 * Run: npm run seed   (loads .env.local, requires the service-role key)
 *
 * Idempotent: clears the four tables + policy config, then re-inserts a
 * populated, lived-in dataset (~48 agents, a trickle of flagged actions,
 * a handful of incidents).
 */

import { createClient } from "@supabase/supabase-js";
import { generateSeedData } from "@/lib/data/generate";
import { DEFAULT_POLICY_RULES } from "@/lib/policy/rules";
import { createLogger } from "@/lib/log";

const log = createLogger("seed");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  log.error("Missing Supabase env — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function clearAll() {
  // delete in FK-safe order (children first)
  for (const table of ["reviews", "incidents", "events", "agents", "policy_rules"]) {
    const { error } = await db.from(table).delete().neq("id", "__none__");
    if (error) throw new Error(`clear ${table}: ${error.message}`);
  }
}

async function insertChunked<T>(table: string, rows: T[], size = 500) {
  for (let i = 0; i < rows.length; i += size) {
    const { error } = await db.from(table).insert(rows.slice(i, i + size) as never);
    if (error) throw new Error(`insert ${table}: ${error.message}`);
  }
  log.info(`inserted ${rows.length} rows`, { table });
}

async function main() {
  const data = generateSeedData();
  log.info("generated dataset", {
    agents: data.agents.length,
    events: data.events.length,
    reviews: data.reviews.length,
    incidents: data.incidents.length,
  });

  await clearAll();

  await insertChunked("agents", data.agents);
  await insertChunked(
    "events",
    data.events.map((e) => ({
      ...e,
      timestamp: e.timestamp, // column is "timestamp"
    })),
  );
  await insertChunked("reviews", data.reviews);
  await insertChunked("incidents", data.incidents);
  await insertChunked(
    "policy_rules",
    DEFAULT_POLICY_RULES.map((r) => ({
      id: r.id,
      description: r.description,
      field: r.field,
      operator: r.operator,
      value: String(r.value),
      and_conditions: r.and ?? [],
      action: r.action,
      enabled: r.enabled,
    })),
  );

  log.info("seed complete");
}

main().catch((err) => {
  log.error("seed failed", { error: String(err?.message ?? err) });
  process.exit(1);
});

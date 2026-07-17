/*
 * Apply every SQL migration in supabase/migrations in filename order.
 * Run: npm run migrate   (needs DATABASE_URL in .env.local)
 *
 * Migrations are written to be idempotent, so re-running is safe.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { createLogger } from "@/lib/log";

const log = createLogger("migrate");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  log.error("Missing DATABASE_URL in env (.env.local)");
  process.exit(1);
}

const dir = join(process.cwd(), "supabase", "migrations");

async function main() {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  log.info("connected", { migrations: files.length });

  try {
    for (const file of files) {
      const sql = readFileSync(join(dir, file), "utf8");
      await client.query(sql);
      log.info("applied", { file });
    }
    log.info("all migrations applied");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  log.error("migration failed", { error: String(err?.message ?? err) });
  process.exit(1);
});

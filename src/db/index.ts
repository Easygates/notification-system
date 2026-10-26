import fs from "node:fs";
import path from "node:path";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPglite?: PGlite;
  __arenaNextJsDb?: NodePgDatabase;
};

function createDb(): NodePgDatabase {
  if (databaseUrl && /^postgres(ql)?:\/\//i.test(databaseUrl)) {
    const pool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
      });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = pool;
    }

    return drizzle(pool);
  }

  if (!globalForDb.__arenaNextJsPglite) {
    const dataDir = databaseUrl || path.join(process.cwd(), ".local", "pglite");
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      globalForDb.__arenaNextJsPglite = new PGlite(dataDir);
    } catch {
      globalForDb.__arenaNextJsPglite = new PGlite();
    }
  }

  return drizzlePglite(globalForDb.__arenaNextJsPglite) as unknown as NodePgDatabase;
}

export const db: NodePgDatabase = globalForDb.__arenaNextJsDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsDb = db;
}

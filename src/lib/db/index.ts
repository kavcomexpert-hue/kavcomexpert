import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type AppDatabase = NeonHttpDatabase<typeof schema>;

let cached: AppDatabase | null = null;

/**
 * Lazily create the Neon/Drizzle client on first query.
 * Never call neon() at module evaluation — builds must not require DATABASE_URL.
 */
export function getDb(): AppDatabase {
  if (cached) return cached;

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(url);
  cached = drizzle(sql, { schema });
  return cached;
}

/**
 * Lazy proxy so existing `import { db }` call sites stay valid without
 * initializing Neon until a property/method is accessed (e.g. db.select()).
 * Prefer getDb() in new code.
 */
export const db: AppDatabase = new Proxy({} as AppDatabase, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance as object, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }
    return value;
  },
});

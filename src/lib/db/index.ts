import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "../env";

declare global {
  // Reuse one connection pool across hot reloads in development.
  var __pg: ReturnType<typeof postgres> | undefined;
}

const client =
  globalThis.__pg ??
  postgres(env.DATABASE_URL, {
    // Supabase's transaction pooler does not support prepared statements.
    prepare: false,
    max: 5,
  });
if (process.env.NODE_ENV !== "production") globalThis.__pg = client;

export const db = drizzle(client, { schema });
export { schema };

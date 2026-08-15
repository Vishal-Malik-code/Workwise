import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export { schema };

export const db = drizzle(pool, { schema });

export type Database = typeof db;
export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type DbClient = Database | Tx;

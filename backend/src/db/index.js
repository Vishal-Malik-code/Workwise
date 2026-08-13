import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as core from "./schema.js";
import * as projects from "./schema.projects.js";
import * as ai from "./schema.ai.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const schema = { ...core, ...projects, ...ai };

export const db = drizzle(pool, { schema });

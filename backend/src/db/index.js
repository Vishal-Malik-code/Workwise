import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as core from "./schema.js";
import * as projects from "./schema.projects.js";
import * as ai from "./schema.ai.js";

const sql = neon(process.env.DATABASE_URL);

export const schema = { ...core, ...projects, ...ai };

export const db = drizzle(sql, { schema });

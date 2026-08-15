import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    GROQ_API_KEY: z.string().optional(),
    PORT: z.coerce.number().int().positive().default(4000),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    FRONTEND_URL: z.string().default("http://localhost:3000"),
    AI_ENABLED: z
      .string()
      .default("true")
      .transform((v) => v === "true"),
  })
  .superRefine((val, ctx) => {
    if (val.AI_ENABLED && !val.GROQ_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GROQ_API_KEY"],
        message: "GROQ_API_KEY is required when AI_ENABLED=true",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment configuration:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();

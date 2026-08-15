import { z } from "zod";

export const askPulseSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const decideProposalSchema = z.object({
  approve: z.boolean(),
});

export const listProposalsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED", "EXECUTED", "FAILED"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

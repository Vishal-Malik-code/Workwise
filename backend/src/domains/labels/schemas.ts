import { z } from "zod";

export const createLabelSchema = z.object({
  name: z.string().min(1).max(60),
  color: z.string().min(1).max(20).optional(),
});

export const replaceTaskLabelsSchema = z.object({
  labelIds: z.array(z.string().uuid()).max(100),
});

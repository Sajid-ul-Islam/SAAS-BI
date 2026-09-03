import { z } from 'zod';

export const askAiQuerySchema = z.object({
  query: z.string().min(3).max(500),
  contextDays: z.coerce.number().int().min(1).max(90).default(30),
});

export type AskAiQueryInput = z.infer<typeof askAiQuerySchema>;

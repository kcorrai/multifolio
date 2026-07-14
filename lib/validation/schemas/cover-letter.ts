// Cover letter (ön yazı) çıktı + girdi şemaları. OpenAI structured-output → tek zorunlu alan.
import { z } from "zod";

export const coverLetterSchema = z.object({
  content: z.string(),
});
export type CoverLetter = z.infer<typeof coverLetterSchema>;

// POST /api/coverletter girdisi.
export const coverLetterCreateSchema = z.object({
  job_id: z.string().uuid(),
  job_description: z.string().trim().min(1).max(20_000),
});

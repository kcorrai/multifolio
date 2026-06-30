import { z } from "zod";
import { platformIdSchema } from "@/lib/ai/platforms";

export const proposalCreateSchema = z.object({
  job_id: z.string().uuid(),
  platform: platformIdSchema,
  job_description: z.string().min(10).max(10000),
});

export type ProposalCreate = z.infer<typeof proposalCreateSchema>;

export interface ProposalRow {
  id: string;
  job_id: string;
  platform: string;
  content: string;
  created_at: string;
}

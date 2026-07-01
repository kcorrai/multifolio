import { z } from "zod";
import { platformIdSchema } from "@/lib/ai/platforms";

export const proposalCreateSchema = z.object({
  job_id: z.string().uuid(),
  platform: platformIdSchema,
  job_description: z.string().min(10).max(10000),
  focus_requirements: z.array(z.string()).max(7).optional(),
});

export type ProposalCreate = z.infer<typeof proposalCreateSchema>;

export const coverageStatusSchema = z.enum(["met", "partial", "missing"]);

export const proposalCoverageItemSchema = z.object({
  requirement: z.string(),
  status: coverageStatusSchema,
  note: z.string().max(200),
});

export const proposalWithCoverageSchema = z.object({
  content: z.string(),
  coverage: z.array(proposalCoverageItemSchema).max(7),
});

export type ProposalCoverageItem = z.infer<typeof proposalCoverageItemSchema>;

export interface ProposalRow {
  id: string;
  job_id: string;
  platform: string;
  content: string;
  coverage?: ProposalCoverageItem[] | null;
  created_at: string;
}

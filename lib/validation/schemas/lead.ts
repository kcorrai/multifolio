import { z } from "zod";

// Public portfolyo lead gönderimi (anonim ziyaretçi → owner'ın gelen kutusuna düşer).
export const leadSubmitSchema = z.object({
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  budget: z.string().trim().max(60).optional(),
  projectType: z.string().trim().max(120).optional(),
  timeline: z.string().trim().max(60).optional(),
  message: z.string().trim().min(10).max(2000),
  // Honeypot: botlar doldurur, gerçek kullanıcı görmez (dolu → reddedilir).
  website: z.string().max(0).optional(),
});
export type LeadSubmit = z.infer<typeof leadSubmitSchema>;

// Owner lead durumu güncellemesi.
export const leadStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "converted", "archived"]),
});
export type LeadStatus = z.infer<typeof leadStatusSchema>["status"];

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  budget: string | null;
  project_type: string | null;
  timeline: string | null;
  message: string;
  status: LeadStatus;
  created_at: string;
}

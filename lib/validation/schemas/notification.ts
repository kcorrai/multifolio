import { z } from "zod";

// PATCH /api/notifications gövdesi: id verilirse o bildirim, verilmezse TÜM
// okunmamışlar okundu işaretlenir.
export const notificationReadSchema = z.object({
  id: z.string().uuid().optional(),
});
export type NotificationRead = z.infer<typeof notificationReadSchema>;

// İstemciye dönen bildirim satırı.
export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

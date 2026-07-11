-- Batch 3 (retention/CRM): kart bazlı hatırlatıcı + teslim tarihi.
-- reminder_date = kullanıcının "bu tarihte hatırlat" işareti (takip/aksiyon için);
-- deadline_date = ilanın/başvurunun son tarihi. İkisi de opsiyonel, saf tarih
-- (saat yok → <input type="date"> ile birebir, timezone kayması olmaz).
-- follow-up sayacından (status_changed_at) BAĞIMSIZ — kullanıcı elle koyar.

alter table public.job_listings
  add column if not exists reminder_date date,
  add column if not exists deadline_date date;

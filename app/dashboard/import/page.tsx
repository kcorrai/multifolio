import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ImportWizard } from "@/components/dashboard/import-wizard";
import { profileDraftSchema, profileImportMediaSchema } from "@/lib/validation/schemas/profile-import";
import { PLATFORMS, platformIdSchema } from "@/lib/ai/platforms";

// Eklenti taslağının tazelik penceresi — daha eski satır yok sayılır (bayat veri
// sürpriz prefill yapmasın; sonraki eklenti içe aktarması satırı zaten ezer).
const DRAFT_MAX_AGE_MS = 60 * 60 * 1000;

// Bileşen gövdesi saf kalsın (react-hooks/purity) — saat okuması burada.
function isFreshDraft(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() <= DRAFT_MAX_AGE_MS;
}

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ?source=extension → tarayıcı eklentisinin bıraktığı bekleyen taslağı yükle.
  // jsonb kolonları dış girdi sayılır: safeParse başarısızsa normal wizard'a düş.
  let initialDraft = null;
  let initialExtras = null;
  let initialPlatformLabel: string | null = null;
  const { source } = await searchParams;
  if (source === "extension") {
    const { data: row } = await supabase
      .from("profile_import_drafts")
      .select("platform, draft, media, created_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (row && isFreshDraft(row.created_at)) {
      const draft = profileDraftSchema.safeParse(row.draft);
      const media = profileImportMediaSchema.safeParse(row.media);
      const platform = platformIdSchema.safeParse(row.platform);
      if (draft.success) {
        initialDraft = draft.data;
        initialExtras = media.success ? media.data : null;
        initialPlatformLabel = platform.success ? PLATFORMS[platform.data].label : null;
      }
    }
  }

  return (
    <div className="py-6">
      <ImportWizard
        initialDraft={initialDraft}
        initialExtras={initialExtras}
        initialPlatformLabel={initialPlatformLabel}
      />
    </div>
  );
}

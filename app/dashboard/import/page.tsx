import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ImportWizard } from "@/components/dashboard/import-wizard";

export default async function ImportPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="py-6">
      <ImportWizard />
    </div>
  );
}

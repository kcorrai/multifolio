// Güvenli-by-default girdi doğrulama. SERT KURAL: istemci verisine güvenilmez;
// her dış girdi (gövde, query, params) bir Zod şemasından geçirilir. Doğrulama
// başarısızsa ValidationError fırlatılır ve withErrorHandler 400'e çevirir.
import { z } from "zod";
import { ValidationError } from "@/lib/errors";

const uuidSchema = z.string().uuid();

/**
 * Route path parametresini UUID olarak doğrular. Doğrulanmamış bir id doğrudan
 * `.eq("id", ...)` içine girerse Postgres `22P02` (invalid uuid) fırlatır →
 * beklenmeyen 500 + Sentry gürültüsü. Bu, onu temiz bir 400'e çevirir.
 */
export function parseUuidParam(value: string, field = "id"): string {
  const result = uuidSchema.safeParse(value);
  if (!result.success) throw new ValidationError(`${field}: geçersiz kimlik.`);
  return result.data;
}

/** İlk Zod sorununu kısa, okunur bir mesaja indirger. */
function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Geçersiz girdi.";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

/** Request gövdesini JSON olarak okur ve şemaya göre doğrular. */
export async function parseJson<T extends z.ZodType>(
  req: Request,
  schema: T,
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ValidationError("Gövde geçerli bir JSON değil.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError(firstIssueMessage(result.error), {
      context: { issues: result.error.issues },
    });
  }
  return result.data;
}

/** URLSearchParams / query nesnesini şemaya göre doğrular. */
export function parseQuery<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T,
): z.infer<T> {
  const obj = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(obj);
  if (!result.success) {
    throw new ValidationError(firstIssueMessage(result.error), {
      context: { issues: result.error.issues },
    });
  }
  return result.data;
}

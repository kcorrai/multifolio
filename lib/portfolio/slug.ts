// Portfolyo slug türetimi (SAF): profil başlığından okunabilir, paylaşılabilir URL
// parçası üretir (/p/senior-react-developer). Rasgele hex yerine (P1 #7). TR harfleri
// ASCII'ye çevrilir; benzersizlik kontrolü çağıran route'ta (DB lookup) yapılır.

const TR_MAP: Record<string, string> = {
  ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g",
  ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c",
};

/** Metni URL-güvenli slug'a çevirir (küçük harf, ASCII, tireli, ≤40 karakter). Boşsa "". */
export function slugify(text: string): string {
  return (text ?? "")
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (c) => TR_MAP[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // kalan diakritikleri sök
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

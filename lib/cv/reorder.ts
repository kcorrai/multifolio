// Saf dizi yeniden sıralama (CV editöründe deneyim/eğitim/proje/madde sıralaması).
// Dizi sırası = render sırası (önizleme + PDF map ile çizer), bu yüzden yeniden
// sıralama şema/PDF değişikliği gerektirmez. Sınır dışı indeks güvenle yok sayılır.
export function arrayMove<T>(arr: readonly T[], from: number, to: number): T[] {
  const next = [...arr];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length || from === to) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

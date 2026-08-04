/*
 * `templates.category` stores the seeder's English slug — "wedding",
 * "engagement". Those were being printed straight onto the filter chips and
 * onto every template card, so a Turkish app showed English category names in
 * lower case next to Turkish template titles.
 *
 * Unknown slugs are title-cased rather than dropped: a category added to the
 * catalogue later still reads as a word instead of disappearing from the
 * filter, and the fix is to add one line here.
 */
const CATEGORY_LABELS: Record<string, string> = {
  anniversary: 'Yıldönümü',
  baby: 'Bebek',
  birthday: 'Doğum günü',
  circumcision: 'Sünnet',
  corporate: 'Kurumsal',
  engagement: 'Nişan',
  graduation: 'Mezuniyet',
  henna: 'Kına',
  other: 'Diğer',
  party: 'Parti',
  wedding: 'Düğün',
};

export function templateCategoryLabel(category: string) {
  const known = CATEGORY_LABELS[category.trim().toLowerCase()];
  if (known) return known;
  const cleaned = category.replace(/[_-]+/g, ' ').trim();
  if (!cleaned) return 'Diğer';
  return cleaned.charAt(0).toLocaleUpperCase('tr-TR') + cleaned.slice(1);
}

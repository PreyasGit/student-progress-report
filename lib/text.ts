const DIACRITICS = /\p{Diacritic}/gu;

/** Case- and accent-insensitive, trimmed form, so "jose" matches "José". */
export function normalize(value: string): string {
  return value.normalize("NFD").replace(DIACRITICS, "").toLowerCase().trim();
}

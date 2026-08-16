import formOptions from "@/data/formOptions.json";
import { normalize } from "@/lib/text";

/**
 * Every predefined list a form on this site offers (standard, section, month,
 * plus the year window) is read from this one JSON file. Add a class level or
 * rename a section here and every dropdown, the search index, and the legacy
 * data migration in useStudents pick it up automatically.
 */
export const STANDARDS: readonly string[] = formOptions.standards;
export const SECTIONS: readonly string[] = formOptions.sections;
export const MONTHS: readonly string[] = formOptions.months;
export const SUBJECTS: readonly string[] = formOptions.subjects;
export const TUTORS: readonly string[] = formOptions.tutors;

export const DEFAULT_STANDARD = STANDARDS[0];
export const DEFAULT_SECTION = SECTIONS[0];
export const DEFAULT_SUBJECT = SUBJECTS[0];
export const DEFAULT_TUTOR = TUTORS[0];

/**
 * Years can't be baked into the JSON without going stale, so only the window
 * size is configured there; the concrete list is generated relative to now.
 * Newest first, since that's what a user adding this month's report wants on top.
 */
export function getYearOptions(referenceYear: number): string[] {
  const { pastYears, futureYears } = formOptions.yearRange;
  const years: string[] = [];
  for (let offset = futureYears; offset >= -pastYears; offset--) {
    years.push(String(referenceYear + offset));
  }
  return years;
}

/** Finds the option matching a value case/accent-insensitively, if any. */
export function findOption(
  options: readonly string[],
  value: string | undefined
): string | undefined {
  if (!value) return undefined;
  const normalized = normalize(value);
  return options.find((option) => normalize(option) === normalized);
}

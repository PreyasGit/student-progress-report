"use client";

import { useDeferredValue, useMemo } from "react";
import type { Student } from "@/hooks/useStudents";
import { normalize } from "@/lib/text";

/**
 * Cap on how many rows we hand to React at once. Filtering stays O(N) over the
 * whole list, but painting thousands of list items is what actually stalls the
 * browser, so we render a page worth and tell the user to narrow the query.
 */
export const RESULT_LIMIT = 100;

/**
 * Search text is derived per student and memoized on the object identity.
 * `students` gets a new array identity on every edit (toggling one attendance
 * day, for example), but the individual student objects are only replaced when
 * that student actually changes — so this keeps index rebuilds proportional to
 * what changed instead of to the size of the list. A WeakMap lets entries for
 * deleted students be collected without any bookkeeping.
 */
const haystackCache = new WeakMap<Student, string>();

function haystackFor(student: Student): string {
  const cached = haystackCache.get(student);
  if (cached !== undefined) return cached;

  const built = normalize(
    `${student.name} ${student.standard} ${student.section} ${student.subject} ${student.tutor} ${student.month} ${student.year}`
  );
  haystackCache.set(student, built);
  return built;
}

export interface StudentSearchState {
  /** The slice to render — at most RESULT_LIMIT entries. */
  results: Student[];
  /** How many students matched in total, before the render cap. */
  matchCount: number;
  /** Size of the unfiltered list. */
  total: number;
  /** True when matchCount exceeded RESULT_LIMIT. */
  isTruncated: boolean;
  /** True while the list is still catching up to the typed query. */
  isPending: boolean;
  /** True when the query is non-empty. */
  isSearching: boolean;
}

export function useStudentSearch(
  students: Student[],
  query: string
): StudentSearchState {
  // Keeps keystrokes responsive: the input updates at normal priority while
  // the (potentially large) result list re-renders at a lower one. Better than
  // a fixed debounce delay, which is either too slow on small lists or too
  // fast on big ones.
  const deferredQuery = useDeferredValue(query);

  // All tokens must match, in any order and any field: "priya 5th" and
  // "5th priya" both find the same student.
  const tokens = useMemo(
    () => normalize(deferredQuery).split(/\s+/).filter(Boolean),
    [deferredQuery]
  );

  return useMemo(() => {
    const matched =
      tokens.length === 0
        ? students
        : students.filter((student) => {
            const haystack = haystackFor(student);
            return tokens.every((token) => haystack.includes(token));
          });

    return {
      results:
        matched.length > RESULT_LIMIT ? matched.slice(0, RESULT_LIMIT) : matched,
      matchCount: matched.length,
      total: students.length,
      isTruncated: matched.length > RESULT_LIMIT,
      isPending: query !== deferredQuery,
      isSearching: tokens.length > 0,
    };
  }, [students, tokens, query, deferredQuery]);
}

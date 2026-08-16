"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SECTION,
  DEFAULT_STANDARD,
  DEFAULT_SUBJECT,
  DEFAULT_TUTOR,
  STANDARDS,
  findOption,
} from "@/lib/formOptions";

export interface PerformanceMetric {
  completed: number;
  total: number;
}

export interface Student {
  id: string;
  name: string;
  standard: string;
  section: string;
  subject: string;
  tutor: string;
  month: string;
  year: string;
  topics: string[];
  attendedDays: number[];
  metrics: {
    assignments: PerformanceMetric;
    quizzes: PerformanceMetric;
    worksheets: PerformanceMetric;
  };
}

/** Shape of a record as it may exist in a user's localStorage, across every schema version this app has had. */
interface StoredStudentRecord {
  id: string;
  name: string;
  /** @deprecated pre-standard/section schema; only present on records saved before this field split. */
  grade?: string;
  standard?: string;
  section?: string;
  /** @deprecated pre-subject/tutor schema; these were hardcoded app-wide before becoming per-student fields. */
  subject?: string;
  tutor?: string;
  month: string;
  year: string;
  topics?: string[];
  attendedDays?: number[];
  metrics?: Student["metrics"];
}

const STORAGE_KEY = "spr-students-v1";

const EMPTY_METRICS: Student["metrics"] = {
  assignments: { completed: 0, total: 0 },
  quizzes: { completed: 0, total: 0 },
  worksheets: { completed: 0, total: 0 },
};

/**
 * Brings a stored record up to the current Student shape. standard/section/
 * subject/tutor are trusted as plain text once present — they're no longer
 * validated against STANDARDS/SECTIONS/SUBJECTS/TUTORS here, because those
 * are just the predefined suggestions a Combobox offers, not an enum a
 * stored value must belong to: a user-added custom value (e.g. a subject
 * not on the base list) is exactly as valid as a predefined one, and
 * re-validating against the base list on every load would silently reset
 * it to a default the moment the page reloads. A field only falls back to
 * its DEFAULT_* when genuinely absent (a record saved before that field
 * existed). The one exception is the deprecated free-text `grade` field:
 * it's normalized against STANDARDS to fix known casing/format drift, but
 * falls through to the raw text rather than a default if unmatched, so
 * legacy data is never silently replaced with something unrelated.
 */
function migrateStudent(raw: StoredStudentRecord): Student {
  const standard =
    raw.standard ?? findOption(STANDARDS, raw.grade) ?? raw.grade ?? DEFAULT_STANDARD;
  const section = raw.section ?? DEFAULT_SECTION;
  const subject = raw.subject ?? DEFAULT_SUBJECT;
  const tutor = raw.tutor ?? DEFAULT_TUTOR;

  return {
    id: raw.id,
    name: raw.name,
    standard,
    section,
    subject,
    tutor,
    month: raw.month,
    year: raw.year,
    topics: raw.topics ?? [],
    attendedDays: raw.attendedDays ?? [],
    metrics: raw.metrics ?? EMPTY_METRICS,
  };
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      
      // Defer state updates to avoid synchronous cascading renders
      setTimeout(() => {
        if (raw) {
          const parsed: StoredStudentRecord[] = JSON.parse(raw);
          const migrated = parsed.map(migrateStudent);
          setStudents(migrated);
          if (migrated.length > 0) {
            setActiveId(migrated[0].id);
          }
        }
        setIsLoaded(true);
      }, 0);
      
    } catch (error) {
      console.error("Failed to load students from localStorage:", error);
      setTimeout(() => setIsLoaded(true), 0);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch (error) {
      console.error("Failed to save students to localStorage:", error);
    }
  }, [students, isLoaded]);

  const addStudent = (
    name: string,
    standard: string,
    section: string,
    subject: string,
    tutor: string,
    month: string,
    year: string
  ) => {
    const newStudent: Student = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `student-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      standard,
      section,
      subject,
      tutor,
      month,
      year,
      topics: [],
      attendedDays: [],
      metrics: {
        assignments: { completed: 0, total: 0 },
        quizzes: { completed: 0, total: 0 },
        worksheets: { completed: 0, total: 0 },
      },
    };
    setStudents((prev) => [...prev, newStudent]);
    setActiveId(newStudent.id);
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeId === id) {
        setActiveId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const activeStudent = students.find((s) => s.id === activeId) ?? null;

  return {
    students,
    activeId,
    setActiveId,
    activeStudent,
    addStudent,
    deleteStudent,
    updateStudent,
    isLoaded,
  };
}
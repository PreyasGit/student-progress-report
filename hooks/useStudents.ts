"use client";

import { useEffect, useState } from "react";

export interface PerformanceMetric {
  completed: number;
  total: number;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
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

const STORAGE_KEY = "spr-students-v1";

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
          const parsed: Student[] = JSON.parse(raw);
          setStudents(parsed);
          if (parsed.length > 0) {
            setActiveId(parsed[0].id);
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

  const addStudent = (name: string, grade: string, month: string, year: string) => {
    const newStudent: Student = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `student-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      grade,
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
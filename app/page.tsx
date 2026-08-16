"use client";

import StudentSidebar from "@/components/StudentSidebar";
import ReportCard from "@/components/ReportCard";
import { useStudents } from "@/hooks/useStudents";

// Re-export the interfaces so your other components don't break
export type { Student, PerformanceMetric } from "@/hooks/useStudents";

export default function Home() {
  const {
    students,
    activeId,
    setActiveId,
    activeStudent,
    addStudent,
    deleteStudent,
    updateStudent,
  } = useStudents();

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#FDFBF7]">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-6 md:px-8">
        <header className="mb-6 shrink-0">
          <p className="font-[family-name:var(--font-plex-mono)] text-xs uppercase tracking-[0.3em] text-[#1A3A34]/50">
            Academic Planner
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-merriweather)] text-3xl font-bold text-[#1A3A34] sm:text-4xl">
            Student Monthly Progress Report
          </h1>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
          <div className="themed-scrollbar min-h-0 overflow-y-auto pr-1 lg:h-full">
            <StudentSidebar
              students={students}
              activeId={activeId}
              onSelect={setActiveId}
              onAdd={addStudent}
              onDelete={deleteStudent}
            />
          </div>
          <div className="themed-scrollbar min-h-0 overflow-y-auto pr-1 lg:h-full">
            <ReportCard student={activeStudent} onUpdate={updateStudent} />
          </div>
        </div>
      </div>
    </main>
  );
}
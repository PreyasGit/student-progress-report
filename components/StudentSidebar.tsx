"use client";

import { useState } from "react";
import type { Student } from "@/app/page";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface StudentSidebarProps {
  students: Student[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string, grade: string, month: string, year: string) => void;
  onDelete: (id: string) => void;
}

export default function StudentSidebar({
  students,
  activeId,
  onSelect,
  onAdd,
  onDelete,
}: StudentSidebarProps) {
  const currentDate = new Date();
  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [grade, setGrade] = useState("");
  const [month, setMonth] = useState(MONTHS[currentDate.getMonth()]);
  const [year, setYear] = useState(String(currentDate.getFullYear()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedGrade = grade.trim();
    if (!trimmedName || !trimmedGrade || !year.trim()) return;

    onAdd(trimmedName, trimmedGrade, month, year.trim());
    setName("");
    setGrade("");
  };

  const handleDelete = (e: React.MouseEvent, id: string, studentName: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Delete the report for ${studentName}? This cannot be undone.`
    );
    if (confirmed) onDelete(id);
  };

  return (
    <aside className="flex h-fit flex-col gap-6 rounded-3xl border border-[#1A3A34]/10 bg-white/50 p-6 shadow-sm">
      <div>
        <h2 className="mb-4 font-[family-name:var(--font-bricolage)] text-lg font-semibold text-[#1A3A34]">
          Add Student
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-wider text-[#1A3A34]/50">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full rounded-lg border border-[#1A3A34]/15 bg-white px-3 py-2 font-[family-name:var(--font-work-sans)] text-sm text-[#1A3A34] outline-none focus:border-[#1A3A34]/40"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-wider text-[#1A3A34]/50">
              Grade
            </label>
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g. 5th"
              className="w-full rounded-lg border border-[#1A3A34]/15 bg-white px-3 py-2 font-[family-name:var(--font-work-sans)] text-sm text-[#1A3A34] outline-none focus:border-[#1A3A34]/40"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-wider text-[#1A3A34]/50">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded-lg border border-[#1A3A34]/15 bg-white px-2 py-2 font-[family-name:var(--font-work-sans)] text-sm text-[#1A3A34] outline-none focus:border-[#1A3A34]/40"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-wider text-[#1A3A34]/50">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-lg border border-[#1A3A34]/15 bg-white px-3 py-2 font-[family-name:var(--font-work-sans)] text-sm text-[#1A3A34] outline-none focus:border-[#1A3A34]/40"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-1 rounded-lg bg-[#1A3A34] px-4 py-2.5 font-[family-name:var(--font-work-sans)] text-sm font-medium text-[#FDFBF7] transition hover:bg-[#122925]"
          >
            + Add Student
          </button>
        </form>
      </div>

      <div className="border-t border-dashed border-[#1A3A34]/15 pt-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="mb-3 font-[family-name:var(--font-bricolage)] text-lg font-semibold text-[#1A3A34]">
            Students
          </h2>
          <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-1/2 rounded-lg border border-[#1A3A34]/15 bg-white px-2 py-1.5 font-[family-name:var(--font-work-sans)] text-sm outline-none focus:border-[#1A3A34]/40"
            />
          </div>
          
        {students.length === 0 ? (
          <p className="font-[family-name:var(--font-work-sans)] text-sm italic text-[#1A3A34]/40">
            No students yet. Add one above to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {students.map((student) => {
              const isActive = student.id === activeId;
              return (
                <li key={student.id}>
                  <button
                    onClick={() => onSelect(student.id)}
                    className={`group flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                      isActive
                        ? "border-[#1A3A34] bg-[#1A3A34] text-[#FDFBF7]"
                        : "border-[#1A3A34]/10 bg-white text-[#1A3A34] hover:border-[#1A3A34]/30"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-[family-name:var(--font-work-sans)] text-sm font-medium">
                        {student.name}
                      </span>
                      <span
                        className={`block font-[family-name:var(--font-plex-mono)] text-[11px] ${
                          isActive ? "text-[#FDFBF7]/70" : "text-[#1A3A34]/50"
                        }`}
                      >
                        Grade {student.grade} · {student.month} {student.year}
                      </span>
                    </span>
                    <span
                      role="button"
                      tabIndex={-1}
                      onClick={(e) => handleDelete(e, student.id, student.name)}
                      className={`ml-2 shrink-0 rounded-md px-2 py-1 text-xs opacity-0 transition group-hover:opacity-100 ${
                        isActive
                          ? "text-[#FDFBF7]/70 hover:bg-[#FDFBF7]/10 hover:text-[#FDFBF7]"
                          : "text-[#1A3A34]/40 hover:bg-rose-50 hover:text-rose-600"
                      }`}
                      aria-label={`Delete ${student.name}`}
                    >
                      ✕
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
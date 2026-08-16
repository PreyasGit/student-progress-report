"use client";

import { useMemo, useState } from "react";
import type { Student } from "@/app/page";
import { useStudentSearch, RESULT_LIMIT } from "@/hooks/useStudentSearch";
import { useCustomOptions, type OptionCategory } from "@/hooks/useCustomOptions";
import Combobox from "@/components/Combobox";
import { useConfirm } from "@/components/ConfirmProvider";
import { usePrompt } from "@/components/PromptProvider";
import {
  DEFAULT_SECTION,
  DEFAULT_STANDARD,
  DEFAULT_SUBJECT,
  DEFAULT_TUTOR,
  MONTHS,
  SECTIONS,
  STANDARDS,
  SUBJECTS,
  TUTORS,
  findOption,
  getYearOptions,
} from "@/lib/formOptions";

interface StudentSidebarProps {
  students: Student[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: (
    name: string,
    standard: string,
    section: string,
    subject: string,
    tutor: string,
    month: string,
    year: string
  ) => void;
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
  const [standard, setStandard] = useState(DEFAULT_STANDARD);
  const [section, setSection] = useState(DEFAULT_SECTION);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [tutor, setTutor] = useState(DEFAULT_TUTOR);
  const [month, setMonth] = useState(MONTHS[currentDate.getMonth()]);
  const [year, setYear] = useState(String(currentDate.getFullYear()));
  // Generated once per mount from the JSON-configured window — stable so the
  // list doesn't reshuffle under an open dropdown as time passes mid-session.
  const [yearOptions] = useState(() => getYearOptions(currentDate.getFullYear()));

  const { results, matchCount, total, isTruncated, isPending, isSearching } =
    useStudentSearch(students, searchQuery);
  const confirm = useConfirm();
  const prompt = usePrompt();
  const { customOptions, addCustomOption } = useCustomOptions();

  // Standard/section/subject/tutor are where a tutoring setup actually varies
  // by user — month and year are fixed/generated, so they don't get an "add
  // new" affordance. Merged lists are only rebuilt when their own custom
  // slice changes, not on every keystroke elsewhere in the form.
  const standardOptions = useMemo(
    () => [...STANDARDS, ...customOptions.standard],
    [customOptions.standard]
  );
  const sectionOptions = useMemo(
    () => [...SECTIONS, ...customOptions.section],
    [customOptions.section]
  );
  const subjectOptions = useMemo(
    () => [...SUBJECTS, ...customOptions.subject],
    [customOptions.subject]
  );
  const tutorOptions = useMemo(
    () => [...TUTORS, ...customOptions.tutor],
    [customOptions.tutor]
  );

  const handleAddCustomOption = async (
    category: OptionCategory,
    allOptions: readonly string[],
    label: string,
    setValue: (value: string) => void
  ) => {
    const result = await prompt({
      title: `Add a new ${label.toLowerCase()}`,
      description:
        "Saved on this device only — it won't sync to any other browser.",
      inputLabel: `${label} name`,
      placeholder: `e.g. ${allOptions[0] ?? ""}`,
      confirmLabel: "Add",
      validate: (value) =>
        findOption(allOptions, value)
          ? `"${value}" is already on the list.`
          : undefined,
    });
    if (result === null) return;

    // Re-check against the live list in case of a race with another add —
    // reuse the existing entry rather than creating a near-duplicate.
    const existing = findOption(allOptions, result);
    const finalValue = existing ?? result;
    if (!existing) addCustomOption(category, finalValue);
    setValue(finalValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (
      !trimmedName ||
      !standard ||
      !section ||
      !subject ||
      !tutor ||
      !month ||
      !year
    )
      return;

    onAdd(trimmedName, standard, section, subject, tutor, month, year);
    setName("");
    setStandard(DEFAULT_STANDARD);
    setSection(DEFAULT_SECTION);
    setSubject(DEFAULT_SUBJECT);
    setTutor(DEFAULT_TUTOR);
  };

  const handleDelete = async (
    e: React.MouseEvent,
    id: string,
    studentName: string
  ) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: "Delete this report?",
      description: `This removes ${studentName}'s monthly progress report. This cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      tone: "danger",
    });
    if (confirmed) onDelete(id);
  };

  return (
    <aside className="flex h-fit flex-col gap-6 rounded-3xl border border-[#1A3A34]/10 bg-white/50 p-6 shadow-sm">
      <div>
        <h2 className="mb-4 font-[family-name:var(--font-merriweather)] text-lg font-semibold text-[#1A3A34]">
          Add Student
        </h2>
        <form
          onSubmit={handleSubmit}
          data-combobox-bounds=""
          className="flex flex-col gap-3"
        >
          <div>
            <label className="mb-1 block font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-wider text-[#1A3A34]/50">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full rounded-lg border border-[#1A3A34]/15 bg-white px-3 py-2 font-[family-name:var(--font-lora)] text-sm text-[#1A3A34] outline-none focus:border-[#1A3A34]/40"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Combobox
              label="Standard"
              value={standard}
              onChange={setStandard}
              options={standardOptions}
              customValues={customOptions.standard}
              onAddNew={() =>
                handleAddCustomOption(
                  "standard",
                  standardOptions,
                  "Standard",
                  setStandard
                )
              }
              placeholder="Select standard"
              searchPlaceholder="Search standards..."
              required
            />
            <Combobox
              label="Section"
              value={section}
              onChange={setSection}
              options={sectionOptions}
              customValues={customOptions.section}
              onAddNew={() =>
                handleAddCustomOption(
                  "section",
                  sectionOptions,
                  "Section",
                  setSection
                )
              }
              placeholder="Select section"
              searchPlaceholder="Search sections..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Combobox
              label="Subject"
              value={subject}
              onChange={setSubject}
              options={subjectOptions}
              customValues={customOptions.subject}
              onAddNew={() =>
                handleAddCustomOption(
                  "subject",
                  subjectOptions,
                  "Subject",
                  setSubject
                )
              }
              placeholder="Select subject"
              searchPlaceholder="Search subjects..."
              required
            />
            <Combobox
              label="Tutor"
              value={tutor}
              onChange={setTutor}
              options={tutorOptions}
              customValues={customOptions.tutor}
              onAddNew={() =>
                handleAddCustomOption("tutor", tutorOptions, "Tutor", setTutor)
              }
              placeholder="Select tutor"
              searchPlaceholder="Search tutors..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Combobox
              label="Month"
              value={month}
              onChange={setMonth}
              options={MONTHS}
              placeholder="Select month"
              searchPlaceholder="Search months..."
              required
            />
            <Combobox
              label="Year"
              value={year}
              onChange={setYear}
              options={yearOptions}
              placeholder="Select year"
              searchPlaceholder="Search years..."
              required
            />
          </div>

          <button
            type="submit"
            className="mt-1 rounded-lg bg-[#1A3A34] px-4 py-2.5 font-[family-name:var(--font-lora)] text-sm font-medium text-[#FDFBF7] transition hover:bg-[#122925]"
          >
            + Add Student
          </button>
        </form>
      </div>

      <div className="border-t border-dashed border-[#1A3A34]/15 pt-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-[family-name:var(--font-merriweather)] text-lg font-semibold text-[#1A3A34]">
            Students
          </h2>
          <span className="font-[family-name:var(--font-plex-mono)] text-[11px] text-[#1A3A34]/40">
            {isSearching ? `${matchCount} / ${total}` : total}
          </span>
        </div>

        <div className="relative mb-3">
          <input
            type="search"
            placeholder="Search by name, standard, section, subject, tutor, month or year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchQuery("");
            }}
            disabled={total === 0}
            aria-label="Search students"
            className="w-full rounded-lg border border-[#1A3A34]/15 bg-white px-3 py-2 pr-8 font-[family-name:var(--font-lora)] text-sm text-[#1A3A34] outline-none transition focus:border-[#1A3A34]/40 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-xs text-[#1A3A34]/40 transition hover:bg-[#1A3A34]/10 hover:text-[#1A3A34]"
            >
              ✕
            </button>
          )}
        </div>

        {total === 0 ? (
          <p className="font-[family-name:var(--font-lora)] text-sm italic text-[#1A3A34]/40">
            No students yet. Add one above to get started.
          </p>
        ) : matchCount === 0 ? (
          <p className="font-[family-name:var(--font-lora)] text-sm italic text-[#1A3A34]/40">
            No students match &ldquo;{searchQuery.trim()}&rdquo;.
          </p>
        ) : (
          <ul
            className={`flex flex-col gap-2 transition-opacity ${
              isPending ? "opacity-60" : "opacity-100"
            }`}
          >
            {results.map((student) => {
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
                      <span className="block truncate font-[family-name:var(--font-lora)] text-sm font-medium">
                        {student.name}
                      </span>
                      <span
                        className={`block font-[family-name:var(--font-plex-mono)] text-[11px] ${
                          isActive ? "text-[#FDFBF7]/70" : "text-[#1A3A34]/50"
                        }`}
                      >
                        {student.standard} - {student.section} · {student.month}{" "}
                        {student.year}
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

        {isTruncated && (
          <p className="mt-3 font-[family-name:var(--font-plex-mono)] text-[11px] leading-relaxed text-[#1A3A34]/40">
            Showing the first {RESULT_LIMIT} of {matchCount}. Refine your search
            to narrow the list.
          </p>
        )}
      </div>
    </aside>
  );
}
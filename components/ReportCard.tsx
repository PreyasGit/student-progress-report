"use client";

import { useRef, useState } from "react";
import type { Student } from "@/app/page";
import PdfTemplate from "./PdfTemplate";
import { MONTHS } from "@/lib/formOptions";

interface ReportCardProps {
  student: Student | null;
  onUpdate: (id: string, updates: Partial<Student>) => void;
}

export type MetricKey = "assignments" | "quizzes" | "worksheets";

export const METRIC_KEYS: MetricKey[] = [
  "assignments",
  "quizzes",
  "worksheets",
];

export const METRIC_LABELS: Record<MetricKey, string> = {
  assignments: "Assignments",
  quizzes: "Quizzes",
  worksheets: "Worksheets",
};

/**
 * One button recipe, two tones. Shape, padding, type scale and transition are
 * shared so "Add" and "Clear" read as the same control, and only the tone
 * changes to mark the destructive one.
 */
const ACTION_BUTTON =
  "rounded-lg px-4 py-2 font-[family-name:var(--font-lora)] text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
export const NEUTRAL_ACTION = `${ACTION_BUTTON} bg-[#1A3A34]/10 text-[#1A3A34] hover:bg-[#1A3A34]/20`;
export const DANGER_ACTION = `${ACTION_BUTTON} bg-rose-600/10 text-rose-700 hover:bg-rose-600/20`;

export const getPercent = (m: { completed: number; total: number }) =>
  m.total > 0 ? Math.min(100, Math.round((m.completed / m.total) * 100)) : 0;

export const getBarColor = (percent: number) => {
  if (percent >= 80) return "bg-emerald-600";
  if (percent >= 50) return "bg-amber-500";
  return "bg-rose-500";
};

export const getTextColor = (percent: number) => {
  if (percent >= 80) return "text-emerald-700";
  if (percent >= 50) return "text-amber-600";
  return "text-rose-600";
};

export default function ReportCard({ student, onUpdate }: ReportCardProps) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [newTopic, setNewTopic] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  if (!student) {
    return (
      <div className="flex min-h-125 items-center justify-center rounded-3xl border-2 border-dashed border-[#1A3A34]/20 bg-white/40 p-10 text-center">
        <div>
          <p className="font-[family-name:var(--font-merriweather)] text-2xl font-bold text-[#1A3A34]/70">
            No Student Selected
          </p>
          <p className="mt-2 font-[family-name:var(--font-lora)] text-[#1A3A34]/50">
            Add or select a student from the sidebar to view their monthly
            progress report.
          </p>
        </div>
      </div>
    );
  }

  const monthIndex = MONTHS.indexOf(student.month);
  const yearNum = parseInt(student.year, 10) || new Date().getFullYear();
  const daysInMonth =
    monthIndex >= 0 ? new Date(yearNum, monthIndex + 1, 0).getDate() : 30;
  // --- ADDED: REAL CALENDAR LOGIC ---
  const firstDayOfMonth = monthIndex >= 0 ? new Date(yearNum, monthIndex, 1).getDay() : 0;
  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarGrid = [...blanks, ...days];
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // --- ADDED: CLEAR FUNCTIONS ---
  const clearTopics = () => onUpdate(student.id, { topics: [] });
  const clearAttendance = () => onUpdate(student.id, { attendedDays: [] });
  const clearMetrics = () => onUpdate(student.id, {
    metrics: {
      assignments: { completed: 0, total: 0 },
      quizzes: { completed: 0, total: 0 },
      worksheets: { completed: 0, total: 0 },
    }
  });

  const hasMetricData = METRIC_KEYS.some(
    (key) =>
      student.metrics[key].completed > 0 || student.metrics[key].total > 0
  );

  const assignmentsPercent = getPercent(student.metrics.assignments);
  const quizzesPercent = getPercent(student.metrics.quizzes);
  const worksheetsPercent = getPercent(student.metrics.worksheets);
  const overallPercent = Math.round(
    (assignmentsPercent + quizzesPercent + worksheetsPercent) / 3
  );

  const toggleDay = (day: number) => {
    const attended = student.attendedDays.includes(day)
      ? student.attendedDays.filter((d) => d !== day)
      : [...student.attendedDays, day].sort((a, b) => a - b);
    onUpdate(student.id, { attendedDays: attended });
  };

  const addTopic = () => {
    const trimmed = newTopic.trim();
    if (!trimmed) return;
    // Pills sit side by side, so an exact repeat just reads as a rendering bug.
    const isDuplicate = student.topics.some(
      (topic) => topic.toLowerCase() === trimmed.toLowerCase()
    );
    if (!isDuplicate) {
      onUpdate(student.id, { topics: [...student.topics, trimmed] });
    }
    setNewTopic("");
  };

  const removeTopic = (index: number) => {
    onUpdate(student.id, {
      topics: student.topics.filter((_, i) => i !== index),
    });
  };

  const updateMetric = (
    key: MetricKey,
    field: "completed" | "total",
    rawValue: number
  ) => {
    const safeValue = Number.isNaN(rawValue) || rawValue < 0 ? 0 : rawValue;
    onUpdate(student.id, {
      metrics: {
        ...student.metrics,
        [key]: { ...student.metrics[key], [field]: safeValue },
      },
    });
  };

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        backgroundColor: "#FDFBF7",
        useCORS: true,
        windowWidth: pdfRef.current.scrollWidth,
        windowHeight: pdfRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }

      const fileName = `${student.name.replace(/\s+/g, "_")}_${student.month}_${student.year}_Report.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Something went wrong while generating the PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-merriweather)] text-lg font-bold text-[#1A3A34]/80">
          Monthly Progress Report
        </h2>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="rounded-full bg-[#1A3A34] px-5 py-2.5 font-[family-name:var(--font-lora)] text-sm font-medium text-[#FDFBF7] shadow-md transition hover:bg-[#122925] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? "Generating PDF..." : "Save as PDF"}
        </button>
      </div>

      {/* ==================== INTERACTIVE UI ==================== */}
      <div className="relative overflow-hidden rounded-3xl border border-[#1A3A34]/10 bg-[#FDFBF7] pb-10 pl-16 pr-8 pt-8 shadow-xl sm:pl-20 sm:pr-10">
        <div className="absolute bottom-0 left-0 top-0 flex w-10 flex-col items-center justify-around bg-[#1A3A34] py-8 sm:w-12">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-3.5 w-3.5 rounded-full bg-[#FDFBF7] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"
            />
          ))}
        </div>

        <div className="mb-8 flex flex-col gap-4 border-b-2 border-dashed border-[#1A3A34]/20 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-[family-name:var(--font-merriweather)] text-xs uppercase tracking-[0.2em] text-[#1A3A34]/50">
              {student.month} {student.year}
            </p>
            <h1 className="font-[family-name:var(--font-merriweather)] text-2xl font-bold text-[#1A3A34] sm:text-3xl">
              Student Monthly Progress Report
            </h1>
          </div>

          <div className="shrink-0 rounded-2xl bg-[#1A3A34]/5 px-5 py-4 sm:text-right">
            <p className="font-[family-name:var(--font-merriweather)] text-lg font-bold text-[#1A3A34]">
              {student.name}
            </p>
            <dl className="mt-1 flex flex-col gap-0.5 font-[family-name:var(--font-plex-mono)] text-xs text-[#1A3A34]/70">
              <div className="flex items-center gap-1.5 sm:justify-end">
                <dt className="text-[#1A3A34]/40">Standard:</dt>
                <dd>
                  {student.standard}
                  {student.section ? ` - ${student.section}` : ""}
                </dd>
              </div>
              <div className="flex items-center gap-1.5 sm:justify-end">
                <dt className="text-[#1A3A34]/40">Subject:</dt>
                <dd>{student.subject}</dd>
              </div>
              <div className="flex items-center gap-1.5 sm:justify-end">
                <dt className="text-[#1A3A34]/40">Tutor:</dt>
                <dd>{student.tutor}</dd>
              </div>
            </dl>
          </div>
        </div>

        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-[family-name:var(--font-merriweather)] text-lg font-bold text-[#1A3A34]">
              Topics Covered
            </h3>
            <button
              onClick={clearTopics}
              disabled={student.topics.length === 0}
              className={DANGER_ACTION}
            >
              Clear
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTopic();
                }
              }}
              placeholder="Add a topic..."
              className="flex-1 rounded-lg border border-[#1A3A34]/15 bg-white/70 px-3 py-2 font-[family-name:var(--font-lora)] text-sm text-[#1A3A34] outline-none focus:border-[#1A3A34]/40"
            />
            <button
              onClick={addTopic}
              disabled={!newTopic.trim()}
              className={NEUTRAL_ACTION}
            >
              Add
            </button>
          </div>

          {student.topics.length === 0 ? (
            <p className="mt-3 font-[family-name:var(--font-lora)] text-sm italic text-[#1A3A34]/40">
              No topics added yet.
            </p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {student.topics.map((topic, index) => (
                <li
                  key={`${topic}-${index}`}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#1A3A34]/5 py-1.5 pl-3 pr-1.5 font-[family-name:var(--font-lora)] text-sm text-[#1A3A34] transition hover:bg-[#1A3A34]/10"
                >
                  <span className="truncate">{topic}</span>
                  <button
                    onClick={() => removeTopic(index)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] text-[#1A3A34]/40 transition hover:bg-rose-600/10 hover:text-rose-700"
                    aria-label={`Remove ${topic}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-8">
          {/* UPDATED: NO PERCENTAGE AND ADDED CLEAR BUTTON */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-merriweather)] text-lg font-bold text-[#1A3A34]">
              Classes Attended
            </h3>
            <div className="flex items-center gap-4">
              <span className="font-[family-name:var(--font-plex-mono)] text-xs text-[#1A3A34]/60">
                {student.attendedDays.length} / {daysInMonth} days
              </span>
              <button
                onClick={clearAttendance}
                disabled={student.attendedDays.length === 0}
                className={DANGER_ACTION}
              >
                Clear
              </button>
            </div>
          </div>
          
          {/* UPDATED: REAL CALENDAR GRID WITH WEEKDAYS */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {weekDays.map((day) => (
              <div key={day} className="font-[family-name:var(--font-plex-mono)] text-xs font-semibold text-[#1A3A34]/50 pb-1">
                {day}
              </div>
            ))}
            {calendarGrid.map((day, i) => {
              if (!day) return <div key={`blank-${i}`} />;
              const attended = student.attendedDays.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`aspect-square rounded-lg font-[family-name:var(--font-plex-mono)] text-xs font-medium transition ${
                    attended
                      ? "bg-[#1A3A34] text-[#FDFBF7] shadow-sm"
                      : "bg-[#1A3A34]/5 text-[#1A3A34]/50 hover:bg-[#1A3A34]/10"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-[family-name:var(--font-merriweather)] text-lg font-bold text-[#1A3A34]">
              Performance Metrics
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-[#1A3A34] px-4 py-1.5 font-[family-name:var(--font-plex-mono)] text-sm font-semibold text-[#FDFBF7]">
                Overall Rating: {overallPercent}%
              </div>
              <button
                onClick={clearMetrics}
                disabled={!hasMetricData}
                className={DANGER_ACTION}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-5">
            {METRIC_KEYS.map(
              (key) => {
                const metric = student.metrics[key];
                const percent = getPercent(metric);
                return (
                  <div key={key}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-[family-name:var(--font-lora)] text-sm font-medium text-[#1A3A34]">
                        {METRIC_LABELS[key]}
                      </span>
                      <div className="flex items-center gap-2 font-[family-name:var(--font-plex-mono)] text-sm text-[#1A3A34]">
                        <input
                          type="number"
                          min={0}
                          value={metric.completed}
                          onChange={(e) =>
                            updateMetric(
                              key,
                              "completed",
                              parseInt(e.target.value, 10)
                            )
                          }
                          className="w-12 rounded border border-[#1A3A34]/15 bg-white/70 px-2 py-1 text-center outline-none focus:border-[#1A3A34]/40"
                        />
                        <span className="text-[#1A3A34]/50">out of</span>
                        <input
                          type="number"
                          min={0}
                          value={metric.total}
                          onChange={(e) =>
                            updateMetric(
                              key,
                              "total",
                              parseInt(e.target.value, 10)
                            )
                          }
                          className="w-12 rounded border border-[#1A3A34]/15 bg-white/70 px-2 py-1 text-center outline-none focus:border-[#1A3A34]/40"
                        />
                        <span className="ml-1 w-10 text-right font-semibold">
                          {percent}%
                        </span>
                      </div>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-[#1A3A34]/10">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(
                          percent
                        )}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>
      </div>

      <PdfTemplate
        ref={pdfRef}
        student={student}
        daysInMonth={daysInMonth}
        overallPercent={overallPercent}
      />
    </div>
  );
}
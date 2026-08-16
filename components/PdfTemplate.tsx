"use client";

import { forwardRef } from "react";
import type { Student } from "@/app/page";
import { 
  SUBJECT, 
  TUTOR, 
  METRIC_LABELS, 
  getPercent, 
  getBarColor, 
  getTextColor, 
  type MetricKey 
} from "./ReportCard";

interface PdfTemplateProps {
  student: Student;
  daysInMonth: number;
  attendancePercent: number;
  overallPercent: number;
}

const PdfTemplate = forwardRef<HTMLDivElement, PdfTemplateProps>(
  ({ student, daysInMonth, attendancePercent, overallPercent }, ref) => {
    return (
      <div className="pointer-events-none absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <div ref={ref} className="w-[210mm] min-h-[297mm] bg-[#FDFBF7] p-14">
          {/* Formal Letterhead */}
          <div className="mb-10 text-center">
            <p className="font-[family-name:var(--font-merriweather)] text-xs uppercase tracking-[0.4em] text-[#1A3A34]/60">
              {student.month} {student.year}
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-merriweather)] text-3xl font-bold uppercase tracking-wide text-[#1A3A34]">
              Student Monthly Progress Report
            </h1>
            <div className="mx-auto mt-4 h-[2px] w-28 bg-[#1A3A34]" />
          </div>

          <div className="mb-10 grid grid-cols-4 divide-x divide-[#1A3A34]/25 border-y border-[#1A3A34]/25">
            <div className="px-3 py-3 text-center">
              <p className="font-[family-name:var(--font-merriweather)] text-[9px] uppercase tracking-[0.2em] text-[#1A3A34]/50">
                Student
              </p>
              <p className="mt-1 font-[family-name:var(--font-merriweather)] text-sm font-bold text-[#1A3A34]">
                {student.name}
              </p>
            </div>
            <div className="px-3 py-3 text-center">
              <p className="font-[family-name:var(--font-merriweather)] text-[9px] uppercase tracking-[0.2em] text-[#1A3A34]/50">
                Grade
              </p>
              <p className="mt-1 font-[family-name:var(--font-merriweather)] text-sm font-bold text-[#1A3A34]">
                {student.grade}
              </p>
            </div>
            <div className="px-3 py-3 text-center">
              <p className="font-[family-name:var(--font-merriweather)] text-[9px] uppercase tracking-[0.2em] text-[#1A3A34]/50">
                Subject
              </p>
              <p className="mt-1 font-[family-name:var(--font-merriweather)] text-sm font-bold text-[#1A3A34]">
                {SUBJECT}
              </p>
            </div>
            <div className="px-3 py-3 text-center">
              <p className="font-[family-name:var(--font-merriweather)] text-[9px] uppercase tracking-[0.2em] text-[#1A3A34]/50">
                Tutor
              </p>
              <p className="mt-1 font-[family-name:var(--font-merriweather)] text-sm font-bold text-[#1A3A34]">
                {TUTOR}
              </p>
            </div>
          </div>

          {/* Topics Covered */}
          <div className="mb-9">
            <h2 className="mb-3 font-[family-name:var(--font-merriweather)] text-base font-bold uppercase tracking-wide text-[#1A3A34]">
              Topics Covered
            </h2>
            {student.topics.length === 0 ? (
              <p className="font-[family-name:var(--font-lora)] text-sm italic text-[#1A3A34]/40">
                No topics recorded this month.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {student.topics.map((topic, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 font-[family-name:var(--font-lora)] text-sm text-[#1A3A34]"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1A3A34]/60" />
                    {topic}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Classes Attended */}
          <div className="mb-9">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-merriweather)] text-base font-bold uppercase tracking-wide text-[#1A3A34]">
                Classes Attended
              </h2>
              <span className="font-[family-name:var(--font-plex-mono)] text-xs text-[#1A3A34]/60">
                {student.attendedDays.length} / {daysInMonth} days &middot;{" "}
                {attendancePercent}% attendance
              </span>
            </div>
            <div className="grid grid-cols-7 border-l border-t border-[#1A3A34]/15">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
                  const attended = student.attendedDays.includes(day);
                  return (
                    <div
                      key={day}
                      className="flex items-center justify-center border-b border-r border-[#1A3A34]/15 py-2"
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full font-[family-name:var(--font-plex-mono)] text-xs ${
                          attended
                            ? "border border-[#1A3A34] font-bold text-[#1A3A34]"
                            : "text-[#1A3A34]/35"
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-merriweather)] text-base font-bold uppercase tracking-wide text-[#1A3A34]">
                Performance Metrics
              </h2>
              <div className="rounded-full bg-[#1A3A34] px-4 py-1.5 font-[family-name:var(--font-plex-mono)] text-xs font-semibold text-[#FDFBF7]">
                Overall Rating: {overallPercent}%
              </div>
            </div>
            <div className="flex flex-col gap-5">
              {(["assignments", "quizzes", "worksheets"] as MetricKey[]).map(
                (key) => {
                  const metric = student.metrics[key];
                  const percent = getPercent(metric);
                  return (
                    <div key={key}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="font-[family-name:var(--font-lora)] text-sm font-medium text-[#1A3A34]">
                          {METRIC_LABELS[key]}
                        </span>
                        <span
                          className={`font-[family-name:var(--font-plex-mono)] text-sm font-semibold ${getTextColor(
                            percent
                          )}`}
                        >
                          {metric.completed} / {metric.total} &nbsp;
                          ({percent}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1A3A34]/10">
                        <div
                          className={`h-full rounded-full ${getBarColor(
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
          </div>
        </div>
      </div>
    );
  }
);

PdfTemplate.displayName = "PdfTemplate";
export default PdfTemplate;
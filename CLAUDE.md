# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Avoid to read the @node_modules

## Commands

```bash
npm run dev     # next dev on http://localhost:3000
npm run build   # production build
npm start       # serve the production build
npm run lint    # eslint (flat config, eslint.config.mjs)
```

There is no test runner, test suite, or CI config in this repo. Verify changes with `npm run build` (type errors surface there — `tsc` is `noEmit` only) plus manual checks in the dev server.

## Architecture

A single-page, **entirely client-side** Next.js 16 App Router app for building and exporting a monthly student progress report. There are no server components doing real work, no API routes, no database, and no auth — `app/page.tsx` is `"use client"` and every component below it is too.

**Persistence is `localStorage`**, key `spr-students-v1`, owned solely by `hooks/useStudents.ts`. That hook is the single source of truth for all app state (student list, active selection, CRUD). Load is deferred through `setTimeout(..., 0)` to avoid cascading synchronous renders on hydration, and the `isLoaded` flag gates the save effect so an empty initial state never overwrites stored data. Any new persisted field must be added to the `Student` interface there — old records in a user's `localStorage` will not have it, so read defensively.

**Type re-export convention:** `Student` and `PerformanceMetric` are declared in `hooks/useStudents.ts` but components import them from `@/app/page`, which re-exports them. Follow the existing import style rather than mixing sources.

### The two-renderer report (most important thing to know)

The report exists twice, in two components that must be kept in sync:

- `components/ReportCard.tsx` — the interactive on-screen editor (calendar toggles, topic input, metric number inputs, Clear buttons).
- `components/PdfTemplate.tsx` — a non-interactive print replica, fixed at `210mm × 297mm` (A4), rendered offscreen via `absolute left-[-9999px]` and exposed through a `forwardRef` that `ReportCard` holds in `pdfRef`.

**Adding or changing any report field means editing both files.** Shared display logic lives in `ReportCard.tsx` and is imported by `PdfTemplate.tsx`: `METRIC_LABELS`, `getPercent`, `getBarColor`, `getTextColor`, and the `MetricKey` type. Put new shared logic there too, not duplicated.

The two intentionally differ in layout: the editor draws a real weekday-aligned calendar (leading blanks from `getDay()`), while the PDF draws a plain 7-column day grid. Derived values (`daysInMonth`, `attendancePercent`, `overallPercent`) are computed once in `ReportCard` and passed down as props.

### PDF export

`handleExportPDF` in `ReportCard.tsx` dynamically imports `html2canvas-pro` and `jspdf` inside the handler — keep them dynamic so they stay out of the initial bundle. It is **`html2canvas-pro`, not `html2canvas`**: Tailwind v4 emits `oklch()` colors that classic html2canvas cannot parse. The canvas is rasterized at `scale: 2` and sliced across A4 pages by repositioning the same image with negative offsets.

### Predefined option lists (standard, section, subject, tutor, month, year)

`data/formOptions.json` is the single source of truth for every dropdown list in the Add Student form, read through the typed wrapper in `lib/formOptions.ts` (`STANDARDS`, `SECTIONS`, `SUBJECTS`, `TUTORS`, `MONTHS`, `getYearOptions()`, plus `DEFAULT_*` constants and `findOption()` for fuzzy/case-insensitive matching). Add or rename an option there and it propagates to the form's dropdowns, the sidebar search index, and the `localStorage` migration in `hooks/useStudents.ts` automatically — don't hardcode these lists elsewhere. `standard`, `section`, `subject`, and `tutor` are per-student fields on `Student` (not app-wide constants), picked via the reusable `components/Combobox.tsx` searchable dropdown.

Records saved before a field existed (e.g. old `grade`-only records, or records from before `subject`/`tutor` existed) are brought up to date by `migrateStudent()` in `hooks/useStudents.ts`, matching stored values against the current option lists and falling back to `DEFAULT_*` — any new field added to `Student` needs the same treatment there.

## Styling

Tailwind v4 via `@tailwindcss/postcss` — there is **no `tailwind.config.js`**; configuration goes in `app/globals.css` under `@theme`. Path alias `@/*` maps to the repo root.

Fonts are loaded in `app/layout.tsx` with `next/font/google` as CSS variables and applied through arbitrary-value classes like `font-[family-name:var(--font-merriweather)]`. Only three variables are actually defined: `--font-merriweather`, `--font-lora`, `--font-plex-mono`. `components/StudentSidebar.tsx` still references `--font-bricolage` and `--font-work-sans`, which are **not defined anywhere** and silently fall back — use one of the three real variables in new code, and prefer fixing those references over copying them.

`app/globals.css` still contains unused `create-next-app` boilerplate (Geist font vars, a `prefers-color-scheme: dark` block, an `Arial` body rule) that the app overrides via `layout.tsx`. The real palette is applied inline: `#FDFBF7` paper background, `#1A3A34` dark green ink, with `emerald / amber / rose` at the 80% / 50% thresholds for metric bars.

"use client";

import { useId, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { motion } from "framer-motion";

export const CANCEL_ACTION =
  "flex-1 rounded-lg border border-[#1A3A34]/15 bg-white px-4 py-2.5 font-[family-name:var(--font-lora)] text-sm font-medium text-[#1A3A34] transition hover:bg-[#1A3A34]/5";
export const PRIMARY_SOLID =
  "flex-1 rounded-lg bg-[#1A3A34] px-4 py-2.5 font-[family-name:var(--font-lora)] text-sm font-medium text-[#FDFBF7] shadow-sm transition hover:bg-[#122925]";
export const DANGER_SOLID =
  "flex-1 rounded-lg bg-rose-600 px-4 py-2.5 font-[family-name:var(--font-lora)] text-sm font-medium text-white shadow-sm transition hover:bg-rose-700";

export function DangerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <path
        d="M12 9v4m0 4h.01M10.29 3.86l-8.02 13.9A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3l-8.02-13.9a2 2 0 0 0-3.44 0Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 11v5m0-8h.01"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <path
        d="M12 5v14m-7-7h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface ModalShellProps {
  tone: "danger" | "neutral";
  icon: ReactNode;
  title: string;
  description?: string;
  onDismiss: () => void;
  /** Focusable elements to Tab-cycle within, in visual order. */
  focusables: RefObject<HTMLElement | null>[];
  children: ReactNode;
}

/**
 * Shared chrome for the app's promise-based modals (ConfirmProvider,
 * PromptProvider): the dimmed/blurred backdrop, the centered animated card,
 * the tone-colored icon badge, and a Tab-cycling focus trap across whatever
 * focusable elements the caller passes in. Callers own everything below the
 * title/description — buttons, inputs, whatever the dialog needs.
 */
export default function ModalShell({
  tone,
  icon,
  title,
  description,
  onDismiss,
  focusables,
  children,
}: ModalShellProps) {
  const titleId = useId();
  const descriptionId = useId();

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const elements = focusables
      .map((ref) => ref.current)
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A3A34]/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onKeyDown={trapFocus}
        className="w-full max-w-sm rounded-3xl border border-[#1A3A34]/10 bg-[#FDFBF7] p-7 text-center shadow-2xl"
      >
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            tone === "danger"
              ? "bg-rose-600/10 text-rose-600"
              : "bg-[#1A3A34]/10 text-[#1A3A34]"
          }`}
        >
          {icon}
        </div>

        <h2
          id={titleId}
          className="mt-4 font-[family-name:var(--font-merriweather)] text-lg font-bold text-[#1A3A34]"
        >
          {title}
        </h2>
        {description && (
          <p
            id={descriptionId}
            className="mt-2 font-[family-name:var(--font-lora)] text-sm leading-relaxed text-[#1A3A34]/70"
          >
            {description}
          </p>
        )}

        {children}
      </motion.div>
    </motion.div>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { AnimatePresence } from "framer-motion";
import ModalShell, { CANCEL_ACTION, PRIMARY_SOLID, PlusIcon } from "./ModalShell";

export interface PromptOptions {
  title: string;
  description?: string;
  inputLabel?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Return an error message to block submission, or undefined if the value is fine. */
  validate?: (value: string) => string | undefined;
}

/** Resolves to the trimmed input value, or null if the user cancelled. */
type PromptFn = (options: PromptOptions) => Promise<string | null>;

const PromptContext = createContext<PromptFn | null>(null);

/**
 * App-wide free-text prompt, the input-collecting sibling of useConfirm.
 * Mounted once at the root (see app/layout.tsx). Used for things like
 * letting a user add a custom dropdown option that isn't on a predefined
 * list — see the "Add new" row wired up in Combobox/StudentSidebar.
 */
export function usePrompt(): PromptFn {
  const prompt = useContext(PromptContext);
  if (!prompt) {
    throw new Error("usePrompt must be used within a PromptProvider");
  }
  return prompt;
}

interface PendingPrompt extends PromptOptions {
  resolve: (value: string | null) => void;
}

export function PromptProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingPrompt | null>(null);
  const [visible, setVisible] = useState(false);

  const prompt = useCallback<PromptFn>((options) => {
    return new Promise<string | null>((resolve) => {
      setPending({ ...options, resolve });
      setVisible(true);
    });
  }, []);

  const settle = (result: string | null) => {
    pending?.resolve(result);
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") settle(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <PromptContext.Provider value={prompt}>
      {children}
      <AnimatePresence onExitComplete={() => setPending(null)}>
        {visible && pending && (
          <PromptDialog
            key="prompt-dialog"
            {...pending}
            onCancel={() => settle(null)}
            onSubmit={(value) => settle(value)}
          />
        )}
      </AnimatePresence>
    </PromptContext.Provider>
  );
}

interface PromptDialogProps extends PromptOptions {
  onCancel: () => void;
  onSubmit: (value: string) => void;
}

function PromptDialog({
  title,
  description,
  inputLabel,
  placeholder,
  confirmLabel = "Add",
  cancelLabel = "Cancel",
  validate,
  onCancel,
  onSubmit,
}: PromptDialogProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const inputId = useId();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a value first.");
      return;
    }
    const validationError = validate?.(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <ModalShell
      tone="neutral"
      icon={<PlusIcon />}
      title={title}
      description={description}
      onDismiss={onCancel}
      focusables={[inputRef, cancelRef, submitRef]}
    >
      <form onSubmit={handleSubmit} className="mt-5 text-left">
        {inputLabel && (
          <label
            htmlFor={inputId}
            className="mb-1 block font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-wider text-[#1A3A34]/50"
          >
            {inputLabel}
          </label>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[#1A3A34]/15 bg-white px-3 py-2 font-[family-name:var(--font-lora)] text-sm text-[#1A3A34] outline-none focus:border-[#1A3A34]/40"
        />
        {error && (
          <p className="mt-1.5 font-[family-name:var(--font-lora)] text-xs text-rose-600">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={CANCEL_ACTION}
          >
            {cancelLabel}
          </button>
          <button ref={submitRef} type="submit" className={PRIMARY_SOLID}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

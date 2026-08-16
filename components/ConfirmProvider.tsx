"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence } from "framer-motion";
import ModalShell, {
  CANCEL_ACTION,
  DANGER_SOLID,
  DangerIcon,
  InfoIcon,
  PRIMARY_SOLID,
} from "./ModalShell";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" for destructive actions (delete, clear), "neutral" otherwise. */
  tone?: "danger" | "neutral";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * App-wide replacement for `window.confirm`. Mounted once at the root
 * (see app/layout.tsx) so any component can `await confirm({...})` and get
 * a themed modal instead of the browser's native dialog, without having to
 * render or manage a dialog itself.
 */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return confirm;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  // Separate from `pending` so the dialog's content survives the exit
  // animation: closing resolves the promise and drops `visible` right away,
  // but `pending` (title/description/...) isn't cleared until
  // AnimatePresence reports the exit animation has actually finished.
  const [visible, setVisible] = useState(false);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
      setVisible(true);
    });
  }, []);

  const settle = (result: boolean) => {
    pending?.resolve(result);
    setVisible(false);
  };

  // Escape closes from anywhere, and background content can't scroll behind the modal.
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") settle(false);
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
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence onExitComplete={() => setPending(null)}>
        {visible && pending && (
          <ConfirmDialog
            key="confirm-dialog"
            {...pending}
            onCancel={() => settle(false)}
            onConfirm={() => settle(true)}
          />
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

interface ConfirmDialogProps extends ConfirmOptions {
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Default focus lands on Cancel — the safer target when the action is destructive.
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <ModalShell
      tone={tone}
      icon={tone === "danger" ? <DangerIcon /> : <InfoIcon />}
      title={title}
      description={description}
      onDismiss={onCancel}
      focusables={[cancelRef, confirmRef]}
    >
      <div className="mt-7 flex gap-3">
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          className={CANCEL_ACTION}
        >
          {cancelLabel}
        </button>
        <button
          ref={confirmRef}
          type="button"
          onClick={onConfirm}
          className={tone === "danger" ? DANGER_SOLID : PRIMARY_SOLID}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}

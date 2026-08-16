"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { normalize } from "@/lib/text";

interface ComboboxProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;
  /** Subset of `options` that were user-added rather than predefined — flagged with a "Custom" tag. */
  customValues?: readonly string[];
  /**
   * Renders a persistent "+ Add new ..." row under the list when provided.
   * The Combobox only closes itself and hands off — the caller owns
   * collecting the new value (e.g. via a prompt modal) and updating `options`.
   */
  onAddNew?: () => void;
}

interface PanelPosition {
  top: number;
  left: number;
  width: number;
  /** X offset of the pointer arrow, relative to the panel's own left edge. */
  arrowLeft: number;
}

/**
 * Ancestor marker (put on the surrounding `<form>`) that panels clamp
 * themselves to horizontally. Falls back to the viewport when a Combobox is
 * used somewhere that hasn't opted into a bounds — the popover still works,
 * it just isn't held to a particular container.
 */
const BOUNDS_SELECTOR = "[data-combobox-bounds]";

const PANEL_MARGIN = 12; // px kept clear of the bounds' edges
const MIN_PANEL_WIDTH = 240; // wide enough to read "September" plus a checkmark without feeling cramped
const ARROW_INSET = 16; // keeps the arrow off the panel's rounded corners
const TRIGGER_GAP = 10; // px between trigger and panel, room for the arrow

/**
 * The panel is deliberately not sized to the trigger — a field in a narrow
 * grid column (~130px here) is too tight for a readable option list, so the
 * panel is given a sensible minimum width and centered on the trigger, then
 * clamped so it never spills past the nearest `[data-combobox-bounds]`
 * ancestor. The returned arrowLeft keeps the pointer caret aimed at the
 * trigger even after that clamping shifts the panel off-center.
 */
function measurePanelPosition(trigger: HTMLElement): PanelPosition {
  const bounds =
    trigger.closest<HTMLElement>(BOUNDS_SELECTOR) ?? document.documentElement;
  const triggerRect = trigger.getBoundingClientRect();
  const boundsRect = bounds.getBoundingClientRect();

  const maxWidth = Math.max(
    boundsRect.width - PANEL_MARGIN * 2,
    MIN_PANEL_WIDTH / 2
  );
  const width = Math.min(Math.max(triggerRect.width, MIN_PANEL_WIDTH), maxWidth);

  const minLeft = boundsRect.left + PANEL_MARGIN;
  const maxLeft = Math.max(boundsRect.right - PANEL_MARGIN - width, minLeft);
  const triggerCenter = triggerRect.left + triggerRect.width / 2;
  const left = Math.min(Math.max(triggerCenter - width / 2, minLeft), maxLeft);

  const arrowLeft = Math.min(
    Math.max(triggerCenter - left, ARROW_INSET),
    width - ARROW_INSET
  );

  return { top: triggerRect.bottom + TRIGGER_GAP, left, width, arrowLeft };
}

/**
 * A searchable, single-select dropdown styled to match the app's plain
 * <input>/<select> fields. Built once here so every field that needs to pick
 * from a predefined list (standard, section, month, year, ...) behaves and
 * looks identically instead of each screen growing its own variant.
 */
export default function Combobox({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Type to search...",
  emptyMessage = "No matches",
  disabled = false,
  required = false,
  customValues,
  onAddNew,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [position, setPosition] = useState<PanelPosition | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const listboxId = `${useId()}-listbox`;

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      normalize(option).includes(normalizedQuery)
    );
  }, [options, query]);

  // Click (or touch) outside the trigger+panel closes it.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  // Reset the query, jump the highlight to the current value, and measure the
  // panel's position all at the moment we decide to open, rather than
  // reacting to `open` becoming true in an effect — that would mean a
  // setState synchronously triggering a re-render inside another render's
  // effect pass. The trigger's layout doesn't depend on the panel being
  // open (the panel is position: fixed), so it's safe to measure here.
  const openDropdown = () => {
    if (triggerRef.current) {
      setPosition(measurePanelPosition(triggerRef.current));
    }
    setQuery("");
    setHighlightedIndex(Math.max(options.indexOf(value), 0));
    setOpen(true);
  };

  // Focusing the search input is a DOM side effect, not state sync, so it
  // belongs in an effect keyed on `open`.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Keep the panel aligned with its trigger across viewport size changes.
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    if (!trigger) return;
    const handleResize = () => setPosition(measurePanelPosition(trigger));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open]);

  // The panel is fixed-positioned from a one-off measurement, so it would
  // visually drift from its trigger if the page scrolled underneath it.
  // Closing on scroll is simpler and less jarring than repositioning live;
  // scrolling within the option list itself is exempted.
  useEffect(() => {
    if (!open) return;
    const handleScroll = (event: Event) => {
      if (listRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.children[highlightedIndex];
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedIndex, open]);

  const commitSelection = (option: string) => {
    onChange(option);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((i) =>
          Math.min(i + 1, filteredOptions.length - 1)
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        event.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          commitSelection(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      {label && (
        <label className="mb-1 block font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-wider text-[#1A3A34]/50">
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-required={required}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-left font-[family-name:var(--font-lora)] text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
          open
            ? "border-[#1A3A34]/40 ring-2 ring-[#1A3A34]/15"
            : "border-[#1A3A34]/15"
        } ${value ? "text-[#1A3A34]" : "text-[#1A3A34]/40"}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-[#1A3A34]/50 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M5.5 7.5L10 12l4.5-4.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && position && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
            }}
            className="z-20 origin-top"
          >
            <span
              aria-hidden="true"
              style={{ top: -6, left: position.arrowLeft - 5 }}
              className="absolute h-2.5 w-2.5 rotate-45 border-l border-t border-[#1A3A34]/15 bg-white"
            />
            <div className="overflow-hidden rounded-lg border border-[#1A3A34]/15 bg-white shadow-lg">
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                aria-label={
                  label ? `Search ${label.toLowerCase()}` : "Search options"
                }
                className="w-full border-b border-[#1A3A34]/10 px-3 py-2 font-[family-name:var(--font-lora)] text-sm text-[#1A3A34] outline-none placeholder:text-[#1A3A34]/35"
              />
              <ul
                ref={listRef}
                id={listboxId}
                role="listbox"
                className="themed-scrollbar max-h-52 overflow-y-auto py-1"
              >
                {filteredOptions.length === 0 ? (
                  <li className="px-3 py-2 font-[family-name:var(--font-lora)] text-sm italic text-[#1A3A34]/40">
                    {emptyMessage}
                  </li>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = option === value;
                    const isHighlighted = index === highlightedIndex;
                    const isCustom = customValues?.includes(option);
                    return (
                      <li
                        key={option}
                        role="option"
                        aria-selected={isSelected}
                        onMouseDown={(e) => {
                          // Fire before the search input's blur can close the panel.
                          e.preventDefault();
                          commitSelection(option);
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 font-[family-name:var(--font-lora)] text-sm transition ${
                          isSelected
                            ? "bg-[#1A3A34] text-[#FDFBF7]"
                            : isHighlighted
                              ? "bg-[#1A3A34]/10 text-[#1A3A34]"
                              : "text-[#1A3A34]"
                        }`}
                      >
                        <span className="truncate">{option}</span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          {isCustom && (
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                                isSelected
                                  ? "bg-[#FDFBF7]/15 text-[#FDFBF7]/80"
                                  : "bg-[#1A3A34]/10 text-[#1A3A34]/50"
                              }`}
                            >
                              Custom
                            </span>
                          )}
                          {isSelected && <span className="text-xs">✓</span>}
                        </span>
                      </li>
                    );
                  })
                )}
              </ul>
              {onAddNew && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    onAddNew();
                  }}
                  className="flex w-full items-center gap-2 border-t border-[#1A3A34]/10 px-3 py-2 font-[family-name:var(--font-lora)] text-sm text-[#1A3A34] transition hover:bg-[#1A3A34]/5"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1A3A34]/10 text-xs font-bold leading-none">
                    +
                  </span>
                  Add new{label ? ` ${label.toLowerCase()}` : ""}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

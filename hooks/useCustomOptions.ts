"use client";

import { useEffect, useState } from "react";

/** The dropdowns where a locally-added value actually makes sense — see StudentSidebar. */
export type OptionCategory = "standard" | "section" | "subject" | "tutor";

type CustomOptionsState = Record<OptionCategory, string[]>;

const STORAGE_KEY = "spr-custom-options-v1";

const EMPTY_STATE: CustomOptionsState = {
  standard: [],
  section: [],
  subject: [],
  tutor: [],
};

/**
 * User-added dropdown values (a subject or tutor not on the predefined list
 * in data/formOptions.json, say). These are device-local by construction —
 * this app has no backend to share them to — so they're kept in their own
 * localStorage key, separate from student records, following the same
 * deferred-load / isLoaded-gated-save pattern as useStudents.
 */
export function useCustomOptions() {
  const [customOptions, setCustomOptions] =
    useState<CustomOptionsState>(EMPTY_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setTimeout(() => {
        if (raw) {
          const parsed: Partial<CustomOptionsState> = JSON.parse(raw);
          setCustomOptions({
            standard: parsed.standard ?? [],
            section: parsed.section ?? [],
            subject: parsed.subject ?? [],
            tutor: parsed.tutor ?? [],
          });
        }
        setIsLoaded(true);
      }, 0);
    } catch (error) {
      console.error("Failed to load custom dropdown options:", error);
      setTimeout(() => setIsLoaded(true), 0);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customOptions));
    } catch (error) {
      console.error("Failed to save custom dropdown options:", error);
    }
  }, [customOptions, isLoaded]);

  const addCustomOption = (category: OptionCategory, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setCustomOptions((prev) => {
      const alreadyPresent = prev[category].some(
        (option) => option.toLowerCase() === trimmed.toLowerCase()
      );
      if (alreadyPresent) return prev;
      return { ...prev, [category]: [...prev[category], trimmed] };
    });
  };

  return { customOptions, addCustomOption };
}

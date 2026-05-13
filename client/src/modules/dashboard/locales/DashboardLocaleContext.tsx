"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { en } from "./en";
import { bn } from "./bn";
import type { Locale, DashboardTranslations } from "./types";

const dictionaries: Record<Locale, DashboardTranslations> = { en, bn };

type DashboardLocaleContextValue = {
  locale: Locale;
  t: DashboardTranslations;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const DashboardLocaleContext = createContext<DashboardLocaleContextValue | null>(null);

export function DashboardLocaleProvider({
  children,
  defaultLocale = "en",
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);
  const toggleLocale = useCallback(
    () => setLocaleState((prev) => (prev === "bn" ? "en" : "bn")),
    [],
  );

  return (
    <DashboardLocaleContext.Provider
      value={{ locale, t: dictionaries[locale], setLocale, toggleLocale }}
    >
      {children}
    </DashboardLocaleContext.Provider>
  );
}

const noop = () => {};

const defaultValue: DashboardLocaleContextValue = {
  locale: "en",
  t: dictionaries.en,
  setLocale: noop,
  toggleLocale: noop,
};

export function useDashboardLocale() {
  const ctx = useContext(DashboardLocaleContext);
  return ctx ?? defaultValue;
}

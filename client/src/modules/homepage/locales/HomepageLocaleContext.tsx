"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { en } from "./en";
import { bn } from "./bn";
import type { Locale, HomepageTranslations } from "./types";

const dictionaries: Record<Locale, HomepageTranslations> = { en, bn };

type HomepageLocaleContextValue = {
  locale: Locale;
  t: HomepageTranslations;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const HomepageLocaleContext = createContext<HomepageLocaleContextValue | null>(null);

export function HomepageLocaleProvider({
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
    <HomepageLocaleContext.Provider
      value={{ locale, t: dictionaries[locale], setLocale, toggleLocale }}
    >
      {children}
    </HomepageLocaleContext.Provider>
  );
}

const noop = () => {};

const defaultValue: HomepageLocaleContextValue = {
  locale: "en",
  t: dictionaries.en,
  setLocale: noop,
  toggleLocale: noop,
};

export function useHomepageLocale() {
  const ctx = useContext(HomepageLocaleContext);
  return ctx ?? defaultValue;
}

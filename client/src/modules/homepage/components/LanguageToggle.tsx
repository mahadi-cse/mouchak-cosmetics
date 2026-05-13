"use client";

import { useHomepageLocale } from "../locales/HomepageLocaleContext";

export function LanguageToggle() {
  const { locale, toggleLocale, t } = useHomepageLocale();

  return (
    <button
      onClick={toggleLocale}
      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold transition hover:border-primary hover:text-primary"
      aria-label={t.header.ariaToggleLanguage}
    >
      {locale === "en" ? "বাংলা" : "English"}
    </button>
  );
}

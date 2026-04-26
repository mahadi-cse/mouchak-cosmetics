"use client";

import { Gift, Mail } from "lucide-react";
import { useHomepageLocale } from "../locales/HomepageLocaleContext";

export function Newsletter() {
  const { t } = useHomepageLocale();

  return (
    <section className="py-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,#F01172_0%,#C20D5E_50%,#7B0038_100%)] p-6 md:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-white/85">
                <Gift size={17} />
                <span className="text-sm font-medium">{t.newsletter.label}</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white">{t.newsletter.title}</h3>
              <p className="text-sm text-white/80">{t.newsletter.description}</p>
            </div>

            <form className="w-full max-w-md">
              <div className="flex overflow-hidden rounded-md bg-white">
                <div className="grid place-items-center px-3 text-zinc-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  placeholder={t.newsletter.inputPlaceholder}
                  className="w-full px-2 py-3 text-sm text-zinc-900 outline-none"
                />
                <button className="bg-zinc-900 px-5 text-sm font-bold text-white transition hover:bg-zinc-700">
                  {t.newsletter.submitButton}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-white/70">{t.newsletter.privacyNote}</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

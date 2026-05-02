"use client";

import { Gift, Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useHomepageLocale } from "../locales/HomepageLocaleContext";

export function Newsletter() {
  const { t } = useHomepageLocale();

  return (
    <section className="py-10 lg:py-14">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-dark)_100%)] p-8 sm:p-12 lg:p-16"
        >
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-white/8 blur-xl" />
          <div className="pointer-events-none absolute top-1/2 right-1/3 h-24 w-24 rounded-full bg-white/5 blur-lg" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-lg">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-white/90"
              >
                <Gift size={15} />
                <span className="text-sm font-medium">{t.newsletter.label}</span>
              </motion.div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 leading-tight">
                {t.newsletter.title}
              </h3>
              <p className="text-sm sm:text-base text-white/75 leading-relaxed">
                {t.newsletter.description}
              </p>
            </div>

            <motion.form
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-full max-w-md"
            >
              <div className="flex overflow-hidden rounded-xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                <div className="grid place-items-center px-4 text-zinc-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder={t.newsletter.inputPlaceholder}
                  className="w-full px-2 py-3.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                />
                <button className="flex items-center gap-2 bg-primary px-6 text-sm font-bold text-white transition-all duration-200 hover:brightness-90 whitespace-nowrap">
                  {t.newsletter.submitButton}
                  <ArrowRight size={14} />
                </button>
              </div>
              <p className="mt-3 text-[11px] text-white/60">{t.newsletter.privacyNote}</p>
            </motion.form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

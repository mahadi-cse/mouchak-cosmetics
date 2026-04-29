"use client";

import { Truck, Sparkles, Heart, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useHomepageLocale } from "../locales/HomepageLocaleContext";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export function Features() {
  const { t } = useHomepageLocale();

  const featureItems = [
    {
      title: t.features.freeDelivery,
      description: t.features.freeDeliveryDesc,
      icon: Truck,
      iconClass: "text-blue-600",
      chipClass: "bg-blue-50",
    },
    {
      title: t.features.premiumQuality,
      description: t.features.premiumQualityDesc,
      icon: Sparkles,
      iconClass: "text-violet-600",
      chipClass: "bg-violet-50",
    },
    {
      title: t.features.crueltyFree,
      description: t.features.crueltyFreeDesc,
      icon: Heart,
      iconClass: "text-rose-600",
      chipClass: "bg-rose-50",
    },
    {
      title: t.features.securePayment,
      description: t.features.securePaymentDesc,
      icon: Shield,
      iconClass: "text-emerald-600",
      chipClass: "bg-emerald-50",
    },
  ];

  return (
    <section className="border-b border-zinc-100 bg-white py-5">
      <motion.div
        className="mx-auto max-w-[1400px] grid gap-0 px-6 sm:px-10 sm:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {featureItems.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className={`flex items-center gap-4 px-5 py-5 transition-colors duration-200 hover:bg-zinc-50/80 rounded-xl ${
                idx < featureItems.length - 1 ? "lg:border-r lg:border-zinc-100" : ""
              }`}
            >
              <div
                className={`grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl ${feature.chipClass} transition-transform duration-200 hover:scale-105`}
              >
                <Icon size={22} className={feature.iconClass} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">{feature.title}</p>
                <p className="text-xs text-zinc-500">{feature.description}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

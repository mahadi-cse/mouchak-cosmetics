"use client";

import { Truck, Sparkles, Heart, Shield } from "lucide-react";
import { useHomepageLocale } from "../locales/HomepageLocaleContext";

export function Features() {
  const { t } = useHomepageLocale();

  const featureItems = [
    {
      title: t.features.freeDelivery,
      description: t.features.freeDeliveryDesc,
      icon: Truck,
      iconClass: "text-blue-700",
      chipClass: "bg-blue-100",
    },
    {
      title: t.features.premiumQuality,
      description: t.features.premiumQualityDesc,
      icon: Sparkles,
      iconClass: "text-violet-700",
      chipClass: "bg-violet-100",
    },
    {
      title: t.features.crueltyFree,
      description: t.features.crueltyFreeDesc,
      icon: Heart,
      iconClass: "text-red-700",
      chipClass: "bg-red-100",
    },
    {
      title: t.features.securePayment,
      description: t.features.securePaymentDesc,
      icon: Shield,
      iconClass: "text-green-700",
      chipClass: "bg-green-100",
    },
  ];

  return (
    <section className="border-b border-zinc-200 bg-white py-4">
      <div className="mx-auto grid max-w-6xl gap-0 px-4 sm:grid-cols-2 md:grid-cols-4">
        {featureItems.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className={`flex items-center gap-3 px-4 py-4 transition hover:bg-zinc-50 ${idx < featureItems.length - 1 ? "md:border-r md:border-zinc-200" : ""}`}
            >
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${feature.chipClass}`}>
                <Icon size={20} className={feature.iconClass} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">{feature.title}</p>
                <p className="text-xs text-zinc-500">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import Image from "next/image";
import { Tag, Truck } from "lucide-react";

import { heroContent, heroStats } from "./data";

export function Hero() {
  return (
    <section className="bg-white border-b border-zinc-200">
      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 items-stretch gap-0 md:min-h-72 lg:min-h-80">
        {/* Right Image Section - Shows First on Mobile */}
        <div className="relative order-first md:order-last bg-gradient-to-br from-rose-100 via-rose-50 to-pink-50 flex items-center justify-center overflow-hidden min-h-64 md:min-h-auto">
          {/* Floating Label - Top Right */}
          <div className="absolute top-4 right-4 bg-white rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-lg z-10">
            <span className="text-primary text-xs font-semibold">★</span>
            <span className="text-[10px] font-semibold text-zinc-900">{heroContent.offerText}</span>
          </div>

          {/* Hero Image - Full Coverage */}
          <div className="relative w-full h-full">
            <Image
              src={heroContent.heroImage}
              alt={heroContent.heroImageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center"
              priority
            />
          </div>

          {/* In Stock Badge - Bottom Left */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-lg z-10">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" fill="#4CAF50" />
            </svg>
            <span className="text-[10px] font-semibold text-zinc-900">In Stock · Ships in 24h</span>
          </div>
        </div>

        {/* Left Content */}
        <div className="flex flex-col px-4 md:px-8 py-8 md:pt-6 md:pb-0 order-last md:order-first">
          {/* Badges */}
          <div className="flex gap-2 mb-4">
            <span className="bg-zinc-900 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-widest uppercase">
              {heroContent.badgeNew}
            </span>
            <span className="bg-rose-100 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full tracking-widest uppercase">
              {heroContent.badgeOffer}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-light leading-tight mb-1">
            Spring Beauty<br />
            <em className="text-primary not-italic font-semibold">Collection</em><br />
            <span className="text-lg font-light text-zinc-500">2026</span>
          </h1>

          {/* Description */}
          <p className="text-zinc-600 text-sm leading-relaxed max-w-md mb-4">
            {heroContent.description}
          </p>

          {/* Stats */}
          <div className="flex gap-5 mb-5">
            {heroStats.map((item) => (
              <div key={item.label}>
                <p className="text-primary text-xl font-semibold leading-none mb-0.5">{item.value}</p>
                <p className="text-xs text-zinc-500 tracking-wide uppercase">{item.label}</p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button className="bg-primary text-white px-5 py-2 rounded-full font-medium text-xs md:text-sm transition hover:bg-primary/90 shadow-[0_4px_16px_rgba(232,54,106,0.2)]">
              {heroContent.primaryCTA}
            </button>
            <button className="border-2 border-zinc-300 text-zinc-900 px-5 py-2 rounded-full font-medium text-xs md:text-sm transition hover:border-primary hover:text-primary">
              {heroContent.secondaryCTA}
            </button>
          </div>

          {/* Delivery Note */}
          <div className="flex items-center gap-2 text-xs text-green-700 font-medium">
            <Truck size={14} />
            {heroContent.deliveryNote}
          </div>
        </div>
      </div>
    </section>
  );
}

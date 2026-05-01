'use client';

import Image from "next/image";
import Link from "next/link";
import { Truck, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

import { heroContent } from "./data";
import { useHomepageStats, useSliders, useSiteSettings } from "@/modules/homepage";
import { useActivePromotion } from "@/modules/promotions";
import { useHomepageLocale } from "../locales/HomepageLocaleContext";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const statPop = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.5 + i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

/**
 * Parses a stat value string like "10K+", "৳999+", "48hr" into
 * { prefix, number, suffix } so we can animate just the numeric part.
 */
function parseStatValue(value: string): { prefix: string; num: number; suffix: string } {
  // Match: optional non-digit prefix, digits (with optional decimal), optional remaining suffix
  const match = value.match(/^([^\d]*?)([\d]+(?:\.[\d]+)?)(.*)$/);
  if (!match) return { prefix: "", num: 0, suffix: value };
  return {
    prefix: match[1],
    num: parseFloat(match[2]),
    suffix: match[3],
  };
}

function useCountUp(target: number, duration: number, isActive: boolean) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || target <= 0) {
      if (target <= 0) setCount(0);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * target);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, target, duration]);

  return count;
}

function AnimatedStat({ value, isLoading }: { value: string; isLoading: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const { prefix, num, suffix } = parseStatValue(value);
  const animatedNum = useCountUp(num, 1800, isInView && !isLoading);

  // Determine if the original number was an integer
  const isInteger = Number.isInteger(num);
  const displayNum = isInteger ? Math.round(animatedNum) : animatedNum.toFixed(1);

  if (isLoading) {
    return <span className="inline-block animate-pulse bg-zinc-200 h-8 w-16 rounded" />;
  }

  return (
    <span ref={ref}>
      {prefix}
      {displayNum}
      {suffix}
    </span>
  );
}

export function Hero() {
  const { data: settings } = useSiteSettings();
  const { data: stats, isLoading } = useHomepageStats();
  const { data: sliders = [], isLoading: slidersLoading } = useSliders();
  const { data: activePromotion } = useActivePromotion();
  const { t } = useHomepageLocale();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (sliders.length === 0) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [sliders.length]);

  const displayStats = stats
    ? [
        { value: `${(stats.totalHappyCustomers / 1000).toFixed(0)}K+`, label: t.hero.happyCustomers },
        ...(stats.isFreeDeliveryActive
          ? [{ value: `৳${stats.minFreeDeliveryAmount}+`, label: t.hero.freeDelivery }]
          : []),
        { value: stats.deliveryTimeframe, label: t.hero.deliveryBD },
      ]
    : [
        { value: "10K+", label: t.hero.happyCustomers },
        { value: "৳999+", label: t.hero.freeDelivery },
        { value: "48hr", label: t.hero.deliveryBD },
      ];

  const isOfferActive = !!activePromotion;
  const currentSliderImage = sliders[currentSlide] || null;
  const heroHeadline = settings?.heroHeadline || "Spring Beauty";
  const heroYear = settings?.heroYear || "2026";

  const handlePrevSlide = () => {
    if (sliders.length > 0) {
      setDirection(-1);
      setCurrentSlide((prev) => (prev - 1 + sliders.length) % sliders.length);
    }
  };

  const handleNextSlide = () => {
    if (sliders.length > 0) {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <section className="relative bg-white overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-rose-100/40 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-pink-50/60 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1400px] flex flex-col lg:grid lg:grid-cols-2 items-stretch gap-0 h-[calc(100vh-140px)]">
        {/* Left Content */}
        <motion.div
          className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-4 lg:py-8 order-last lg:order-first"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Badges */}
          <motion.div className="flex flex-wrap gap-2 mb-4" custom={0} variants={fadeUp}>
            <span className="bg-zinc-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-full tracking-widest uppercase">
              {t.hero.badgeNew}
            </span>
            {isOfferActive && (
              <span className="bg-rose-100 text-primary text-[10px] font-bold px-3 py-1.5 rounded-full tracking-widest uppercase">
                {t.hero.upTo} {activePromotion?.pct ?? 40}% {t.hero.off}
              </span>
            )}
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.1] mb-2"
            custom={1}
            variants={fadeUp}
          >
            {heroHeadline.split(/\s+/).slice(0, 1).join(" ")}
            <br />
            <em className="text-primary not-italic font-semibold">
              {heroHeadline.split(/\s+/).slice(1).join(" ")}
            </em>
            <br />
            <span className="text-lg font-light text-zinc-400">{heroYear}</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-zinc-500 text-sm sm:text-base leading-relaxed max-w-lg mb-4"
            custom={2}
            variants={fadeUp}
          >
            {settings?.heroDescription || t.hero.description}
          </motion.p>

          {/* Stats */}
          <div className="flex gap-6 sm:gap-8 mb-5">
            {displayStats.map((item, i) => (
              <motion.div key={item.label} custom={i} variants={statPop} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <p className="text-primary text-xl sm:text-2xl font-bold leading-none mb-1">
                  <AnimatedStat value={item.value} isLoading={isLoading} />
                </p>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 tracking-wider uppercase font-medium">
                  {item.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <motion.div className="flex flex-wrap gap-3 mb-4" custom={3} variants={fadeUp}>
            <Link
              href="/categories"
              className="bg-primary text-white px-7 py-3 rounded-full font-semibold text-sm transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_8px_30px_rgba(240,17,114,0.3)] hover:-translate-y-0.5 active:translate-y-0"
            >
              {t.hero.shopNow}
            </Link>
            <Link
              href="/shop"
              className="border-2 border-zinc-200 text-zinc-700 px-7 py-3 rounded-full font-semibold text-sm transition-all duration-300 hover:border-primary hover:text-primary hover:-translate-y-0.5 active:translate-y-0"
            >
              {t.hero.viewAllProducts}
            </Link>
          </motion.div>

          {/* Delivery Note */}
          {stats?.isFreeDeliveryActive && (
            <motion.div
              className="flex items-center gap-2 text-xs text-green-700 font-medium"
              custom={4}
              variants={fadeUp}
            >
              <Truck size={14} />
              {t.hero.deliveryNote}
            </motion.div>
          )}
        </motion.div>

        {/* Right Image Section - Slider */}
        <div className="relative order-first lg:order-last bg-gradient-to-br from-rose-100 via-rose-50 to-pink-50 flex items-center justify-center overflow-hidden h-[45vh] lg:h-auto">
          {/* Offer Badge */}
          {isOfferActive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg z-20"
            >
              <span className="text-primary text-xs font-semibold">
                ★ {activePromotion?.pct}% {t.hero.off}
              </span>
              <span className="text-[10px] font-semibold text-zinc-900">
                {activePromotion?.banner}
                {activePromotion?.endsAt ? ` · ${t.hero.ends} ${activePromotion.endsAt}` : ""}
              </span>
            </motion.div>
          )}

          {/* Slider */}
          {slidersLoading ? (
            <div className="relative w-full h-full bg-gradient-to-br from-rose-100 via-rose-50 to-pink-50 animate-pulse">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-white/40" />
                <div className="h-3 w-32 bg-white/40 rounded-full" />
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-white/30" />
                ))}
              </div>
            </div>
          ) : sliders.length > 0 ? (
            <>
              <div className="relative w-full h-full">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.div
                    key={currentSlide}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={sliders[currentSlide].imageUrl}
                      alt={sliders[currentSlide].imageAlt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover object-center"
                      priority={currentSlide === 0}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Nav Buttons */}
              <button
                onClick={handlePrevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full p-2.5 transition-all z-30 shadow-lg cursor-pointer hover:shadow-xl hover:scale-105"
                aria-label={t.hero.previousSlide}
              >
                <ChevronLeft size={20} className="text-zinc-900" />
              </button>
              <button
                onClick={handleNextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full p-2.5 transition-all z-30 shadow-lg cursor-pointer hover:shadow-xl hover:scale-105"
                aria-label={t.hero.nextSlide}
              >
                <ChevronRight size={20} className="text-zinc-900" />
              </button>

              {/* Indicators */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                {sliders.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentSlide ? 1 : -1);
                      setCurrentSlide(index);
                    }}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${
                      index === currentSlide
                        ? "bg-primary w-7 h-2.5"
                        : "bg-white/50 hover:bg-white/75 w-2.5 h-2.5"
                    }`}
                    aria-label={`${t.hero.goToSlide} ${index + 1}`}
                  />
                ))}
              </div>

              {/* Slide Overlay */}
              {currentSliderImage &&
                (currentSliderImage.title || currentSliderImage.description) && (
                  <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent px-6 pt-6 pb-16 z-20 flex flex-col justify-end min-h-40">
                    {currentSliderImage.title && (
                      <h2 className="text-white text-xl md:text-2xl font-bold mb-1">
                        {currentSliderImage.title}
                      </h2>
                    )}
                    {currentSliderImage.description && (
                      <p className="text-white/90 text-xs md:text-sm mb-3 line-clamp-2">
                        {currentSliderImage.description}
                      </p>
                    )}
                    {currentSliderImage.buttonText && (
                      <a
                        href={currentSliderImage.buttonLink || "#"}
                        className="inline-block bg-primary text-white px-5 py-2.5 rounded-full text-xs md:text-sm font-medium transition hover:bg-primary/90 w-fit"
                      >
                        {currentSliderImage.buttonText}
                      </a>
                    )}
                  </div>
                )}
            </>
          ) : (
            <div className="relative w-full h-full">
              <Image
                src={heroContent.heroImage}
                alt={t.hero.heroImageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
                priority
              />
            </div>
          )}

          {/* In Stock Badge */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-6 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg z-30"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" fill="#4CAF50" />
            </svg>
            <span className="text-[10px] font-semibold text-zinc-900">{t.hero.inStock}</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

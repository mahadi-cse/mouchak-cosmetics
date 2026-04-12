'use client';

import Image from "next/image";
import { Truck, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

import { heroContent } from "./data";
import { useHomepageStats, useSliders, useSiteSettings } from "@/modules/homepage";

export function Hero() {
  const { data: settings } = useSiteSettings();
  const { data: stats, isLoading } = useHomepageStats();
  const { data: sliders = [], isLoading: slidersLoading } = useSliders();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate slider every 5 seconds
  useEffect(() => {
    if (sliders.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [sliders.length]);

  // Use dynamic stats if available, otherwise use default
  const displayStats = stats ? [
    { value: `${(stats.totalHappyCustomers / 1000).toFixed(0)}K+`, label: "Happy Customers" },
    ...(stats.isFreeDeliveryActive ? [{ value: `৳${stats.minFreeDeliveryAmount}+`, label: "Free Delivery" }] : []),
    { value: stats.deliveryTimeframe, label: "Delivery BD" },
  ] : [
    { value: "10K+", label: "Happy Customers" },
    { value: "৳999+", label: "Free Delivery" },
    { value: "48hr", label: "Delivery BD" },
  ];

  const offerText = (stats?.isOfferActive) ? stats?.currentOfferText : "No Active Offer";
  const currentSliderImage = sliders[currentSlide] || null;
  const heroHeadline = settings?.heroHeadline || "Spring Beauty";
  const heroYear = settings?.heroYear || "2026";

  const handlePrevSlide = () => {
    if (sliders.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + sliders.length) % sliders.length);
    }
  };

  const handleNextSlide = () => {
    if (sliders.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
    }
  };

  return (
    <section className="bg-white border-b border-zinc-200">
      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 items-stretch gap-0 md:min-h-72 lg:min-h-80">
        {/* Right Image Section - Slider */}
        <div className="relative order-first md:order-last bg-gradient-to-br from-rose-100 via-rose-50 to-pink-50 flex items-center justify-center overflow-hidden min-h-64 md:min-h-auto group">
          {/* Floating Label - Top Right */}
          {stats?.isOfferActive && (
            <div className="absolute top-4 right-4 bg-white rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-lg z-20">
              <span className="text-primary text-xs font-semibold">★</span>
              <span className="text-[10px] font-semibold text-zinc-900">{offerText}</span>
            </div>
          )}

          {/* Slider Container */}
          {sliders.length > 0 ? (
            <>
              {/* Slider Images */}
              <div className="relative w-full h-full">
                {sliders.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <Image
                      src={slide.imageUrl}
                      alt={slide.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover object-center"
                      priority={index === currentSlide}
                    />
                  </div>
                ))}
              </div>

              {/* Previous Button */}
              <button
                onClick={handlePrevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition z-30 shadow-lg cursor-pointer hover:shadow-xl"
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} className="text-zinc-900" />
              </button>

              {/* Next Button */}
              <button
                onClick={handleNextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition z-30 shadow-lg cursor-pointer hover:shadow-xl"
                aria-label="Next slide"
              >
                <ChevronRight size={20} className="text-zinc-900" />
              </button>

              {/* Slide Indicators */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                {sliders.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => sliders.length > 0 && setCurrentSlide(index)}
                    className={`rounded-full transition cursor-pointer ${
                      index === currentSlide ? "bg-primary w-6 h-2" : "bg-white/50 hover:bg-white/75 w-2 h-2"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Slide Title & Description Overlay - Fixed positioning */}
              {currentSliderImage && (currentSliderImage.title || currentSliderImage.description) && (
                <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent px-6 pt-6 pb-16 z-20 flex flex-col justify-end min-h-40">
                  {currentSliderImage.title && (
                    <h2 className="text-white text-xl md:text-2xl font-bold mb-1">{currentSliderImage.title}</h2>
                  )}
                  {currentSliderImage.description && (
                    <p className="text-white/90 text-xs md:text-sm mb-3 line-clamp-2">{currentSliderImage.description}</p>
                  )}
                  {currentSliderImage.buttonText && (
                    <a
                      href={currentSliderImage.buttonLink || "#"}
                      className="inline-block bg-primary text-white px-4 py-2 rounded-full text-xs md:text-sm font-medium transition hover:bg-primary/90 w-fit whitespace-nowrap"
                    >
                      {currentSliderImage.buttonText}
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            // Fallback to static image if no sliders available
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
          )}

          {/* In Stock Badge - Bottom Left */}
          <div className="absolute bottom-6 right-4 bg-white rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-lg z-30">
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
            {stats?.isOfferActive && (
              <span className="bg-rose-100 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full tracking-widest uppercase">
                {heroContent.badgeOffer}
              </span>
            )}
          </div>

          {/* Title - Dynamic from database */}
          <h1 className="text-3xl md:text-4xl font-light leading-tight mb-1">
            {heroHeadline.split(/\s+/).slice(0, 1).join(' ')}<br />
            <em className="text-primary not-italic font-semibold">{heroHeadline.split(/\s+/).slice(1).join(' ')}</em><br />
            <span className="text-lg font-light text-zinc-500">{heroYear}</span>
          </h1>

          {/* Description */}
          <p className="text-zinc-600 text-sm leading-relaxed max-w-md mb-4">
            {settings?.heroDescription || heroContent.description}
          </p>

          {/* Stats */}
          <div className="flex gap-5 mb-5">
            {displayStats.map((item) => (
              <div key={item.label}>
                <p className={`text-primary text-xl font-semibold leading-none mb-0.5 ${isLoading ? 'animate-pulse bg-zinc-200 h-6 w-16 rounded' : ''}`}>
                  {item.value}
                </p>
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
          {stats?.isFreeDeliveryActive && (
            <div className="flex items-center gap-2 text-xs text-green-700 font-medium">
              <Truck size={14} />
              {heroContent.deliveryNote}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import { Heart, Search, ShoppingCart, User, MapPin, Mail, Phone } from "lucide-react";

import { productCategories } from "./data";
import { useHomepageCategories, useHomepageStats, useSiteSettings } from "@/modules/homepage";

export function Header() {
  const { data: categories = [] } = useHomepageCategories();
  const { data: settings } = useSiteSettings();
  const { data: stats } = useHomepageStats();

  const storeName = settings?.storeName || "Mouchak Cosmetics";
  const [storeNameFirst, ...storeNameRest] = storeName.split(/\s+/).filter(Boolean);
  const storeNameRestText = storeNameRest.join(" ");
  const tagline = settings?.tagline || "Clean · Cruelty-Free · Bangladesh";

  const navCategories = categories.length
    ? categories.slice(0, 4).map((c) => ({
        key: c.slug,
        label: c.name,
        href: `/shop?category=${c.slug}`,
      }))
    : productCategories.map((name) => ({
        key: name,
        label: name,
        href: "#",
      }));

  return (
    <header className="sticky top-0 z-40 bg-white">
      {/* Top Bar - Dark background info strip */}
      <div className="hidden md:block bg-zinc-900 text-zinc-400 text-xs tracking-widest border-b border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-2 flex gap-6">
          <span className="flex items-center gap-2">
            <MapPin size={12} /> Delivery across all of Bangladesh
          </span>
          <span className="flex items-center gap-2">
            <Mail size={12} /> support@mouchak.com.bd
          </span>
          <span className="flex items-center gap-2">
            <Phone size={12} /> 01700-000000
          </span>
          <div className="ml-auto flex gap-4">
            {stats?.isOfferActive && stats?.currentOfferText && (
              <span className="bg-primary text-white px-3 py-1 rounded-full text-[10px] font-semibold">
                ✦ {stats.currentOfferText}
              </span>
            )}
            <a href="#" className="hover:text-white transition">Track Order</a>
            <a href="#" className="hover:text-white transition">Store Locator</a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="border-b border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          {/* Brand Logo - Serif font */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold tracking-tight">
              {storeNameFirst || "Mouchak"}{" "}
              <span className="text-primary italic">{storeNameRestText || "Cosmetics"}</span>
            </h1>
            <p className="text-xs tracking-widest text-zinc-500 uppercase">{tagline}</p>
          </div>

          {/* Search Bar - Center */}
          <div className="hidden lg:flex flex-1 justify-center px-12">
            <div className="flex w-full max-w-sm overflow-hidden rounded-full border border-zinc-300 bg-zinc-50 transition focus-within:border-primary">
              <input
                placeholder="Search skincare, lipstick, perfume…"
                className="w-full bg-transparent px-5 py-2.5 text-sm outline-none placeholder-zinc-500"
              />
              <button className="px-4 text-zinc-600 transition hover:text-primary" aria-label="Search">
                <Search size={16} />
              </button>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Wishlist */}
            <button className="relative p-2 rounded-lg transition hover:bg-rose-50 text-zinc-700 hover:text-primary" aria-label="Wishlist">
              <Heart size={18} />
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">3</span>
            </button>

            {/* Cart */}
            <button className="relative p-2 rounded-lg transition hover:bg-rose-50 text-zinc-700 hover:text-primary" aria-label="Cart">
              <ShoppingCart size={18} />
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">2</span>
            </button>

            {/* Sign In Button */}
            <button className="hidden sm:flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full font-medium text-sm transition hover:bg-primary/90">
              <User size={16} />
              Sign In
            </button>

            {/* Mobile Account Icon */}
            <button className="sm:hidden p-2 rounded-lg transition hover:bg-rose-50 text-zinc-700 hover:text-primary" aria-label="Account">
              <User size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <nav className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between md:justify-start gap-1 py-2 md:py-0">
          {/* Categories - Hidden on Mobile, Shown on Desktop */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {navCategories.map((cat) => (
              <a
                key={cat.key}
                href={cat.href}
                className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-600 whitespace-nowrap transition hover:text-primary"
              >
                <span className="w-1 h-1 rounded-full bg-current opacity-40"></span>
                {cat.label}
              </a>
            ))}
            {/* Sale Link */}
            <a href="/shop" className="flex items-center gap-2 px-4 py-3 text-sm text-primary font-medium whitespace-nowrap">
              <span className="w-1 h-1 rounded-full bg-current"></span>
              Sale
            </a>
          </div>

          {/* Mobile Categories - Compact */}
          <div className="md:hidden flex items-center gap-2 text-xs overflow-x-auto [&::-webkit-scrollbar]:hidden flex-1">
            {navCategories.slice(0, 2).map((cat) => (
              <a
                key={cat.key}
                href={cat.href}
                className="text-zinc-600 whitespace-nowrap transition hover:text-primary"
              >
                {cat.label}
              </a>
            ))}
            <a href="/shop" className="text-primary font-medium whitespace-nowrap">Sale</a>
          </div>
          
          {/* Free Delivery Badge - Prominent on Mobile */}
          <div className="flex items-center gap-1 ml-auto md:ml-auto">
            {(stats?.isFreeDeliveryActive ?? true) && (
              <>
                <span className="bg-rose-100 text-primary px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap">FREE DELIVERY</span>
                <span className="hidden sm:inline text-[10px] text-zinc-600 whitespace-nowrap">
                  orders over ৳{stats?.minFreeDeliveryAmount ?? 999}
                </span>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

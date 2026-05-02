"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Search, ShoppingCart, User, MapPin, Mail, Phone } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect, useRef, type FormEvent } from "react";

import { useHomepageCategories, useHomepageStats, useSiteSettings, useSearchProducts } from "@/modules/homepage";
import { useCart } from "@/shared/contexts/CartContext";
import { useWishlist } from "@/shared/contexts/WishlistContext";
import { useActivePromotion } from "@/modules/promotions";
import { useHomepageLocale } from "../locales/HomepageLocaleContext";
import { LanguageToggle } from "./LanguageToggle";
import Image from "next/image";

export function Header() {
  const router = useRouter();
  const { data: categories = [] } = useHomepageCategories();
  const { data: settings } = useSiteSettings();
  const { data: stats } = useHomepageStats();
  const { data: activePromotion } = useActivePromotion();
  const { status } = useSession();
  const { totalItems: cartCount, setIsOpen: setCartOpen } = useCart();
  const { count: wishlistCount, setIsOpen: setWishlistOpen } = useWishlist();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: searchResults, isLoading: isSearching } = useSearchProducts(debouncedSearchTerm, 5);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { t } = useHomepageLocale();
  const storeName = settings?.storeName || "Mouchak Cosmetics";
  const [storeNameFirst, ...storeNameRest] = storeName.split(/\s+/).filter(Boolean);
  const storeNameRestText = storeNameRest.join(" ");
  const tagline = settings?.tagline || t.header.taglineFallback;

  const navCategories = categories.length
    ? categories.slice(0, 4).map((c) => ({
      key: c.slug,
      label: c.name,
      href: `/categories/${c.slug}`,
    }))
    : t.header.productCategories.map((name) => ({
      key: name,
      label: name,
      href: "#",
    }));

  const isAuthenticated = status === "authenticated";
  const canAccessDashboard = isAuthenticated;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();

    if (!trimmed) {
      router.push('/shop');
      return;
    }

    router.push(`/shop?search=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="bg-white">
      {/* Top Bar - Dark background info strip */}
      <div className="hidden md:block bg-zinc-900 text-zinc-400 text-xs tracking-widest border-b border-zinc-800">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10 py-2 flex gap-6">
          <span className="flex items-center gap-2">
            <MapPin size={12} /> {t.header.deliveryBanner}
          </span>
          <span className="flex items-center gap-2">
            <Mail size={12} /> support@mouchak.com.bd
          </span>
          <span className="flex items-center gap-2">
            <Phone size={12} /> 01700-000000
          </span>
          <div className="ml-auto flex gap-4">
            {activePromotion && (
              <span className="bg-primary text-white px-3 py-1 rounded-full text-[10px] font-semibold">
                ✦ {activePromotion.pct}% {t.header.off} · {activePromotion.banner}{activePromotion.endsAt ? ` · ${t.header.ends} ${activePromotion.endsAt}` : ''}
              </span>
            )}
            <a href="#" className="hover:text-white transition">{t.header.trackOrder}</a>
            <a href="#" className="hover:text-white transition">{t.header.storeLocator}</a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="border-b border-zinc-200">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10 py-4 flex items-center justify-between">
          {/* Brand Logo - Serif font */}
          <Link href="/" className="flex-shrink-0 no-underline text-inherit hover:opacity-90 transition-opacity">
            <h1 className="text-2xl font-bold tracking-tight">
              {storeNameFirst || "Mouchak"}{" "}
              <span className="text-primary italic">{storeNameRestText || "Cosmetics"}</span>
            </h1>
            <p className="text-xs tracking-widest text-zinc-500 uppercase">{tagline}</p>
          </Link>

          {/* Search Bar - Center */}
          <div className="hidden lg:flex flex-1 justify-center px-12 relative" ref={searchContainerRef}>
            <div className="w-full max-w-sm relative">
              <form
                onSubmit={handleSearchSubmit}
                className="flex w-full overflow-hidden rounded-full border border-zinc-300 bg-zinc-50 transition focus-within:border-primary"
              >
                <input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder={t.header.searchPlaceholder}
                  className="w-full bg-transparent px-5 py-2.5 text-sm outline-none placeholder-zinc-500"
                />
                <button type="submit" className="px-4 text-zinc-600 transition hover:text-primary" aria-label={t.header.ariaSearch}>
                  <Search size={16} />
                </button>
              </form>

              {/* Search Results Dropdown */}
              {isSearchOpen && searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-zinc-500">{t.header.searching}</div>
                  ) : searchResults && searchResults.length > 0 ? (
                    <div className="flex flex-col">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center gap-3 p-3 hover:bg-zinc-50 transition border-b border-zinc-100 last:border-0"
                        >
                          <div className="h-10 w-10 flex-shrink-0 bg-zinc-100 rounded-md overflow-hidden relative">
                            {product.images && product.images.length > 0 && product.images[0] ? (
                              <Image src={typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as any).url} alt={product.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                <Search size={14} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 truncate">{product.name}</p>
                            <p className="text-xs text-zinc-500">৳{product.price}</p>
                          </div>
                        </Link>
                      ))}
                      <Link
                        href={`/shop?search=${encodeURIComponent(searchTerm)}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="p-3 text-center text-sm text-primary font-medium bg-rose-50 hover:bg-rose-100 transition"
                      >
                        {t.header.viewAllResults}
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-zinc-500">{t.header.noResults} &quot;{searchTerm}&quot;</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <LanguageToggle />

            {/* Wishlist */}
            <button 
              onClick={() => setWishlistOpen(true)}
              className="relative p-2 rounded-lg transition hover:bg-rose-50 text-zinc-700 hover:text-primary" 
              aria-label={t.header.ariaWishlist}
            >
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button 
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-lg transition hover:bg-rose-50 text-zinc-700 hover:text-primary" 
              aria-label={t.header.ariaCart}
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <>
                {canAccessDashboard && (
                  <Link
                    href="/dashboard"
                    className="hidden sm:inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-primary hover:text-primary"
                  >
                    {t.header.dashboard}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="hidden sm:flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-full font-medium text-sm transition hover:bg-zinc-800"
                >
                  <User size={16} />
                  {t.header.signOut}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="sm:hidden p-2 rounded-lg transition hover:bg-rose-50 text-zinc-700 hover:text-primary"
                  aria-label={t.header.ariaSignOut}
                >
                  <User size={18} />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full font-medium text-sm transition hover:bg-primary/90"
                >
                  <User size={16} />
                  {t.header.signIn}
                </Link>
                <Link
                  href="/login"
                  className="sm:hidden p-2 rounded-lg transition hover:bg-rose-50 text-zinc-700 hover:text-primary"
                  aria-label={t.header.ariaAccount}
                >
                  <User size={18} />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <nav className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10 flex items-center justify-between md:justify-start gap-1 py-2 md:py-0">
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
            <a href="/products" className="flex items-center gap-2 px-4 py-3 text-sm text-primary font-medium whitespace-nowrap">
              <span className="w-1 h-1 rounded-full bg-current"></span>
              {t.header.sale}
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
            <a href="/products" className="text-primary font-medium whitespace-nowrap">{t.header.sale}</a>
          </div>

          {/* Free Delivery Badge - Prominent on Mobile */}
          <div className="flex items-center gap-1 ml-auto md:ml-auto">
            {(stats?.isFreeDeliveryActive ?? true) && (
              <>
                <span className="bg-rose-100 text-primary px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap">{t.header.freeDelivery}</span>
                <span className="hidden sm:inline text-[10px] text-zinc-600 whitespace-nowrap">
                  {t.header.ordersOver} ৳{stats?.minFreeDeliveryAmount ?? 999}
                </span>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

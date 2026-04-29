'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHomepageFeaturedProducts, useHomepageCategories } from '@/modules/homepage';
import { useWishlist } from '@/shared/contexts/WishlistContext';
import { useCart } from '@/shared/contexts/CartContext';
import { CategoryCard } from './CategoryCard';
import { useHomepageLocale } from '../locales/HomepageLocaleContext';
import type { Category, Product } from '@/shared/types';

const PRODUCT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&q=80';

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  skincare: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=900&q=80',
  makeup: 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=900&q=80',
  haircare: 'https://images.unsplash.com/photo-1527799820374-87f7caad78ef?w=900&q=80',
  fragrance: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=900&q=80',
  default: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&q=80',
};

function normalizeImage(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return trimmed;
}

function getCategoryFallbackImage(slug?: string, name?: string): string {
  const key = (slug || name || '').toLowerCase();
  if (key.includes('skin')) return CATEGORY_FALLBACK_IMAGES.skincare;
  if (key.includes('make')) return CATEGORY_FALLBACK_IMAGES.makeup;
  if (key.includes('hair')) return CATEGORY_FALLBACK_IMAGES.haircare;
  if (key.includes('frag') || key.includes('perfume') || key.includes('scent'))
    return CATEGORY_FALLBACK_IMAGES.fragrance;
  return CATEGORY_FALLBACK_IMAGES.default;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} width="11" height="11" viewBox="0 0 12 12" fill="none">
          <polygon
            points="6,1 7.5,4.5 11,5 8.5,7.5 9.2,11 6,9.2 2.8,11 3.5,7.5 1,5 4.5,4.5"
            fill={
              star <= Math.floor(rating)
                ? '#e91e8c'
                : star - 0.5 <= rating
                  ? '#e91e8c'
                  : '#e0e0e0'
            }
            opacity={
              star <= Math.floor(rating) ? 1 : star - 0.5 <= rating ? 0.55 : 1
            }
          />
        </svg>
      ))}
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

function EnhancedProductCard({ product, index }: { product: Product; index: number }) {
  const [hovered, setHovered] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart, setIsOpen: openCart } = useCart();
  const { t } = useHomepageLocale();
  const [imageSrc, setImageSrc] = useState(
    normalizeImage(product.images?.[0]) || PRODUCT_FALLBACK_IMAGE
  );

  const discount = product.compareAtPrice
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
      )
    : null;
  const savingsAmount = product.compareAtPrice
    ? Math.round(product.compareAtPrice - product.price)
    : 0;

  const category = product.category?.name || t.featuredProducts.products;
  const rating = 4.5;
  const reviews = 0;
  const inWishlist = isInWishlist(String(product.id));

  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
      <Link href={`/product/${product.slug}`} className="block">
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative overflow-hidden rounded-2xl bg-white transition-all duration-300 cursor-pointer group"
          style={{
            border: `1.5px solid ${hovered ? '#f01172' : '#f5e6ed'}`,
            transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
            boxShadow: hovered
              ? '0 20px 40px rgba(240,17,114,0.12), 0 8px 16px rgba(0,0,0,0.04)'
              : '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          {/* Image */}
          <div className="relative overflow-hidden bg-gradient-to-b from-pink-50 to-rose-50 h-52">
            <Image
              src={imageSrc}
              alt={product.name}
              width={400}
              height={260}
              className="w-full h-full object-cover transition-transform duration-500"
              onError={() => {
                if (imageSrc !== PRODUCT_FALLBACK_IMAGE) setImageSrc(PRODUCT_FALLBACK_IMAGE);
              }}
              style={{ transform: hovered ? 'scale(1.08)' : 'scale(1)' }}
            />

            {discount && (
              <div className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white tracking-wide">
                -{discount}%
              </div>
            )}

            <div className="absolute right-11 top-3 rounded-full border border-pink-200 bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-pink-700 tracking-wide">
              {t.featuredProducts.bestSeller}
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (inWishlist) {
                  removeFromWishlist(String(product.id));
                } else {
                  addToWishlist({
                    id: String(product.id),
                    name: product.name,
                    price: product.price,
                    image: product.images?.[0],
                    slug: product.slug,
                  });
                }
              }}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
              style={{
                background: inWishlist ? '#f01172' : 'rgba(255,255,255,0.95)',
                border: `1.5px solid ${inWishlist ? '#f01172' : '#f3c8dc'}`,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Heart
                size={14}
                fill={inWishlist ? 'white' : 'none'}
                stroke={inWishlist ? 'white' : '#f01172'}
                strokeWidth={2}
              />
            </button>

            {/* Quick add overlay */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart({
                  id: String(product.id),
                  name: product.name,
                  price: product.price,
                  image: product.images?.[0],
                  slug: product.slug,
                });
                openCart(true);
              }}
              className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-3 text-xs font-bold uppercase text-white transition-transform duration-300 backdrop-blur-sm"
              style={{
                background: 'rgba(240,17,114,0.92)',
                letterSpacing: '1.5px',
                transform: hovered ? 'translateY(0)' : 'translateY(100%)',
              }}
            >
              {t.featuredProducts.addToCart}
            </button>
          </div>

          {/* Body */}
          <div className="space-y-2 p-4">
            <span className="inline-block rounded-full bg-pink-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-pink-600 tracking-wider">
              {category}
            </span>

            <h3 className="line-clamp-2 text-[13px] font-semibold text-zinc-900 leading-snug">
              {product.name}
            </h3>

            <div className="flex items-center gap-1.5">
              <StarRating rating={rating} />
              <span className="text-[10px] text-zinc-400">({reviews})</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-primary">
                  ৳{Math.round(product.price).toLocaleString()}
                </span>
                {product.compareAtPrice && (
                  <span className="text-xs text-zinc-400 line-through">
                    ৳{Math.round(product.compareAtPrice).toLocaleString()}
                  </span>
                )}
              </div>
              {discount && (
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                  {t.featuredProducts.save} ৳{savingsAmount.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const sectionHeaderVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function FeaturedProducts() {
  const { t } = useHomepageLocale();
  const [activeFilter, setActiveFilter] = useState<string>(t.featuredProducts.all);
  const { data: products = [], isLoading, error } = useHomepageFeaturedProducts(12);
  const { data: categories = [], isLoading: categoriesLoading } = useHomepageCategories();

  const activeCategories = useMemo(
    () =>
      [...categories]
        .filter((c: Category) => c.isActive)
        .sort((a: Category, b: Category) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const filterOptions = useMemo(() => {
    const byDb = activeCategories.map((c: Category) => c.name).filter(Boolean);
    return byDb.length > 0 ? [t.featuredProducts.all, ...byDb] : [t.featuredProducts.all];
  }, [activeCategories, t]);

  const categoryProductCount = useMemo(() => {
    const map = new Map<number, number>();
    products.forEach((p: Product) => {
      map.set(p.categoryId, (map.get(p.categoryId) || 0) + 1);
    });
    return map;
  }, [products]);

  if (isLoading || categoriesLoading) {
    return (
      <section className="space-y-8 bg-zinc-50/50 py-14 lg:py-20">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <div className="mb-8">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <div className="mb-2 h-3 w-32 animate-pulse rounded bg-zinc-200" />
                <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
              </div>
              <div className="h-9 w-24 animate-pulse rounded-full bg-zinc-200" />
            </div>
            <div className="mb-6 flex gap-2 flex-wrap">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-zinc-200" />
              ))}
            </div>
            <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-zinc-200" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-zinc-50/50 py-14 lg:py-20">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-red-800">{t.featuredProducts.failedToLoad}</p>
          </div>
        </div>
      </section>
    );
  }

  const filtered =
    activeFilter === t.featuredProducts.all
      ? products
      : products.filter((p: Product) => p.category?.name === activeFilter);

  return (
    <section className="space-y-16 bg-zinc-50/50 py-14 lg:py-20">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        {/* ── FEATURED PRODUCTS ── */}
        <div>
          {/* Header */}
          <motion.div
            className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
            variants={sectionHeaderVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase text-primary tracking-[3px]">
                ◆ {t.featuredProducts.hotDeals}
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
                {t.featuredProducts.title}
              </h2>
            </div>
            <Link
              href="/shop"
              className="rounded-full border-2 border-primary px-6 py-2.5 text-sm font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-[0_4px_20px_rgba(240,17,114,0.25)] w-fit"
            >
              {t.featuredProducts.viewAll}
            </Link>
          </motion.div>

          {/* Filter pills */}
          <div className="mb-8 flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className="rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300"
                style={{
                  border: `1.5px solid ${activeFilter === filter ? '#f01172' : '#f0d0e0'}`,
                  background: activeFilter === filter ? '#f01172' : '#fff',
                  color: activeFilter === filter ? '#fff' : '#c2185b',
                  boxShadow:
                    activeFilter === filter
                      ? '0 4px 14px rgba(240,17,114,0.2)'
                      : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="mb-12 grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product: Product, i: number) => (
              <EnhancedProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          {/* Load more */}
          <div className="text-center">
            <Link
              href="/shop"
              className="inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-14 py-4 font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(240,17,114,0.3)]"
            >
              {t.featuredProducts.loadMore}
            </Link>
            <p className="mt-3 text-xs text-zinc-400">
              {t.featuredProducts.showing} {filtered.length} {t.featuredProducts.of}{' '}
              {products.length} {t.featuredProducts.products}
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        className="h-px mx-auto max-w-[1400px]"
        style={{
          background: 'linear-gradient(to right, transparent, #f3c8dc, transparent)',
        }}
      />

      {/* ── SHOP BY CATEGORY ── */}
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <div className="bg-white py-12 px-6 sm:px-10 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
          <motion.div
            className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
            variants={sectionHeaderVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase text-primary tracking-[3px]">
                ✦ {t.featuredProducts.explore}
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
                {t.featuredProducts.shopByCategory}
              </h2>
            </div>
            <Link
              href="/categories"
              className="rounded-full border-2 border-primary px-6 py-2.5 text-sm font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-[0_4px_20px_rgba(240,17,114,0.25)] w-fit"
            >
              {t.featuredProducts.allCategories}
            </Link>
          </motion.div>

          <div className="grid gap-5 grid-cols-2 sm:grid-cols-4">
            {activeCategories.slice(0, 4).map((cat: Category, i: number) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <CategoryCard
                  id={cat.slug}
                  label={cat.name}
                  description={cat.description || t.featuredProducts.exploreCollection}
                  count={`${categoryProductCount.get(cat.id) || 0} ${t.featuredProducts.products}`}
                  image={
                    normalizeImage(cat.imageUrl) ||
                    getCategoryFallbackImage(cat.slug, cat.name)
                  }
                  fallbackImage={getCategoryFallbackImage(cat.slug, cat.name)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

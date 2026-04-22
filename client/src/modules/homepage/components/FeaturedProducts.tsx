'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useHomepageFeaturedProducts, useHomepageCategories } from '@/modules/homepage';
import { useWishlist } from '@/shared/contexts/WishlistContext';
import { useCart } from '@/shared/contexts/CartContext';
import { CategoryCard } from './CategoryCard';
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
  if (key.includes('frag') || key.includes('perfume') || key.includes('scent')) return CATEGORY_FALLBACK_IMAGES.fragrance;
  return CATEGORY_FALLBACK_IMAGES.default;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} width="11" height="11" viewBox="0 0 12 12" fill="none">
          <polygon
            points="6,1 7.5,4.5 11,5 8.5,7.5 9.2,11 6,9.2 2.8,11 3.5,7.5 1,5 4.5,4.5"
            fill={star <= Math.floor(rating) ? '#e91e8c' : star - 0.5 <= rating ? '#e91e8c' : '#e0e0e0'}
            opacity={star <= Math.floor(rating) ? 1 : star - 0.5 <= rating ? 0.55 : 1}
          />
        </svg>
      ))}
    </div>
  );
}

function EnhancedProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart, setIsOpen: openCart } = useCart();
  const [imageSrc, setImageSrc] = useState(
    normalizeImage(product.images?.[0]) || PRODUCT_FALLBACK_IMAGE
  );

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;
  const savingsAmount = product.compareAtPrice ? Math.round(product.compareAtPrice - product.price) : 0;

  const category = product.category?.name || 'Products';
  const rating = 4.5;
  const reviews = 0;
  const inWishlist = isInWishlist(product.id);

  return (
    <Link href={`/product/${product.slug}`} className="block">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative overflow-hidden rounded-2xl border-1.5 bg-white transition-all duration-300 cursor-pointer"
        style={{
          borderColor: hovered ? '#e91e8c' : '#f3e0ea',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hovered
            ? '0 12px 32px rgba(233,30,140,0.13)'
            : '0 2px 8px rgba(233,30,140,0.04)',
        }}
      >
        {/* Image wrapper */}
        <div className="relative overflow-hidden bg-pink-50 h-48">
        <Image
          src={imageSrc}
          alt={product.name}
          width={300}
          height={200}
          className="w-full h-full object-cover transition-transform duration-300"
          onError={() => {
            if (imageSrc !== PRODUCT_FALLBACK_IMAGE) {
              setImageSrc(PRODUCT_FALLBACK_IMAGE);
            }
          }}
          style={{
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
          }}
        />

          {/* Discount badge */}
          {discount && (
            <div
              className="absolute left-3 top-3 rounded-full bg-pink-600 px-2 py-0.5 text-center text-xs font-bold text-white"
              style={{ letterSpacing: '0.5px' }}
            >
              -{discount}%
            </div>
          )}

          {/* Tag badge */}
          <div
            className="absolute right-11 top-3 rounded-full border border-pink-200 bg-white bg-opacity-95 px-2 py-0.5 text-center text-xs font-bold text-pink-700"
            style={{ letterSpacing: '0.5px' }}
          >
            Best Seller
          </div>

          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (inWishlist) {
                removeFromWishlist(product.id);
              } else {
                addToWishlist({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.images?.[0],
                  slug: product.slug,
                });
              }
            }}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200"
            style={{
              background: inWishlist ? '#e91e8c' : 'rgba(255,255,255,0.95)',
              borderColor: inWishlist ? '#e91e8c' : '#f3c8dc',
            }}
          >
            <Heart
              size={14}
              className="transition-all"
              fill={inWishlist ? 'white' : 'none'}
              stroke={inWishlist ? 'white' : '#e91e8c'}
              strokeWidth={2}
            />
          </button>

          {/* Quick add to cart overlay */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0],
                slug: product.slug,
              });
              openCart(true);
            }}
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-2.5 text-center text-xs font-bold uppercase text-white transition-transform duration-300"
            style={{
              background: 'rgba(233,30,140,0.93)',
              letterSpacing: '1px',
              transform: hovered ? 'translateY(0)' : 'translateY(100%)',
            }}
          >
            + Add to Cart
          </button>
        </div>

        {/* Card body */}
        <div className="space-y-2 p-4">
          {/* Category pill */}
          <span
            className="inline-block rounded-full bg-pink-50 px-2 py-0.5 text-xs font-bold uppercase text-pink-600"
            style={{ letterSpacing: '0.5px' }}
          >
            {category}
          </span>

          {/* Product name */}
          <h3
            className="line-clamp-2 font-semibold text-zinc-900"
            style={{
              fontSize: '13.5px',
              lineHeight: 1.4,
              letterSpacing: '-0.1px',
            }}
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <StarRating rating={rating} />
            <span className="text-xs text-zinc-500">({reviews})</span>
          </div>

          {/* Price row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-pink-600">
                ৳{Math.round(product.price).toLocaleString()}
              </span>
              {product.compareAtPrice && (
                <span
                  className="text-xs text-zinc-400 line-through"
                >
                  ৳{Math.round(product.compareAtPrice).toLocaleString()}
                </span>
              )}
            </div>
            {discount && (
              <div
                className="inline-block rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-bold text-green-700"
              >
                Save ৳{savingsAmount.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

const DEFAULT_FILTER_OPTIONS = ['All'];

export function FeaturedProducts() {
  const [activeFilter, setActiveFilter] = useState('All');
  const { data: products = [], isLoading, error } = useHomepageFeaturedProducts(8);
  const { data: categories = [], isLoading: categoriesLoading } = useHomepageCategories();

  const activeCategories = useMemo(
    () => [...categories]
      .filter((c: Category) => c.isActive)
      .sort((a: Category, b: Category) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const filterOptions = useMemo(
    () => {
      const byDb = activeCategories.map((c: Category) => c.name).filter(Boolean);
      return byDb.length > 0 ? ['All', ...byDb] : DEFAULT_FILTER_OPTIONS;
    },
    [activeCategories]
  );

  const categoryProductCount = useMemo(() => {
    const map = new Map<number, number>();
    products.forEach((p: Product) => {
      map.set(p.categoryId, (map.get(p.categoryId) || 0) + 1);
    });
    return map;
  }, [products]);

  if (isLoading || categoriesLoading) {
    return (
      <section className="space-y-8 bg-zinc-50 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          {/* Featured products skeleton */}
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
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-zinc-200" />
              ))}
            </div>
          </div>

          {/* Categories skeleton */}
          <div>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <div className="mb-2 h-3 w-32 animate-pulse rounded bg-zinc-200" />
                <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
              </div>
              <div className="h-9 w-24 animate-pulse rounded-full bg-zinc-200" />
            </div>
            <div className="grid gap-5 grid-cols-2 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-zinc-200" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-zinc-50 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-800">Failed to load featured products. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  const filtered =
    activeFilter === 'All'
      ? products
      : products.filter((p: Product) => p.category?.name === activeFilter);

  return (
    <section className="space-y-12 bg-zinc-50 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        {/* ── FEATURED PRODUCTS SECTION ── */}
        <div>
          {/* Section header */}
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p
                className="mb-1.5 text-xs font-bold uppercase text-pink-600"
                style={{ letterSpacing: '2.5px' }}
              >
                ◆ HOT DEALS
              </p>
              <h2
                className="m-0 text-3xl font-black text-zinc-900"
                style={{ letterSpacing: '-0.5px' }}
              >
                Featured Products
              </h2>
            </div>
            <Link
              href="/shop"
              className="rounded-full border-1.5 border-pink-600 px-5 py-2 text-sm font-bold text-pink-600 transition-all duration-200 hover:bg-pink-600 hover:text-white"
              style={{ letterSpacing: '0.5px' }}
            >
              View All →
            </Link>
          </div>

          {/* Filter pills */}
          <div className="mb-8 flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className="rounded-full border-1.5 px-5 py-1.5 text-sm font-bold transition-all duration-200"
                style={{
                  borderColor: activeFilter === filter ? '#e91e8c' : '#f0d0e0',
                  background: activeFilter === filter ? '#e91e8c' : '#fff',
                  color: activeFilter === filter ? '#fff' : '#c2185b',
                  letterSpacing: '0.3px',
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="mb-12 grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((product: Product) => (
              <EnhancedProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Load more */}
          <div className="text-center">
            <Link
              href="/shop"
              className="inline-block rounded-full bg-gradient-to-r from-pink-600 to-pink-700 px-12 py-3.5 font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{
                letterSpacing: '0.5px',
                boxShadow: '0 6px 24px rgba(233,30,140,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 32px rgba(233,30,140,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(233,30,140,0.3)';
              }}
            >
              Load More Products
            </Link>
            <p className="mt-3 text-xs text-zinc-400">
              Showing {filtered.length} of {products.length} products
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        className="h-px"
        style={{
          background: 'linear-gradient(to right, transparent, #f3c8dc, transparent)',
        }}
      />

      {/* ── SHOP BY CATEGORY SECTION ── */}
      <div className="mx-auto max-w-6xl px-4 bg-white py-12 rounded-lg">
        {/* Section header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p
              className="mb-1.5 text-xs font-bold uppercase text-pink-600"
              style={{ letterSpacing: '2.5px' }}
            >
              ✦ EXPLORE
            </p>
            <h2
              className="m-0 text-3xl font-black text-zinc-900"
              style={{ letterSpacing: '-0.5px' }}
            >
              Shop by Category
            </h2>
          </div>
          <Link
            href="/categories"
            className="rounded-full border-1.5 border-pink-600 px-5 py-2 text-sm font-bold text-pink-600 transition-all duration-200 hover:bg-pink-600 hover:text-white"
            style={{ letterSpacing: '0.5px' }}
          >
            All Categories →
          </Link>
        </div>

        {/* Category grid */}
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-4">
          {activeCategories.slice(0, 4).map((cat: Category) => (
            <CategoryCard
              key={cat.id}
              id={cat.slug}
              label={cat.name}
              description={cat.description || 'Explore collection'}
              count={`${categoryProductCount.get(cat.id) || 0} Products`}
              image={normalizeImage(cat.imageUrl) || getCategoryFallbackImage(cat.slug, cat.name)}
              fallbackImage={getCategoryFallbackImage(cat.slug, cat.name)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


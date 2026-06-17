'use client';

import { useListProducts } from '@/modules/products';
import { useActivePromotions, type Promotion } from '@/modules/promotions';
import { SkeletonGrid, ErrorMessage, EmptyState } from '@/shared/components';
import { useCart } from '@/shared/contexts/CartContext';
import { useWishlist } from '@/shared/contexts/WishlistContext';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart } from 'lucide-react';

function parsePositiveInt(value: string | null | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

/** Find matching active promotion for a product and return promo info */
function getPromoForProduct(product: any, promotions: Promotion[]): { promoPrice: number; promoPct: number } | null {
  for (const promo of promotions) {
    if (promo.applyTo === 'ALL') {
      const pct = promo.pct || 0;
      return { promoPrice: Math.round(product.price * (1 - pct / 100)), promoPct: pct };
    }
    if (promo.applyTo === 'PRODUCT' && promo.productIds?.includes(product.id)) {
      const pct = promo.pct || 0;
      return { promoPrice: Math.round(product.price * (1 - pct / 100)), promoPct: pct };
    }
    if (promo.applyTo === 'CATEGORY' && promo.categoryId && product.categoryId === promo.categoryId) {
      const pct = promo.pct || 0;
      return { promoPrice: Math.round(product.price * (1 - pct / 100)), promoPct: pct };
    }
  }
  return null;
}

export default function ShopView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const params = useMemo(() => {
    const search = searchParams?.get('search')?.trim();
    const category = searchParams?.get('category')?.trim();

    return {
      page: parsePositiveInt(searchParams?.get('page'), 1),
      limit: parsePositiveInt(searchParams?.get('limit'), 12),
      ...(search ? { search } : {}),
      ...(category ? { category } : {}),
    };
  }, [searchParams]);

  const { data, isLoading, isError, error, refetch } = useListProducts(params);
  const { data: activePromotions = [] } = useActivePromotions();

  return (
    <>

      <div className="w-full bg-zinc-50 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          {isLoading ? (
            <SkeletonGrid columns={4} count={12} />
          ) : isError ? (
            <ErrorMessage
              message={(error as any)?.message || 'Failed to load products'}
              onRetry={() => refetch()}
            />
          ) : !data || data.length === 0 ? (
            <EmptyState
              title="No Products Found"
              description="Try adjusting your search or filter criteria"
              action={{ label: 'Clear Filters', onClick: () => router.push('/shop') }}
            />
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
              {data.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="block"
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div
                    className="relative overflow-hidden rounded-2xl border-1.5 bg-white transition-all duration-300 cursor-pointer"
                    style={{
                      borderColor: hoveredProduct === product.id ? '#e91e8c' : '#f3e0ea',
                      transform: hoveredProduct === product.id ? 'translateY(-4px)' : 'translateY(0)',
                      boxShadow:
                        hoveredProduct === product.id
                          ? '0 12px 32px rgba(233,30,140,0.13)'
                          : '0 2px 8px rgba(233,30,140,0.04)',
                    }}
                  >
                    {/* Image wrapper */}
                    <div className="relative overflow-hidden bg-pink-50 h-48">
                      <img
                        src={product.images?.[0] || '/placeholder.png'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300"
                        style={{
                          transform: hoveredProduct === product.id ? 'scale(1.06)' : 'scale(1)',
                        }}
                      />

                      {/* Tag badge */}
                      <div
                        className="absolute right-2 top-3 rounded-full border border-pink-200 bg-white bg-opacity-95 px-2 py-0.5 text-center text-xs font-bold text-pink-700"
                        style={{ letterSpacing: '0.5px' }}
                      >
                        Featured
                      </div>

                      {/* Wishlist button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isInWishlist(String(product.id))) {
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
                        className="absolute right-3 bottom-3 flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200"
                        style={{
                          background: isInWishlist(String(product.id)) ? '#e91e8c' : 'rgba(255,255,255,0.95)',
                          borderColor: isInWishlist(String(product.id)) ? '#e91e8c' : '#f3c8dc',
                        }}
                      >
                        <Heart
                          size={14}
                          className="transition-all"
                          fill={isInWishlist(String(product.id)) ? 'white' : 'none'}
                          stroke={isInWishlist(String(product.id)) ? 'white' : '#e91e8c'}
                          strokeWidth={2}
                        />
                      </button>

                      {/* Quick view overlay */}
                      <div
                        className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-opacity-93 py-2.5 text-center text-xs font-bold uppercase text-white transition-transform duration-300"
                        style={{
                          background: 'rgba(233,30,140,0.93)',
                          letterSpacing: '1px',
                          transform: hoveredProduct === product.id ? 'translateY(0)' : 'translateY(100%)',
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCart(
                              {
                                id: String(product.id),
                                name: product.name,
                                price: product.price,
                                image: product.images?.[0],
                                slug: product.slug,
                              },
                              1
                            );
                          }}
                          className="w-full text-white hover:opacity-90 transition"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="space-y-2 p-4">
                      {/* Category pill */}
                      <span
                        className="inline-block rounded-full bg-pink-50 px-2 py-0.5 text-xs font-bold uppercase text-pink-600"
                        style={{ letterSpacing: '0.5px' }}
                      >
                        {product.category?.name || 'Products'}
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

                      {/* Price row */}
                      {(() => {
                        const promo = getPromoForProduct(product, activePromotions);
                        const compareAt = product.compareAtPrice;
                        const hasCompareDiscount = compareAt && compareAt > product.price;
                        const bestPrice = promo ? Math.min(product.price, promo.promoPrice) : product.price;
                        const bestPct = promo && promo.promoPct > 0 ? promo.promoPct : (hasCompareDiscount ? Math.round(((compareAt - product.price) / compareAt) * 100) : 0);
                        return (
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-black text-pink-600">
                                ৳{bestPrice.toLocaleString()}
                              </span>
                              {bestPrice < product.price && (
                                <span className="text-xs text-zinc-400 line-through">
                                  ৳{Math.round(product.price).toLocaleString()}
                                </span>
                              )}
                              {hasCompareDiscount && (!promo || compareAt > promo.promoPrice) && (
                                <span className="text-xs text-zinc-400 line-through">
                                  ৳{Math.round(compareAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                            {bestPct > 0 && (
                              <span className="rounded-full bg-pink-100 px-1.5 py-0.5 text-[10px] font-bold text-pink-600">
                                {promo ? 'PROMO ' : ''}{bestPct}% OFF
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

'use client';

import { useListProducts } from '@/modules/products';
import { SkeletonGrid, ErrorMessage, EmptyState } from '@/shared/components';
import { Header } from '@/modules/homepage/components/Header';
import { useCart } from '@/shared/contexts/CartContext';
import { useWishlist } from '@/shared/contexts/WishlistContext';
import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart } from 'lucide-react';

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const params = useMemo(() => {
    const search = searchParams?.get('search')?.trim();
    const category = searchParams?.get('category')?.trim();

    return {
      page: parsePositiveInt(searchParams?.get('page') ?? null, 1),
      limit: parsePositiveInt(searchParams?.get('limit') ?? null, 12),
      ...(search ? { search } : {}),
      ...(category ? { category } : {}),
    };
  }, [searchParams]);

  const { data, isLoading, isError, error, refetch } = useListProducts(params);

  if (isLoading) return <SkeletonGrid columns={4} count={12} />;

  if (isError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <ErrorMessage
          message={(error as any)?.message || 'Failed to load products'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <EmptyState
          title="No Products Found"
          description="Try adjusting your search or filter criteria"
          action={{ label: 'Clear Filters', onClick: () => router.push('/shop') }}
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-50 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        {/* Product Grid */}
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
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-black text-pink-600">
                        ৳{Math.round(product.price).toLocaleString()}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-xs text-zinc-400 line-through">
                          ৳{Math.round(product.compareAtPrice).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<SkeletonGrid columns={4} count={12} />}>
        <ShopPageContent />
      </Suspense>
    </>
  );
}
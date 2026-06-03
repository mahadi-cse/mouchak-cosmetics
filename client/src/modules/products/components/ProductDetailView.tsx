'use client';

import { useProductBySlug, useListProducts } from '@/modules/products';
import { SkeletonCard, ErrorMessage, EmptyState } from '@/shared/components';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Heart, Share2, Star, ShoppingCart, Truck, ShieldCheck, ChevronRight, Minus, Plus } from 'lucide-react';
import { Header, Footer } from '@/modules/homepage';
import { useWishlist } from '@/shared/contexts/WishlistContext';

function formatMoney(value?: number | string | null) {
  return `৳${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
}

export default function ProductDetailView() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam || '';

  // Product State  
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const { data: product, isLoading, isError, error, refetch } = useProductBySlug(slug);

  // Fetch similar products
  const categorySlug = product?.category?.slug;
  const { data: categoryProducts = [] } = useListProducts(
    { category: categorySlug, limit: 8 },
    {
      enabled: !!categorySlug,
      queryKey: ['products', 'list', 'related', categorySlug],
      staleTime: 10 * 60 * 1000,
    }
  );
  
  const relatedProducts = useMemo(
    () => categoryProducts.filter((p: any) => p.slug !== slug).slice(0, 4),
    [categoryProducts, slug]
  );

  const images = useMemo(() => {
    if (!product?.images?.length) return ['/placeholder.png'];
    return product.images;
  }, [product]);

  const sizes = useMemo(() => (product?.sizes || []).filter((s: any) => s.isActive !== false), [product]);
  const hasSizes = sizes.length > 0;
  const selectedSize = hasSizes ? sizes[selectedSizeIndex] || sizes[0] : null;
  const unitLabel = product?.unitLabel || 'pc';

  const displayImages = useMemo(() => {
    if (selectedSize?.imageUrl) {
      return [selectedSize.imageUrl, ...images.filter((img: string) => img !== selectedSize.imageUrl)];
    }
    return images;
  }, [images, selectedSize]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [slug]);

  const availableStock = useMemo(() => {
    return (product?.inventories || []).reduce((total: number, inventory: any) => {
      const available = Math.max(0, (inventory.quantity || 0) - (inventory.reservedQty || 0));
      return total + available;
    }, 0);
  }, [product]);

  const maxAllowedQuantity = useMemo(() => {
    if (availableStock <= 0) return 0;
    return Math.min(availableStock, 10);
  }, [availableStock]);

  useEffect(() => {
    if (maxAllowedQuantity > 0 && quantity > maxAllowedQuantity) {
      setQuantity(maxAllowedQuantity);
    }
  }, [maxAllowedQuantity, quantity]);

  const inStock = availableStock > 0;
  const safeQuantity = inStock ? Math.min(Math.max(1, quantity), maxAllowedQuantity || 1) : 1;

  const basePrice = Number(product?.price || 0);
  const price = selectedSize?.priceOverride ? Number(selectedSize.priceOverride) : basePrice;
  const compareAtPrice = Number(product?.compareAtPrice || 0);
  const hasDiscount = compareAtPrice > price;
  const savings = hasDiscount ? compareAtPrice - price : 0;
  const discountPercent = hasDiscount ? Math.round((savings / compareAtPrice) * 100) : 0;
  const descriptionContent =
    product?.description ||
    'This premium product is formulated with the finest ingredients to deliver exceptional results. Crafted with care and backed by scientific research, it offers powerful benefits for daily use.';

  const updateQuantity = (next: number) => {
    if (!inStock) {
      setQuantity(1);
      return;
    }
    setQuantity(Math.min(maxAllowedQuantity || 1, Math.max(1, next)));
  };

  const handleBuyNowClick = () => {
    if (!inStock) {
      toast.error('This product is currently out of stock.');
      return;
    }
    if (status === 'unauthenticated') {
      toast.error('Please login to place an order');
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }
    const sizeParam = selectedSize ? `&size=${encodeURIComponent(selectedSize.name)}` : '';
    router.push(`/checkout?slug=${product!.slug}&qty=${safeQuantity}${sizeParam}`);
  };

  if (isLoading) return <div className="container mx-auto px-4 py-8"><SkeletonCard /></div>;

  if (isError) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: string }).message || 'Failed to load product')
        : 'Failed to load product';

    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={message} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        title="Product Not Found"
        description="The product you're looking for doesn't exist or has been removed"
        action={{ label: 'Back to Shop', onClick: () => window.history.back() }}
      />
    );
  }

  const isWished = isInWishlist(String(product.id));

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-primary/20">
      <Header />

      {/* Breadcrumb */}
      <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center flex-wrap gap-2 text-xs text-zinc-500 uppercase tracking-widest font-medium">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight size={12} className="text-zinc-300" />
        <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
        <ChevronRight size={12} className="text-zinc-300" />
        {product.category?.name && (
          <>
            <Link href={`/categories/${product.category.slug}`} className="hover:text-primary transition-colors">
              {product.category.name}
            </Link>
            <ChevronRight size={12} className="text-zinc-300" />
          </>
        )}
        <span className="text-zinc-900">{product.name}</span>
      </nav>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          {/* LEFT: Gallery */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-24 h-fit">
            <div className="relative aspect-square w-full rounded-2xl bg-zinc-50 overflow-hidden group">
              <img 
                src={displayImages[activeImageIndex]} 
                alt={product.name} 
                className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105" 
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {hasDiscount && (
                  <span className="bg-rose-600 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Wishlist Button */}
              <button 
                onClick={() => isWished ? removeFromWishlist(String(product.id)) : addToWishlist({ id: String(product.id), name: product.name, price: Number(product.price || 0), image: images[0] || undefined, slug: product.slug })}
                className="absolute top-4 right-4 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform duration-200"
              >
                <Heart size={18} fill={isWished ? 'var(--primary)' : 'none'} className={isWished ? 'text-primary' : 'text-zinc-400'} />
              </button>
            </div>

            {/* Thumbnails */}
            {displayImages.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {displayImages.map((img: string, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative aspect-square rounded-xl overflow-hidden bg-zinc-50 border-2 transition-all ${i === activeImageIndex ? 'border-zinc-900' : 'border-transparent hover:border-zinc-300'}`}
                  >
                    <img src={img} alt={`${product.name} thumbnail ${i + 1}`} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Details */}
          <div className="mt-10 px-2 sm:px-0 lg:mt-0 flex flex-col">
            {/* Title & Brand */}
            <div className="mb-6">
              <Link href={`/categories/${product.category?.slug}`} className="text-sm font-bold text-primary tracking-widest uppercase mb-2 block hover:underline">
                {product.category?.name || 'Cosmetics'}
              </Link>
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-zinc-900 mb-4 leading-tight">
                {product.name}
              </h1>
              
              {/* Ratings */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < 4 ? "currentColor" : "none"} className={i < 4 ? "text-yellow-400" : "text-zinc-300"} />
                  ))}
                  <span className="text-sm font-medium text-zinc-900 ml-1">4.8</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-zinc-300" />
                <span className="text-sm text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 cursor-pointer transition-colors">
                  Read 284 Reviews
                </span>
              </div>
            </div>

            <hr className="border-zinc-100 my-6" />

            {/* Price block */}
            <div className="mb-8">
              <div className="flex items-end gap-3 mb-2">
                <span className="text-3xl font-semibold text-zinc-900">{formatMoney(price)}</span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-zinc-400 line-through decoration-zinc-300">{formatMoney(compareAtPrice)}</span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">Save {formatMoney(savings)}</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="text-sm font-medium text-zinc-700">{inStock ? 'In Stock & Ready to Ship' : 'Currently Unavailable'}</span>
                {inStock && availableStock < 10 && (
                  <span className="text-sm text-amber-600 font-medium ml-2">({availableStock} left)</span>
                )}
              </div>
            </div>

            {/* Size Selector */}
            {hasSizes && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-zinc-900">Size / Variant</span>
                  <span className="text-sm text-zinc-500">{selectedSize?.name}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {sizes.map((size: any, i: number) => {
                    const isSelected = selectedSizeIndex === i;
                    return (
                      <button
                        key={size.name}
                        onClick={() => {
                          setSelectedSizeIndex(i);
                          if (size.imageUrl) setActiveImageIndex(0);
                        }}
                        className={`relative py-2.5 px-5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                          isSelected 
                            ? 'border-zinc-900 bg-zinc-900 text-white shadow-md' 
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50'
                        }`}
                      >
                        {size.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Actions (Qty + Add to cart) */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              {/* Quantity */}
              <div className="flex items-center justify-between w-full sm:w-32 h-14 bg-zinc-50 border border-zinc-200 rounded-xl px-2">
                <button 
                  onClick={() => updateQuantity(safeQuantity - 1)}
                  className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="text-base font-semibold text-zinc-900 w-8 text-center">{safeQuantity}</span>
                <button 
                  onClick={() => updateQuantity(safeQuantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Checkout Button */}
              <button 
                onClick={handleBuyNowClick}
                disabled={!inStock}
                className="flex-1 h-14 bg-primary text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-[0_4px_14px_color-mix(in_srgb,var(--primary)_40%,transparent)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
              >
                <ShoppingCart size={20} />
                {inStock ? 'Checkout Now' : 'Out of Stock'}
              </button>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <Truck className="text-zinc-400" size={24} />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-zinc-900">Fast Delivery</span>
                  <span className="text-xs text-zinc-500">Across Bangladesh</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <ShieldCheck className="text-zinc-400" size={24} />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-zinc-900">100% Authentic</span>
                  <span className="text-xs text-zinc-500">Quality Guaranteed</span>
                </div>
              </div>
            </div>

            {/* Description Details */}
            <div className="border-t border-zinc-200 pt-8">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Product Details</h3>
              <div className="prose prose-sm prose-zinc text-zinc-600 leading-relaxed max-w-none">
                <p>{descriptionContent}</p>
                <ul className="mt-6 space-y-2 list-none p-0">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✦</span>
                    <span><strong>Premium Quality:</strong> Crafted with the finest, dermatologist-tested ingredients.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✦</span>
                    <span><strong>Ethical Sourcing:</strong> 100% cruelty-free and sustainably sourced.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✦</span>
                    <span><strong>Usage:</strong> Perfect for daily use and suitable for all skin types.</span>
                  </li>
                </ul>
              </div>
            </div>
            
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 lg:mt-32">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">You May Also Like</h2>
              <Link href={`/categories/${product.category?.slug || ''}`} className="text-sm font-semibold text-primary hover:underline underline-offset-4">
                View Collection
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {relatedProducts.map((rp: any) => (
                <Link key={rp.id} href={`/product/${rp.slug}`} className="group flex flex-col">
                  <div className="relative aspect-[4/5] w-full rounded-2xl bg-zinc-50 overflow-hidden mb-4 border border-zinc-100">
                    {rp.images?.[0] ? (
                      <img 
                        src={rp.images[0]} 
                        alt={rp.name} 
                        className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105 p-4" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300">
                        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                    )}
                    {/* Add to cart quick button on hover */}
                    <div className="absolute bottom-4 left-0 right-0 px-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <button className="w-full py-2.5 bg-white/90 backdrop-blur text-zinc-900 font-semibold text-sm rounded-xl shadow-lg border border-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors">
                        View Product
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col flex-1">
                    <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">{rp.category?.name || 'Cosmetics'}</span>
                    <h3 className="text-sm sm:text-base font-semibold text-zinc-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">{rp.name}</h3>
                    <div className="mt-auto flex items-center gap-2">
                      <span className="font-bold text-zinc-900">{formatMoney(rp.price)}</span>
                      {rp.compareAtPrice > rp.price && (
                        <span className="text-xs text-zinc-400 line-through">{formatMoney(rp.compareAtPrice)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

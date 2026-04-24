'use client';

import { useProductBySlug, useListProducts } from '@/modules/products';
import { SkeletonCard, ErrorMessage, EmptyState } from '@/shared/components';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ChevronRight, Clock, ShieldCheck, ShoppingBag, Truck, X, Heart, Share2, Star, Zap, TrendingUp, ShoppingCart } from 'lucide-react';
import { Header } from '@/modules/homepage/components/Header';
import { Footer } from '@/modules/homepage/components/Footer';
import { useWishlist } from '@/shared/contexts/WishlistContext';

function formatMoney(value?: number | string | null) {
  return `৳${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
}

export default function ProductDetailPage() {
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
  const [activeTab, setActiveTab] = useState<TabType>('description');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [tabExpanded, setTabExpanded] = useState<Record<TabType, boolean>>({
    description: false,
    specifications: false,
    reviews: false,
    faqs: false,
  });

  const [viewportWidth, setViewportWidth] = useState(1200);

  const { data: product, isLoading, isError, error, refetch } = useProductBySlug(slug);

  // Fetch similar products from the same category
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
    if (!product?.images?.length) {
      return ['/placeholder.png'];
    }
    return product.images;
  }, [product]);

  // Size & Unit support
  const sizes = useMemo(() => (product?.sizes || []).filter((s: any) => s.isActive !== false), [product]);
  const hasSizes = sizes.length > 0;
  const selectedSize = hasSizes ? sizes[selectedSizeIndex] || sizes[0] : null;
  const unitType = product?.unitType || 'PIECE';
  const unitLabel = product?.unitLabel || 'pc';

  // If selected size has an image, show it as the main image
  const displayImages = useMemo(() => {
    if (selectedSize?.imageUrl) {
      return [selectedSize.imageUrl, ...images.filter((img: string) => img !== selectedSize.imageUrl)];
    }
    return images;
  }, [images, selectedSize]);

  // Mock data for reviews and FAQs
  const mockReviews: MockReview[] = [
    { name: 'Tasnia R.', rating: 5, date: 'March 2025', text: 'I\'ve been using this for 6 weeks and my skin has visibly improved. Outstanding quality!', verified: true },
    { name: 'Sumaiya K.', rating: 5, date: 'February 2025', text: 'The texture is so lightweight and non-greasy. Highly recommended!', verified: true },
    { name: 'Nusrat J.', rating: 4, date: 'January 2025', text: 'Great product, noticeable improvement. Love it!', verified: true },
    { name: 'Mim A.', rating: 5, date: 'January 2025', text: 'This genuinely works. Now it\'s a permanent part of my routine.', verified: true },
  ];

  const mockFaqs: MockFaq[] = [
    { q: 'What are the key benefits of this product?', a: 'This product is formulated with premium ingredients to deliver visible results within 4-6 weeks of regular use.' },
    { q: 'Is it suitable for all skin types?', a: 'Yes, this product is dermatologist-tested and suitable for all skin types including sensitive skin.' },
    { q: 'How should I apply this product?', a: 'Apply a small amount to cleansed skin, gently massage, and follow with moisturizer. Use twice daily for best results.' },
    { q: 'What is your return policy?', a: 'We offer 15-day returns on unopened products and full refunds within 30 days if you\'re not satisfied.' },
  ];

  useEffect(() => {
    setActiveImageIndex(0);
  }, [slug]);



  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const availableStock = useMemo(() => {
    return (product?.inventories || []).reduce((total, inventory) => {
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
  const subtotal = price * safeQuantity;
  const highlights = (product?.tags || []).slice(0, 5);
  const descriptionContent =
    product?.description ||
    'This premium product is formulated with the finest ingredients to deliver exceptional results. Crafted with care and backed by scientific research, it offers powerful benefits for daily use.';
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth < 1024;

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
    router.push(`/checkout?slug=${product.slug}&qty=${safeQuantity}${sizeParam}`);
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

  const PINK = '#e91e8c';
  const PINK_LIGHT = '#f3e0ea';
  const PINK_PALE = '#fce7f3';
  const DARK = '#1f2937';
  const GRAY = '#4b5563';
  const GRAY_LIGHT = '#9ca3af';

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#fff', minHeight: '100vh', color: DARK }}>
      <Header />

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '12px 16px' : '16px 24px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: GRAY_LIGHT, flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: GRAY, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}>Home</Link>
        <span style={{ color: GRAY_LIGHT }}>›</span>
        <Link href="/shop" style={{ color: GRAY, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}>Shop</Link>
        <span style={{ color: GRAY_LIGHT }}>›</span>
        {product.category?.name && <span style={{ color: GRAY, fontWeight: 500 }}>{product.category.name}</span>}
        {product.category?.name && <span style={{ color: GRAY_LIGHT }}>›</span>}
        <span style={{ color: PINK, fontWeight: 700 }}>{product.name}</span>
      </div>



      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px' : '20px 24px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '0.92fr 1.08fr', gap: isMobile ? 16 : 20, alignItems: 'flex-start' }}>
          {/* LEFT: Gallery */}
          <div style={{ position: isTablet ? 'relative' : 'sticky', top: isTablet ? 0 : 90 }}>
            {/* Main Image */}
            <div style={{ borderRadius: 24, overflow: 'hidden', border: `1.5px solid ${PINK_LIGHT}`, background: PINK_PALE, height: isMobile ? 260 : 320, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.3s' }}>
              <img src={displayImages[activeImageIndex]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {hasDiscount && (
                <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: PINK, color: '#fff', border: `1.5px solid ${PINK}` }}>
                    BEST SELLER
                  </span>
                  <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'transparent', color: PINK, border: `1.5px solid ${PINK}` }}>
                    Save {discountPercent}%
                  </span>
                </div>
              )}
              <button style={{ position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: '50%', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => {
                if (isInWishlist(product.id)) {
                  removeFromWishlist(product.id);
                } else {
                  addToWishlist({ id: product.id, name: product.name, price: Number(product.price || 0), image: images[0] || undefined, slug: product.slug });
                }
              }}>
                <Heart size={18} fill={isInWishlist(product.id) ? PINK : 'none'} color={isInWishlist(product.id) ? PINK : GRAY_LIGHT} />
              </button>
              {/* Dot indicators */}
              <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                {displayImages.map((_: string, i: number) => (
                  <div key={i} onClick={() => setActiveImageIndex(i)} style={{ width: i === activeImageIndex ? 20 : 6, height: 6, borderRadius: 999, background: i === activeImageIndex ? PINK : PINK_LIGHT, transition: 'all 0.3s', cursor: 'pointer' }} />
                ))}
              </div>
            </div>

            {/* Thumbnails */}
            {displayImages.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 12 }}>
                {displayImages.map((img: string, i: number) => (
                  <div key={i} onClick={() => setActiveImageIndex(i)} style={{ borderRadius: 14, border: `1.5px solid ${i === activeImageIndex ? PINK : PINK_LIGHT}`, background: PINK_PALE, height: isMobile ? 60 : 72, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', fontSize: 10, color: GRAY, fontWeight: 600, overflow: 'hidden' }}>
                    <img src={img} alt={`thumb ${i}`} style={{ width: '40%', height: '40%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Share Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: GRAY_LIGHT, fontWeight: 500 }}>Share:</span>
              {['Facebook', 'Instagram', 'WhatsApp', 'Copy link'].map((s) => (
                <button key={s} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, border: `1px solid ${PINK_LIGHT}`, color: GRAY, fontWeight: 500, transition: 'all 0.2s', background: '#fff', cursor: 'pointer' }}>{s}</button>
              ))}
            </div>

           
          </div>

          {/* RIGHT: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Category & Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: PINK_PALE, color: PINK, borderRadius: 999, padding: '3px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {product.category?.name || 'Beauty'}
              </span>
              <span style={{ background: PINK_PALE, color: PINK, borderRadius: 999, padding: '3px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: `1.5px solid ${PINK}` }}>
                Premium Quality
              </span>
              <span style={{ background: '#ecfdf5', color: '#059669', borderRadius: 999, padding: '3px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                🌿 Verified
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, color: DARK, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
                {product.name}
              </h1>
              <p style={{ fontSize: 13, color: GRAY_LIGHT, marginTop: 4 }}>SKU: {product.id}</p>
            </div>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} width={16} height={16} viewBox="0 0 20 20" fill="#f59e0b">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: DARK }}>4.8</span>
              <span style={{ fontSize: 13, color: GRAY_LIGHT }}>(284 reviews)</span>
              <span style={{ width: 1, height: 14, background: PINK_LIGHT }} />
              <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>✓ Verified purchases</span>
            </div>

            {/* Price */}
            <div style={{ background: PINK_PALE, borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: PINK }}>{formatMoney(price)}</span>
              {hasDiscount && (
                <div>
                  <span style={{ fontSize: 16, color: GRAY_LIGHT, textDecoration: 'line-through', display: 'block' }}>{formatMoney(compareAtPrice)}</span>
                  <span style={{ background: PINK, color: '#fff', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>Save {discountPercent}%</span>
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: inStock ? '#059669' : '#ef4444', display: 'inline-block' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: inStock ? '#059669' : '#ef4444' }}>
                {inStock ? 'In Stock' : 'Out of Stock'}
              </span>
              {inStock && <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>Only {availableStock} left!</span>}
            </div>

            {/* Unit Type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: GRAY }}>
                {unitType === 'WEIGHT' ? '⚖️ Sold by weight' : '📦 Sold by piece'}
              </span>
              <span style={{ fontSize: 12, color: GRAY_LIGHT }}>({unitLabel})</span>
            </div>

            {/* Size Selector */}
            {hasSizes && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 8 }}>Select Size</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {sizes.map((size: any, i: number) => (
                    <button
                      key={size.name}
                      onClick={() => {
                        setSelectedSizeIndex(i);
                        if (size.imageUrl) setActiveImageIndex(0);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 12,
                        border: `1.5px solid ${selectedSizeIndex === i ? PINK : PINK_LIGHT}`,
                        background: selectedSizeIndex === i ? PINK_PALE : '#fff',
                        color: selectedSizeIndex === i ? PINK : DARK,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {size.imageUrl && (
                        <img
                          src={size.imageUrl}
                          alt={size.name}
                          style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }}
                        />
                      )}
                      {size.name}
                      {size.priceOverride && (
                        <span style={{ fontSize: 11, color: GRAY_LIGHT }}>
                          {formatMoney(size.priceOverride)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 10, marginTop: 2, background: '#fff', border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 16, padding: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: GRAY }}>Qty ({unitLabel})</p>
                <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                  <button onClick={() => updateQuantity(safeQuantity - 1)} style={{ width: 36, height: 36, fontSize: 17, fontWeight: 700, color: GRAY, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}>−</button>
                  <span style={{ width: 34, textAlign: 'center', fontSize: 14, fontWeight: 700, color: DARK }}>{safeQuantity}</span>
                  <button onClick={() => updateQuantity(safeQuantity + 1)} style={{ width: 36, height: 36, fontSize: 17, fontWeight: 700, color: GRAY, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
                </div>
              </div>
              <button onClick={handleBuyNowClick} disabled={!inStock} style={{ flex: 1, width: isMobile ? '100%' : undefined, minWidth: isMobile ? '100%' : 180, padding: '14px 18px', borderRadius: 14, background: inStock ? PINK : '#d1d5db', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: inStock ? 'pointer' : 'not-allowed', transition: 'all 0.3s', boxShadow: inStock ? `0 10px 25px ${PINK}44` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ShoppingCart size={18} />
                {inStock ? 'Checkout Now' : 'Out of Stock'}
              </button>
            </div>

            {/* Accordion Product Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {/* Description Accordion */}
              <div style={{ border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
                <button onClick={() => setActiveTab(activeTab === 'description' ? ('' as any) : 'description')} style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activeTab === 'description' ? PINK_PALE : 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: DARK }}>Product Description</span>
                  <ChevronRight size={18} style={{ color: PINK, transform: activeTab === 'description' ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {activeTab === 'description' && (
                  <div style={{ padding: '16px 20px 20px', borderTop: `1px solid ${PINK_LIGHT}`, background: '#fff' }}>
                    <p style={{ fontSize: 14, color: GRAY, lineHeight: 1.7 }}>{descriptionContent}</p>
                    <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: DARK }}>Features & Benefits</p>
                      {[
                        { icon: '✦', title: 'Premium Quality', desc: 'Made with the finest ingredients.' },
                        { icon: '✦', title: 'Dermatologist Tested', desc: 'Safe for all skin types.' },
                      ].map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, background: PINK_PALE, padding: 12, borderRadius: 12 }}>
                          <span style={{ color: PINK, fontWeight: 700, fontSize: 16, marginTop: 2 }}>{f.icon}</span>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: DARK, display: 'block', marginBottom: 2 }}>{f.title}</span>
                            <span style={{ fontSize: 13, color: GRAY, lineHeight: 1.5 }}>{f.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Specifications Accordion */}
              <div style={{ border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
                <button onClick={() => setActiveTab(activeTab === 'specifications' ? ('' as any) : 'specifications')} style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activeTab === 'specifications' ? PINK_PALE : 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: DARK }}>Specifications</span>
                  <ChevronRight size={18} style={{ color: PINK, transform: activeTab === 'specifications' ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {activeTab === 'specifications' && (
                  <div style={{ padding: '16px 20px 20px', borderTop: `1px solid ${PINK_LIGHT}`, background: '#fff' }}>
                    <div style={{ border: `1px solid ${PINK_LIGHT}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                      {[
                        { label: 'Category', value: product.category?.name || 'Beauty' },
                        { label: 'Shelf Life', value: '24 months' },
                        { label: 'Storage', value: 'Keep in cool, dry place' },
                      ].map((s, i, arr) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', padding: '12px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${PINK_LIGHT}` : 'none', background: i % 2 === 1 ? PINK_PALE : '#fff' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: GRAY }}>{s.label}</span>
                          <span style={{ fontSize: 13, color: DARK }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reviews Accordion */}
              <div style={{ border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
                <button onClick={() => setActiveTab(activeTab === 'reviews' ? ('' as any) : 'reviews')} style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activeTab === 'reviews' ? PINK_PALE : 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: DARK }}>Customer Reviews (284)</span>
                  <ChevronRight size={18} style={{ color: PINK, transform: activeTab === 'reviews' ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {activeTab === 'reviews' && (
                  <div style={{ padding: '16px 20px 20px', borderTop: `1px solid ${PINK_LIGHT}`, background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <div style={{ fontSize: 40, fontWeight: 800, color: DARK, lineHeight: 1 }}>4.8</div>
                      <div>
                        <span style={{ display: 'flex', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={16} fill="#f59e0b" color="#f59e0b" />
                          ))}
                        </span>
                        <p style={{ fontSize: 12, color: GRAY_LIGHT, marginTop: 4 }}>Based on 284 reviews</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {mockReviews.slice(0, 3).map((r, i) => (
                        <div key={i} style={{ background: '#fff', border: `1px solid ${PINK_LIGHT}`, borderRadius: 12, padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{r.name}</span>
                              {r.verified && <span style={{ fontSize: 10, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>Verified</span>}
                            </div>
                            <span style={{ fontSize: 12, color: GRAY_LIGHT }}>{r.date}</span>
                          </div>
                          <span style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={12} fill={s <= r.rating ? '#f59e0b' : '#e5e7eb'} color={s <= r.rating ? '#f59e0b' : '#e5e7eb'} />
                            ))}
                          </span>
                          <p style={{ fontSize: 13, color: GRAY, lineHeight: 1.6 }}>{r.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* FAQs Accordion */}
              <div style={{ border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
                <button onClick={() => setActiveTab(activeTab === 'faqs' ? ('' as any) : 'faqs')} style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activeTab === 'faqs' ? PINK_PALE : 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: DARK }}>FAQs</span>
                  <ChevronRight size={18} style={{ color: PINK, transform: activeTab === 'faqs' ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {activeTab === 'faqs' && (
                  <div style={{ padding: '16px 20px 20px', borderTop: `1px solid ${PINK_LIGHT}`, background: '#fff' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {mockFaqs.slice(0, 3).map((faq, i) => (
                        <div key={i} onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)} style={{ background: openFaqIndex === i ? PINK_PALE : '#fff', border: `1px solid ${PINK_LIGHT}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: DARK, paddingRight: 16 }}>{faq.q}</p>
                            <span style={{ color: PINK, fontSize: 16, fontWeight: 700, transform: openFaqIndex === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                          </div>
                          {openFaqIndex === i && (
                            <div style={{ padding: '0 16px 16px', fontSize: 13, color: GRAY, lineHeight: 1.6 }}>{faq.a}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products from same category */}
        {relatedProducts.length > 0 && (
        <div style={{ marginTop: isMobile ? 48 : 80, padding: isMobile ? '24px 16px' : '40px 32px', background: '#fcfcfc', borderRadius: isMobile ? 20 : 32, border: `1px solid ${PINK_LIGHT}` }}>
          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 0, marginBottom: 32 }}>
            <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: DARK, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 6, height: 28, background: PINK, borderRadius: 3, display: 'inline-block' }} />
              Similar in {product.category?.name || 'This Category'}
            </h2>
            <Link href={`/categories/${product.category?.slug || ''}`} style={{ color: PINK, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>View All →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : (isTablet ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)'), gap: isMobile ? 12 : 24 }}>
            {relatedProducts.map((rp: any) => (
              <Link key={rp.id} href={`/product/${rp.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: '#fff', border: `1px solid ${PINK_LIGHT}`, borderRadius: isMobile ? 16 : 24, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(233,30,140,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)'; }}>
                  <div style={{ height: isMobile ? 120 : 180, background: 'linear-gradient(135deg,#fdf2f8,#fce7f3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {rp.images?.[0] ? (
                      <img src={rp.images[0]} alt={rp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="60" height="100" viewBox="0 0 50 90" fill="none">
                        <rect x="18" y="0" width="14" height="6" rx="2" fill={PINK} opacity="0.6" />
                        <rect x="10" y="10" width="30" height="70" rx="10" fill="white" fillOpacity="0.8" stroke={PINK} strokeWidth="1" />
                      </svg>
                    )}
                  </div>
                  <div style={{ padding: isMobile ? '12px' : '20px' }}>
                    <span style={{ fontSize: 10, color: PINK, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{rp.category?.name || product.category?.name || 'Beauty'}</span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: DARK, marginTop: 6, marginBottom: 12, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rp.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: DARK }}>{formatMoney(rp.price)}</span>
                      <span style={{ width: 32, height: 32, borderRadius: 10, background: PINK, color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 10px ${PINK}44` }}>+</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        )}

      </div>


      <Footer />
    </div>
  );
}
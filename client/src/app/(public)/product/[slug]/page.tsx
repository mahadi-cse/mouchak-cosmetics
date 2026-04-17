'use client';

import { useProductBySlug } from '@/modules/products';
import { ordersAPI, type CreateCodOrderRequest } from '@/modules/orders/api';
import { SkeletonCard, ErrorMessage, EmptyState, LoadingSpinner } from '@/shared/components';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ChevronRight, Clock, ShieldCheck, ShoppingBag, Truck, X, Heart, Share2, Star, Zap, TrendingUp, ShoppingCart } from 'lucide-react';
import { Header } from '@/modules/homepage/components/Header';
import { Footer } from '@/modules/homepage/components/Footer';

interface CheckoutFormState {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostal: string;
  shippingCountry: string;
  notes: string;
}

interface PlacedOrderSummary {
  orderNumber: string;
  status: string;
  total: number;
}

type TabType = 'description' | 'specifications' | 'reviews' | 'faqs';

interface MockReview {
  name: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
}

interface MockFaq {
  q: string;
  a: string;
}

const BANGLADESH_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

function formatMoney(value?: number | string | null) {
  return `৳${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      message?: string;
      response?: {
        data?: {
          message?: string;
          error?: string;
        };
      };
    };

    return (
      maybeError.response?.data?.message ||
      maybeError.response?.data?.error ||
      maybeError.message ||
      'Failed to place order'
    );
  }

  return 'Failed to place order';
}

export default function ProductDetailPage() {
  const params = useParams();
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam || '';

  // Product State  
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [wishlist, setWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('description');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [tabExpanded, setTabExpanded] = useState<Record<TabType, boolean>>({
    description: false,
    specifications: false,
    reviews: false,
    faqs: false,
  });

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrderSummary | null>(null);
  const [viewportWidth, setViewportWidth] = useState(1200);
  const [form, setForm] = useState<CheckoutFormState>({
    shippingName: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCity: 'Dhaka',
    shippingPostal: '',
    shippingCountry: 'Bangladesh',
    notes: '',
  });

  const { data: product, isLoading, isError, error, refetch } = useProductBySlug(slug);

  const images = useMemo(() => {
    if (!product?.images?.length) {
      return ['/placeholder.png'];
    }
    return product.images;
  }, [product]);

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
    if (isCheckoutOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCheckoutOpen]);

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

  const codMutation = useMutation({
    mutationFn: async (payload: CreateCodOrderRequest) => ordersAPI.createCodOrder(payload),
    onSuccess: (order) => {
      setPlacedOrder({
        orderNumber: order.orderNumber,
        status: String(order.status || 'PENDING'),
        total: Number(order.total || 0),
      });
      toast.success('Order placed successfully. We will call you for confirmation.');
      setForm((prev) => ({ ...prev, notes: '' }));
      setIsCheckoutOpen(false);
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage(mutationError));
    },
  });

  const inStock = availableStock > 0;
  const safeQuantity = inStock ? Math.min(Math.max(1, quantity), maxAllowedQuantity || 1) : 1;

  const price = Number(product?.price || 0);
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
  const relatedProducts = [
    'Rose Petal Toner',
    'Glow Moisturizer SPF 30',
    'Niacinamide Serum',
    'Vitamin C Eye Cream',
  ];

  const updateQuantity = (next: number) => {
    if (!inStock) {
      setQuantity(1);
      return;
    }
    setQuantity(Math.min(maxAllowedQuantity || 1, Math.max(1, next)));
  };

  const handleFormField = <T extends keyof CheckoutFormState>(field: T, value: CheckoutFormState[T]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBuyNowClick = () => {
    if (!inStock) {
      toast.error('This product is currently out of stock.');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handlePlaceOrder = async () => {
    if (!product) return;

    if (codMutation.isPending) {
      return;
    }

    if (!inStock) {
      toast.error('This product is currently out of stock.');
      return;
    }

    const required: Array<{ field: keyof CheckoutFormState; label: string }> = [
      { field: 'shippingName', label: 'Full name' },
      { field: 'shippingPhone', label: 'Phone number' },
      { field: 'shippingAddress', label: 'Shipping address' },
      { field: 'shippingCity', label: 'City' },
    ];

    for (const item of required) {
      if (!form[item.field].trim()) {
        toast.error(`${item.label} is required.`);
        return;
      }
    }

    const normalizedPhone = form.shippingPhone.replace(/\s+/g, '');
    if (!BANGLADESH_PHONE_REGEX.test(normalizedPhone)) {
      toast.error('Please enter a valid Bangladeshi phone number.');
      return;
    }

    await codMutation.mutateAsync({
      productId: product.id,
      quantity: safeQuantity,
      shippingName: form.shippingName.trim(),
      shippingPhone: normalizedPhone,
      shippingAddress: form.shippingAddress.trim(),
      shippingCity: form.shippingCity.trim(),
      shippingPostal: form.shippingPostal.trim() || undefined,
      shippingCountry: form.shippingCountry.trim() || 'Bangladesh',
      notes: form.notes.trim() || undefined,
    });
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

      {/* Successful Order Banner */}
      {placedOrder && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, borderRadius: 12, border: '1px solid #10b981', background: '#ecfdf5', padding: 16 }}>
            <CheckCircle2 size={24} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#065f46' }}>Order Confirmed!</h3>
              <p style={{ fontSize: 13, color: '#047857', marginTop: 4 }}>
                Your order #{placedOrder.orderNumber} placed successfully via Cash on Delivery. We will contact you shortly to confirm.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px' : '20px 24px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '0.92fr 1.08fr', gap: isMobile ? 16 : 20, alignItems: 'flex-start' }}>
          {/* LEFT: Gallery */}
          <div style={{ position: isTablet ? 'relative' : 'sticky', top: isTablet ? 0 : 90 }}>
            {/* Main Image */}
            <div style={{ borderRadius: 24, overflow: 'hidden', border: `1.5px solid ${PINK_LIGHT}`, background: PINK_PALE, height: isMobile ? 260 : 320, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.3s' }}>
              <img src={images[activeImageIndex]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
              <button style={{ position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: '50%', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setWishlist(!wishlist)}>
                <Heart size={18} fill={wishlist ? PINK : 'none'} color={wishlist ? PINK : GRAY_LIGHT} />
              </button>
              {/* Dot indicators */}
              <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                {images.map((_, i) => (
                  <div key={i} onClick={() => setActiveImageIndex(i)} style={{ width: i === activeImageIndex ? 20 : 6, height: 6, borderRadius: 999, background: i === activeImageIndex ? PINK : PINK_LIGHT, transition: 'all 0.3s', cursor: 'pointer' }} />
                ))}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 12 }}>
                {images.map((img, i) => (
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

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 10, marginTop: 2, background: '#fff', border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 16, padding: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: GRAY }}>Qty</p>
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

            {/* Highlights */}
            {highlights.length > 0 && (
              <div style={{ background: '#fff', border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 16, padding: '18px 20px' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 12 }}>Key Highlights</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {highlights.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: PINK_PALE, color: PINK, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 13, color: GRAY, lineHeight: 1.5 }}>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Short Description */}
            <p style={{ fontSize: 14, color: GRAY, lineHeight: 1.75, borderLeft: `3px solid ${PINK}`, paddingLeft: 14 }}>
              {product.description || product.shortDescription || 'Experience premium quality with this beauty essential crafted with care to bring out your natural glow.'}
            </p>
          </div>
        </div>

        {/* TABS SECTION - Description/Specs/Reviews FIRST */}
        <div style={{ marginTop: isMobile ? 40 : 64 }}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: 8, borderBottom: `2px solid ${PINK_LIGHT}`, marginBottom: isMobile ? 24 : 48, paddingBottom: 2, overflowX: 'auto', scrollbarWidth: 'thin' }}>
            {(['description', 'specifications', 'reviews', 'faqs'] as TabType[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: isMobile ? '12px 14px' : '16px 32px', whiteSpace: 'nowrap', fontSize: isMobile ? 14 : 15, fontWeight: 700, color: activeTab === tab ? PINK : GRAY, borderBottom: `3px solid ${activeTab === tab ? PINK : 'transparent'}`, borderTop: 'none', borderLeft: 'none', borderRight: 'none', marginBottom: -4, textTransform: 'capitalize', letterSpacing: '0.02em', transition: 'all 0.3s', background: 'none', cursor: 'pointer', position: 'relative' }}>
                {tab === 'faqs' ? 'FAQs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Description Tab */}
          {activeTab === 'description' && (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: isMobile ? 20 : 48,
                  ...(tabExpanded.description
                    ? {}
                    : {
                      maxHeight: isMobile ? 220 : 185,
                      overflow: 'hidden',
                    }),
                }}
              >
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 20, paddingBottom: 10, borderBottom: `2px solid ${PINK_LIGHT}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 4, height: 22, background: PINK, borderRadius: 2, display: 'inline-block' }} />
                    Full Description
                  </h2>
                  <p
                    style={{
                      fontSize: 14,
                      color: GRAY,
                      lineHeight: 1.85,
                      marginBottom: 16,
                      ...(tabExpanded.description
                        ? {}
                        : {
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }),
                    }}
                  >
                    {descriptionContent}
                  </p>
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 20, paddingBottom: 10, borderBottom: `2px solid ${PINK_LIGHT}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 4, height: 22, background: PINK, borderRadius: 2, display: 'inline-block' }} />
                    Features &amp; Benefits
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(tabExpanded.description
                      ? [
                        { icon: '✦', title: 'Premium Quality', desc: 'Made with the finest ingredients sourced globally.' },
                        { icon: '✦', title: 'Dermatologist Tested', desc: 'Safe and effective for all skin types.' },
                        { icon: '✦', title: 'Fast Results', desc: 'Visible improvements in 2-4 weeks.' },
                        { icon: '✦', title: 'Clean Beauty', desc: 'Free from harmful chemicals and additives.' },
                      ]
                      : [
                        { icon: '✦', title: 'Premium Quality', desc: 'Made with the finest ingredients sourced globally.' },
                        { icon: '✦', title: 'Dermatologist Tested', desc: 'Safe and effective for all skin types.' },
                      ]).map((f, i) => (
                      <div key={i} style={{ background: '#fff', border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 16, padding: '16px 18px', display: 'flex', gap: 14 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: PINK_PALE, color: PINK, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{f.icon}</span>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 4 }}>{f.title}</p>
                          <p style={{ fontSize: 13, color: GRAY, lineHeight: 1.6 }}>{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {tabExpanded.description ? (
                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={() => setTabExpanded((prev) => ({ ...prev, description: !prev.description }))}
                    style={{ border: `1px solid ${PINK_LIGHT}`, background: '#fff', color: PINK, borderRadius: 999, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    See less
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 90,
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.88) 55%, rgba(255,255,255,1) 100%)',
                      backdropFilter: 'blur(2px)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div style={{ position: 'absolute', left: '50%', bottom: isMobile ? 14 : 20, transform: 'translateX(-50%)' }}>
                    <button
                      onClick={() => setTabExpanded((prev) => ({ ...prev, description: !prev.description }))}
                      style={{ border: `1px solid ${PINK_LIGHT}`, background: '#fff', color: PINK, borderRadius: 999, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(15,23,42,0.10)' }}
                    >
                      See more
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Specifications Tab */}
          {activeTab === 'specifications' && (
            <div style={{ maxWidth: 680 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 20, paddingBottom: 10, borderBottom: `2px solid ${PINK_LIGHT}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 4, height: 22, background: PINK, borderRadius: 2, display: 'inline-block' }} />
                Product Specifications
              </h2>
              <div style={{ border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 16, overflow: 'hidden' }}>
                {(tabExpanded.specifications
                  ? [
                    { label: 'Category', value: product.category?.name || 'Beauty' },
                    { label: 'Shelf Life', value: '24 months' },
                    { label: 'Storage', value: 'Keep in cool, dry place' },
                    { label: 'Country of Origin', value: 'Bangladesh' },
                    { label: 'Certified', value: 'ISO 22716, Halal Certified' },
                    { label: 'Packaging', value: 'Premium Glass/Bottle' },
                  ]
                  : [
                  { label: 'Category', value: product.category?.name || 'Beauty' },
                  { label: 'Shelf Life', value: '24 months' },
                  { label: 'Storage', value: 'Keep in cool, dry place' },
                  ]).map((s, i, arr) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', gap: isMobile ? 6 : 0, padding: '13px 20px', borderBottom: i < arr.length - 1 ? `1px solid ${PINK_LIGHT}` : 'none', background: i % 2 === 1 ? PINK_PALE : '#fff' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: GRAY }}>{s.label}</span>
                    <span style={{ fontSize: 13, color: DARK }}>{s.value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setTabExpanded((prev) => ({ ...prev, specifications: !prev.specifications }))}
                style={{ marginTop: 14, border: `1px solid ${PINK_LIGHT}`, background: '#fff', color: PINK, borderRadius: 999, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {tabExpanded.specifications ? 'See less' : 'See more'}
              </button>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 20, paddingBottom: 10, borderBottom: `2px solid ${PINK_LIGHT}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 4, height: 22, background: PINK, borderRadius: 2, display: 'inline-block' }} />
                Customer Reviews
              </h2>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 32, alignItems: isMobile ? 'stretch' : 'center', background: '#fff', border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 20, padding: isMobile ? '18px 16px' : '24px 28px', marginBottom: 32, maxWidth: 680 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 52, fontWeight: 800, color: DARK, lineHeight: 1 }}>4.8</div>
                  <span style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} width={18} height={18} viewBox="0 0 20 20" fill="#f59e0b"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                  </span>
                  <p style={{ fontSize: 12, color: GRAY_LIGHT, marginTop: 4 }}>284 reviews</p>
                </div>
                <div style={{ flex: 1 }}>
                  {[5, 4, 3, 2, 1].map((n) => {
                    const pct = n === 5 ? 68 : n === 4 ? 22 : n === 3 ? 6 : n === 2 ? 3 : 1;
                    return (
                      <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: GRAY, width: 10 }}>{n}</span>
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="#f59e0b"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <div style={{ flex: 1, height: 8, borderRadius: 999, background: PINK_PALE, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: PINK, borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 11, color: GRAY_LIGHT, width: 28 }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                {(tabExpanded.reviews ? mockReviews : mockReviews.slice(0, 2)).map((r, i) => (
                  <div key={i} style={{ background: '#fff', border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 18, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: PINK_PALE, color: PINK, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.name[0]}</div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{r.name}</p>
                          {r.verified && <p style={{ fontSize: 11, color: '#059669', fontWeight: 500 }}>✓ Verified Purchase</p>}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: GRAY_LIGHT }}>{r.date}</span>
                    </div>
                    <span style={{ display: 'flex', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg key={s} width={13} height={13} viewBox="0 0 20 20" fill={s <= r.rating ? '#f59e0b' : '#e5e7eb'}><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </span>
                    <p style={{ fontSize: 13, color: GRAY, lineHeight: 1.7, marginTop: 10 }}>{r.text}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setTabExpanded((prev) => ({ ...prev, reviews: !prev.reviews }))}
                style={{ marginTop: 14, border: `1px solid ${PINK_LIGHT}`, background: '#fff', color: PINK, borderRadius: 999, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {tabExpanded.reviews ? 'See less' : 'See more'}
              </button>
            </div>
          )}

          {/* FAQs Tab */}
          {activeTab === 'faqs' && (
            <div style={{ maxWidth: 720 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 20, paddingBottom: 10, borderBottom: `2px solid ${PINK_LIGHT}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 4, height: 22, background: PINK, borderRadius: 2, display: 'inline-block' }} />
                Frequently Asked Questions
              </h2>
              {(tabExpanded.faqs ? mockFaqs : mockFaqs.slice(0, 2)).map((faq, i) => (
                <div key={i} onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)} style={{ border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 14, marginBottom: 10, overflow: 'hidden', cursor: 'pointer', background: openFaqIndex === i ? PINK_PALE : '#fff' }}>
                  <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: DARK, paddingRight: 20 }}>{faq.q}</p>
                    <span style={{ color: PINK, fontSize: 18, fontWeight: 700, flexShrink: 0, transform: openFaqIndex === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>+</span>
                  </div>
                  {openFaqIndex === i && (
                    <div style={{ padding: '12px 20px 16px', fontSize: 13, color: GRAY, lineHeight: 1.75, borderTop: `1px solid ${PINK_LIGHT}` }}>{faq.a}</div>
                  )}
                </div>
              ))}
              <button
                onClick={() => setTabExpanded((prev) => ({ ...prev, faqs: !prev.faqs }))}
                style={{ marginTop: 6, border: `1px solid ${PINK_LIGHT}`, background: '#fff', color: PINK, borderRadius: 999, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {tabExpanded.faqs ? 'See less' : 'See more'}
              </button>
            </div>
          )}
        </div>

        {/* Related Products - LAST for better scroll engagement */}
        <div style={{ marginTop: isMobile ? 48 : 80, padding: isMobile ? '24px 16px' : '40px 32px', background: '#fcfcfc', borderRadius: isMobile ? 20 : 32, border: `1px solid ${PINK_LIGHT}` }}>
          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 0, marginBottom: 32 }}>
            <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: DARK, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 6, height: 28, background: PINK, borderRadius: 3, display: 'inline-block' }} />
              You Might Also Like
            </h2>
            <Link href="/shop" style={{ color: PINK, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>View All →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : (isTablet ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)'), gap: isMobile ? 12 : 24 }}>
            {relatedProducts.map((name, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${PINK_LIGHT}`, borderRadius: isMobile ? 16 : 24, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(233,30,140,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)'; }}>
                <div style={{ height: isMobile ? 120 : 180, background: 'linear-gradient(135deg,#fdf2f8,#fce7f3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="60" height="100" viewBox="0 0 50 90" fill="none">
                    <rect x="18" y="0" width="14" height="6" rx="2" fill={PINK} opacity="0.6" />
                    <rect x="10" y="10" width="30" height="70" rx="10" fill="white" fillOpacity="0.8" stroke={PINK} strokeWidth="1" />
                  </svg>
                </div>
                <div style={{ padding: isMobile ? '12px' : '20px' }}>
                  <span style={{ fontSize: 10, color: PINK, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>SKINCARE</span>
                  <p style={{ fontSize: 14, fontWeight: 700, color: DARK, marginTop: 6, marginBottom: 12, lineHeight: 1.4 }}>{name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: DARK }}>৳ {(1200 + i * 200).toLocaleString()}</span>
                    <button style={{ width: 32, height: 32, borderRadius: 10, background: PINK, color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: `0 4px 10px ${PINK}44` }}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>


      <Footer />

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: 0 }}>
          <div style={{ width: '100%', maxWidth: 448, background: '#fff', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            {/* Header */}
            <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid #f3e0ea`, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '20px 24px', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: DARK }}>Complete Your Order</h2>
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#059669', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 999, width: 'fit-content' }}>
                  <Clock size={12} /> Cash on Delivery
                </div>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} style={{ borderRadius: '50%', padding: 8, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ overflowY: 'auto', maxHeight: 'calc(95vh - 80px)', padding: '24px' }}>
              {/* Order Summary */}
              <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, background: PINK_PALE, padding: 16, border: `1px solid ${PINK_LIGHT}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', width: 48, height: 48, flexShrink: 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8, background: '#fff', border: `1px solid ${PINK_LIGHT}`, padding: 4 }}>
                    <img src={images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                  </div>
                  <div style={{ minWidth: 0, paddingRight: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                    <p style={{ marginTop: 4, fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>Qty: {safeQuantity}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Total</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: PINK }}>{formatMoney(subtotal)}</p>
                </div>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handlePlaceOrder();
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: DARK }}>Shipping Details</h3>

                <div>
                  <label style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>Full Name *</label>
                  <input required value={form.shippingName} onChange={(e) => handleFormField('shippingName', e.target.value)} style={{ width: '100%', borderRadius: 12, border: `1px solid ${PINK_LIGHT}`, background: '#f9fafb', padding: '12px 16px', fontSize: 13, outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.target.style.borderColor = PINK; e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`; }} onBlur={(e) => { e.target.style.borderColor = PINK_LIGHT; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} placeholder="e.g. Mahadi Hasan" />
                </div>

                <div>
                  <label style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>Phone Number *</label>
                  <input required value={form.shippingPhone} onChange={(e) => handleFormField('shippingPhone', e.target.value)} style={{ width: '100%', borderRadius: 12, border: `1px solid ${PINK_LIGHT}`, background: '#f9fafb', padding: '12px 16px', fontSize: 13, outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.target.style.borderColor = PINK; e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`; }} onBlur={(e) => { e.target.style.borderColor = PINK_LIGHT; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} placeholder="01XXXXXXXXX" />
                </div>

                <div>
                  <label style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>Shipping Address *</label>
                  <textarea required value={form.shippingAddress} onChange={(e) => handleFormField('shippingAddress', e.target.value)} style={{ width: '100%', borderRadius: 12, border: `1px solid ${PINK_LIGHT}`, background: '#f9fafb', padding: '12px 16px', fontSize: 13, outline: 'none', transition: 'all 0.2s', resize: 'none', fontFamily: 'inherit' }} onFocus={(e) => { e.target.style.borderColor = PINK; e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`; }} onBlur={(e) => { e.target.style.borderColor = PINK_LIGHT; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} rows={2} placeholder="House, road, area" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>City *</label>
                    <input required value={form.shippingCity} onChange={(e) => handleFormField('shippingCity', e.target.value)} style={{ width: '100%', borderRadius: 12, border: `1px solid ${PINK_LIGHT}`, background: '#f9fafb', padding: '12px 16px', fontSize: 13, outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.target.style.borderColor = PINK; e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`; }} onBlur={(e) => { e.target.style.borderColor = PINK_LIGHT; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div>
                    <label style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>Postal Code</label>
                    <input value={form.shippingPostal} onChange={(e) => handleFormField('shippingPostal', e.target.value)} style={{ width: '100%', borderRadius: 12, border: `1px solid ${PINK_LIGHT}`, background: '#f9fafb', padding: '12px 16px', fontSize: 13, outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.target.style.borderColor = PINK; e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`; }} onBlur={(e) => { e.target.style.borderColor = PINK_LIGHT; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                </div>

                <div>
                  <label style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>Order Notes (Optional)</label>
                  <textarea value={form.notes} onChange={(e) => handleFormField('notes', e.target.value)} style={{ width: '100%', borderRadius: 12, border: `1px solid ${PINK_LIGHT}`, background: '#f9fafb', padding: '12px 16px', fontSize: 13, outline: 'none', transition: 'all 0.2s', resize: 'none', fontFamily: 'inherit' }} onFocus={(e) => { e.target.style.borderColor = PINK; e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`; }} onBlur={(e) => { e.target.style.borderColor = PINK_LIGHT; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} rows={2} placeholder="Special instructions for delivery" />
                </div>

                <div style={{ marginTop: 16 }}>
                  <button type="submit" disabled={codMutation.isPending} style={{ display: 'flex', width: '100%', height: 56, alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, background: DARK, padding: '0 24px', fontSize: 16, fontWeight: 700, color: '#fff', transition: 'all 0.3s', border: 'none', cursor: codMutation.isPending ? 'not-allowed' : 'pointer', opacity: codMutation.isPending ? 0.6 : 1 }}>
                    {codMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" /> Processing...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={20} /> Complete Purchase
                      </>
                    )}
                  </button>
                  <p style={{ marginTop: 16, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>
                    By completing this purchase, you agree to pay <span style={{ color: DARK }}>{formatMoney(subtotal)}</span> at your doorstep.
                  </p>
                </div>
              </form>

              <div style={{ marginTop: 16 }}>
                <button onClick={() => setIsCheckoutOpen(false)} disabled={codMutation.isPending} style={{ width: '100%', height: 44, borderRadius: 12, background: '#fff', border: `1px solid ${PINK_LIGHT}`, color: DARK, fontSize: 14, fontWeight: 600, cursor: codMutation.isPending ? 'not-allowed' : 'pointer', opacity: codMutation.isPending ? 0.6 : 1 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
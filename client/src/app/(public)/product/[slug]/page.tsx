'use client';

import { useProductBySlug } from '@/modules/products';
import { ordersAPI, type CreateCodOrderRequest } from '@/modules/orders/api';
import { SkeletonCard, ErrorMessage, EmptyState, LoadingSpinner } from '@/shared/components';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ChevronRight, Clock, ShieldCheck, ShoppingBag, Truck, X, Heart, Share2, Star, Zap, TrendingUp } from 'lucide-react';

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
  
  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrderSummary | null>(null);
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
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#fafafa', minHeight: '100vh', color: DARK }}>
      {/* Top Banner */}
      <div style={{ background: PINK, color: '#fff', textAlign: 'center', padding: '8px 16px', fontSize: 13, fontWeight: 500, letterSpacing: '0.04em' }}>
        🎁 Free delivery on orders over ৳ 999 · Use code <strong>GLOW10</strong> for 10% off
      </div>

      {/* Navbar */}
      <nav style={{ background: '#fff', borderBottom: `1px solid ${PINK_LIGHT}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 40 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 22, color: PINK, letterSpacing: '-0.02em', textDecoration: 'none' }}>mouchak</Link>
        <div style={{ display: 'flex', gap: 24, fontSize: 14, fontWeight: 500, color: GRAY }}>
          {['Skincare', 'Makeup', 'Haircare', 'Combos'].map((n) => (
            <span key={n} style={{ cursor: 'pointer' }}>{n}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setWishlist(!wishlist)}>
            <Heart width="20" height="20" color={GRAY} fill={wishlist ? PINK : 'none'} strokeWidth={1.8} />
          </button>
          <div style={{ position: 'relative' }}>
            <ShoppingBag size={20} color={GRAY} strokeWidth={1.8} />
            <span style={{ position: 'absolute', top: -6, right: -6, background: PINK, color: '#fff', borderRadius: 999, width: 16, height: 16, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: GRAY_LIGHT }}>
        <Link href="/" style={{ color: GRAY, fontWeight: 400, cursor: 'pointer', textDecoration: 'none' }}>Home</Link>
        <span style={{ color: GRAY_LIGHT }}>›</span>
        <Link href="/shop" style={{ color: GRAY, fontWeight: 400, cursor: 'pointer', textDecoration: 'none' }}>Shop</Link>
        <span style={{ color: GRAY_LIGHT }}>›</span>
        {product.category?.name && <span style={{ color: GRAY, fontWeight: 400 }}>{product.category.name}</span>}
        {product.category?.name && <span style={{ color: GRAY_LIGHT }}>›</span>}
        <span style={{ color: PINK, fontWeight: 600 }}>{product.name}</span>
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
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'flex-start' }}>
          {/* LEFT: Gallery */}
          <div style={{ position: 'sticky', top: 90 }}>
            {/* Main Image */}
            <div style={{ borderRadius: 24, overflow: 'hidden', border: `1.5px solid ${PINK_LIGHT}`, background: PINK_PALE, height: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.3s' }}>
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
                  <div key={i} onClick={() => setActiveImageIndex(i)} style={{ borderRadius: 14, border: `1.5px solid ${i === activeImageIndex ? PINK : PINK_LIGHT}`, background: PINK_PALE, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', fontSize: 10, color: GRAY, fontWeight: 600, overflow: 'hidden' }}>
                    <img src={img} alt={`thumb ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Share Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
              <span style={{ fontSize: 12, color: GRAY_LIGHT, fontWeight: 500 }}>Share:</span>
              {['Facebook', 'Instagram', 'WhatsApp', 'Copy link'].map((s) => (
                <button key={s} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, border: `1px solid ${PINK_LIGHT}`, color: GRAY, fontWeight: 500, transition: 'all 0.2s', background: '#fff', cursor: 'pointer' }}>{s}</button>
              ))}
            </div>
          </div>

          {/* RIGHT: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
              <h1 style={{ fontSize: 28, fontWeight: 800, color: DARK, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
                {product.name}
              </h1>
              <p style={{ fontSize: 13, color: GRAY_LIGHT, marginTop: 4 }}>SKU: {product.id}</p>
            </div>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            <div style={{ background: PINK_PALE, borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 34, fontWeight: 800, color: PINK }}>{formatMoney(price)}</span>
              {hasDiscount && (
                <div>
                  <span style={{ fontSize: 16, color: GRAY_LIGHT, textDecoration: 'line-through', display: 'block' }}>{formatMoney(compareAtPrice)}</span>
                  <span style={{ background: PINK, color: '#fff', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>Save {discountPercent}%</span>
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: inStock ? '#059669' : '#ef4444', display: 'inline-block' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: inStock ? '#059669' : '#ef4444' }}>
                {inStock ? 'In Stock' : 'Out of Stock'}
              </span>
              {inStock && <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>Only {availableStock} left!</span>}
            </div>

            {/* Quantity Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: GRAY }}>Quantity:</p>
              <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                <button onClick={() => updateQuantity(safeQuantity - 1)} style={{ width: 40, height: 40, fontSize: 18, fontWeight: 700, color: GRAY, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}>−</button>
                <span style={{ width: 40, textAlign: 'center', fontSize: 15, fontWeight: 700, color: DARK }}>{safeQuantity}</span>
                <button onClick={() => updateQuantity(safeQuantity + 1)} style={{ width: 40, height: 40, fontSize: 18, fontWeight: 700, color: GRAY, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button onClick={handleBuyNowClick} disabled={!inStock} style={{ flex: 1, padding: '14px 20px', borderRadius: 14, background: inStock ? PINK : '#d1d5db', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: inStock ? 'pointer' : 'not-allowed', transition: 'all 0.3s', boxShadow: `0 6px 20px ${PINK}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ShoppingBag size={18} />
                {inStock ? 'Buy Now' : 'Out of Stock'}
              </button>
              <button onClick={handleBuyNowClick} disabled={!inStock} style={{ flex: 1, padding: '14px 20px', borderRadius: 14, background: DARK, color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: inStock ? 'pointer' : 'not-allowed', transition: 'all 0.3s', opacity: inStock ? 1 : 0.5 }}>
                Order with COD →
              </button>
            </div>

            {/* Trust Signals */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              {[
                { icon: '🔒', label: 'Secure Checkout', sub: 'SSL encrypted' },
                { icon: '🚚', label: 'Fast Delivery', sub: '2–4 business days' },
                { icon: '↩️', label: 'Easy Returns', sub: '15-day policy' },
                { icon: '⭐', label: 'Authentic', sub: '100% genuine' },
              ].map((t) => (
                <div key={t.label} style={{ background: '#fff', border: `1px solid ${PINK_LIGHT}`, borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: DARK }}>{t.label}</p>
                    <p style={{ fontSize: 11, color: GRAY_LIGHT }}>{t.sub}</p>
                  </div>
                </div>
              ))}
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

        {/* TABS SECTION */}
        <div style={{ marginTop: 64 }}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${PINK_LIGHT}`, marginBottom: 36 }}>
            {(['description', 'specifications', 'reviews', 'faqs'] as TabType[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '12px 28px', fontSize: 14, fontWeight: 600, color: activeTab === tab ? PINK : GRAY, borderBottom: `2px solid ${activeTab === tab ? PINK : 'transparent'}`, marginBottom: -2, textTransform: 'capitalize', letterSpacing: '0.02em', transition: 'all 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}>
                {tab === 'faqs' ? 'FAQs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Description Tab */}
          {activeTab === 'description' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 20, paddingBottom: 10, borderBottom: `2px solid ${PINK_LIGHT}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 4, height: 22, background: PINK, borderRadius: 2, display: 'inline-block' }} />
                  Full Description
                </h2>
                <p style={{ fontSize: 14, color: GRAY, lineHeight: 1.85, marginBottom: 16 }}>
                  {product.description || 'This premium product is formulated with the finest ingredients to deliver exceptional results. Crafted with care and backed by scientific research, it offers powerful benefits for daily use.'}
                </p>
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 20, paddingBottom: 10, borderBottom: `2px solid ${PINK_LIGHT}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 4, height: 22, background: PINK, borderRadius: 2, display: 'inline-block' }} />
                  Features & Benefits
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { icon: '✦', title: 'Premium Quality', desc: 'Made with the finest ingredients sourced globally.' },
                    { icon: '✦', title: 'Dermatologist Tested', desc: 'Safe and effective for all skin types.' },
                    { icon: '✦', title: 'Fast Results', desc: 'Visible improvements in 2-4 weeks.' },
                    { icon: '✦', title: 'Clean Beauty', desc: 'Free from harmful chemicals and additives.' },
                  ].map((f, i) => (
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
          )}

          {/* Specifications Tab */}
          {activeTab === 'specifications' && (
            <div style={{ maxWidth: 680 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 20, paddingBottom: 10, borderBottom: `2px solid ${PINK_LIGHT}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 4, height: 22, background: PINK, borderRadius: 2, display: 'inline-block' }} />
                Product Specifications
              </h2>
              <div style={{ border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 16, overflow: 'hidden' }}>
                {[
                  { label: 'Category', value: product.category?.name || 'Beauty' },
                  { label: 'Shelf Life', value: '24 months' },
                  { label: 'Storage', value: 'Keep in cool, dry place' },
                  { label: 'Country of Origin', value: 'Bangladesh' },
                  { label: 'Certified', value: 'ISO 22716, Halal Certified' },
                  { label: 'Packaging', value: 'Premium Glass/Bottle' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', padding: '13px 20px', borderBottom: i < 5 ? `1px solid ${PINK_LIGHT}` : 'none', background: i % 2 === 1 ? PINK_PALE : '#fff' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: GRAY }}>{s.label}</span>
                    <span style={{ fontSize: 13, color: DARK }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 20, paddingBottom: 10, borderBottom: `2px solid ${PINK_LIGHT}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 4, height: 22, background: PINK, borderRadius: 2, display: 'inline-block' }} />
                Customer Reviews
              </h2>
              {/* Summary */}
              <div style={{ display: 'flex', gap: 32, alignItems: 'center', background: '#fff', border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 20, padding: '24px 28px', marginBottom: 32, maxWidth: 680 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 52, fontWeight: 800, color: DARK, lineHeight: 1 }}>4.8</div>
                  <span style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} width={18} height={18} viewBox="0 0 20 20" fill="#f59e0b">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
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
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="#f59e0b"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        <div style={{ flex: 1, height: 8, borderRadius: 999, background: PINK_PALE, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: PINK, borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 11, color: GRAY_LIGHT, width: 28 }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {mockReviews.map((r, i) => (
                  <div key={i} style={{ background: '#fff', border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 18, padding: '18px 20px', transition: 'box-shadow 0.2s', cursor: 'pointer' }}>
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
                        <svg key={s} width={13} height={13} viewBox="0 0 20 20" fill={s <= r.rating ? '#f59e0b' : '#e5e7eb'}>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </span>
                    <p style={{ fontSize: 13, color: GRAY, lineHeight: 1.7, marginTop: 10 }}>{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs Tab */}
          {activeTab === 'faqs' && (
            <div style={{ maxWidth: 720 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 20, paddingBottom: 10, borderBottom: `2px solid ${PINK_LIGHT}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 4, height: 22, background: PINK, borderRadius: 2, display: 'inline-block' }} />
                Frequently Asked Questions
              </h2>
              {mockFaqs.map((faq, i) => (
                <div key={i} onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)} style={{ border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 14, marginBottom: 10, overflow: 'hidden', cursor: 'pointer', transition: 'background 0.2s', background: openFaqIndex === i ? PINK_PALE : '#fff' }}>
                  <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: DARK, paddingRight: 20 }}>{faq.q}</p>
                    <span style={{ color: PINK, fontSize: 18, fontWeight: 700, flexShrink: 0, transform: openFaqIndex === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                  </div>
                  {openFaqIndex === i && (
                    <div style={{ padding: '0 20px 16px', fontSize: 13, color: GRAY, lineHeight: 1.75, borderTop: `1px solid ${PINK_LIGHT}`, paddingTop: 12 }}>{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Brand Info */}
        <div style={{ marginTop: 64, background: 'linear-gradient(135deg, #fce7f3 0%, #fff 60%)', border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 24, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: PINK, color: '#fff', fontWeight: 800, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>M</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: DARK }}>Mouchak Cosmetics</h3>
              <span style={{ background: PINK_PALE, color: PINK, borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>Official Brand</span>
            </div>
            <p style={{ fontSize: 13, color: GRAY, lineHeight: 1.7 }}>Bangladesh's leading clean beauty brand, crafting dermatologist-tested skincare and cosmetics with ethically sourced, halal-certified ingredients. Trusted by 200,000+ customers since 2018.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <button style={{ padding: '10px 22px', borderRadius: 12, background: PINK, color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Visit Brand Store →</button>
            <button style={{ padding: '10px 22px', borderRadius: 12, background: 'transparent', color: PINK, fontSize: 13, fontWeight: 700, border: `1.5px solid ${PINK}`, cursor: 'pointer' }}>Follow</button>
          </div>
        </div>

        {/* Certification Badges */}
        <div style={{ display: 'flex', gap: 16, marginTop: 28, flexWrap: 'wrap' }}>
          {['🌿 Halal Certified', '🐰 Cruelty Free', '♻️ Eco Packaging', '🔬 Dermatologist Tested', '🏆 ISO 22716'].map((b) => (
            <span key={b} style={{ background: '#fff', border: `1px solid ${PINK_LIGHT}`, borderRadius: 999, padding: '6px 16px', fontSize: 12, fontWeight: 600, color: GRAY }}>{b}</span>
          ))}
        </div>

        {/* Related Products */}
        <div style={{ marginTop: 64 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 20, paddingBottom: 10, borderBottom: `2px solid ${PINK_LIGHT}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 4, height: 22, background: PINK, borderRadius: 2, display: 'inline-block' }} />
            You Might Also Like
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {['Rose Petal Toner', 'Glow Moisturizer SPF 30', 'Niacinamide Serum', 'Vitamin C Eye Cream'].map((name, i) => (
              <div key={i} style={{ background: '#fff', border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 20, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 2px 8px rgba(233,30,140,0.04)' }}>
                <div style={{ height: 150, background: 'linear-gradient(135deg,#fce7f3,#f9a8d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="50" height="90" viewBox="0 0 50 90" fill="none">
                    <rect x="18" y="0" width="14" height="6" rx="2" fill={PINK} opacity="0.6"/>
                    <rect x="10" y="10" width="30" height="70" rx="10" fill="white" fillOpacity="0.8" stroke={PINK} strokeWidth="1"/>
                  </svg>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: 10, color: PINK, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>SKINCARE</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: DARK, marginTop: 4, marginBottom: 8, lineHeight: 1.4 }}>{name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: PINK }}>৳ {(1200 + i * 200).toLocaleString()}</span>
                    <button style={{ width: 30, height: 30, borderRadius: '50%', background: PINK, color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: DARK, color: '#9ca3af', padding: '40px 24px 24px', marginTop: 80 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 26, color: PINK, marginBottom: 12 }}>mouchak</div>
              <p style={{ fontSize: 13, lineHeight: 1.75 }}>Clean beauty, consciously crafted. Skincare and cosmetics that are good for you and the planet.</p>
            </div>
            {[
              { title: 'Products', links: ['Skincare', 'Makeup', 'Haircare', 'Combos'] },
              { title: 'Company', links: ['About Us', 'Blog', 'Careers', 'Press'] },
              { title: 'Support', links: ['Help Center', 'Track Order', 'Returns', 'Contact'] },
            ].map((col) => (
              <div key={col.title}>
                <p style={{ fontWeight: 700, color: '#e5e7eb', marginBottom: 14, fontSize: 14 }}>{col.title}</p>
                {col.links.map((l) => <p key={l} style={{ fontSize: 13, marginBottom: 8, cursor: 'pointer' }}>{l}</p>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #374151', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
            <span>© 2025 Mouchak Cosmetics. All rights reserved.</span>
            <span>Made with ♥ in Bangladesh</span>
          </div>
        </div>
      </footer>

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
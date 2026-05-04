'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useProductBySlug } from '@/modules/products';
import { ordersAPI, type CreateCodOrderRequest } from '@/modules/orders/api';
import { useMutation } from '@tanstack/react-query';
import { SkeletonCard, ErrorMessage, LoadingSpinner } from '@/shared/components';
import { Clock, ShieldCheck, Check, Wallet } from 'lucide-react';

import { Header } from '@/modules/homepage/components/Header';
import { Footer } from '@/modules/homepage/components/Footer';
import { useHomepageStats } from '@/modules/homepage';

const BANGLADESH_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

function formatMoney(value?: number | string | null) {
  return `৳${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as any;
    return (
      maybeError.response?.data?.message ||
      maybeError.response?.data?.error ||
      maybeError.message ||
      'Failed to place order'
    );
  }
  return 'Failed to place order';
}

interface CheckoutFormState {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostal: string;
  shippingCountry: string;
  notes: string;
}


function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const slug = searchParams.get('slug') || '';
  const initialQty = parseInt(searchParams.get('qty') || '1', 10);
  

  const [quantity, setQuantity] = useState(initialQty > 0 ? initialQty : 1);
  const [form, setForm] = useState<CheckoutFormState>({
    shippingName: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCity: 'Dhaka',
    shippingPostal: '',
    shippingCountry: 'Bangladesh',
    notes: '',
  });

  const { data: stats } = useHomepageStats();
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET'>('CASH');
  const [transactionId, setTransactionId] = useState('');

  const activeMethods = useMemo(() => {
    // Always allow CASH as a fallback or if no other methods are active
    const methods = stats?.paymentMethods?.filter(m => m.isActive) || [];
    if (!methods.find(m => m.name === 'CASH')) {
      methods.unshift({ id: -1, name: 'CASH', isActive: true } as any);
    }
    return methods;
  }, [stats]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Please login to continue');
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
    } else if (status === 'authenticated' && session?.user) {
      setForm(prev => ({
        ...prev,
        shippingName: prev.shippingName || session.user?.name || '',
      }));
    }
  }, [status, router, session]);

  const { data: product, isLoading, isError, error } = useProductBySlug(slug);

  const images = useMemo(() => {
    if (!product?.images?.length) {
      return ['/placeholder.png'];
    }
    return product.images;
  }, [product]);

  const codMutation = useMutation({
    mutationFn: async (payload: CreateCodOrderRequest) => ordersAPI.createCodOrder(payload),
    onSuccess: () => {
      toast.success('Order placed! Track it in your dashboard.');
      router.push('/dashboard?tab=order');
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage(mutationError));
    },
  });

  const availableStock = useMemo(() => {
    return (product?.inventories || []).reduce((total, inventory) => {
      const available = Math.max(0, (inventory.quantity || 0) - (inventory.reservedQty || 0));
      return total + available;
    }, 0);
  }, [product]);

  const inStock = availableStock > 0;
  const maxAllowedQuantity = inStock ? Math.min(availableStock, 10) : 0;
  const safeQuantity = inStock ? Math.min(Math.max(1, quantity), maxAllowedQuantity || 1) : 1;
  const price = Number(product?.price || 0);
  const subtotal = price * safeQuantity;

  const handleFormField = <T extends keyof CheckoutFormState>(field: T, value: CheckoutFormState[T]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async () => {
    if (!product) return;
    if (codMutation.isPending) return;
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
    
    if (paymentMethod !== 'CASH' && !transactionId.trim()) {
      toast.error('Please enter the Transaction ID for your payment.');
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
      paymentMethod,
      transactionId: paymentMethod !== 'CASH' ? transactionId.trim() : undefined,
    });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
          <SkeletonCard />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product || isError) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
          <ErrorMessage message={getErrorMessage(error) || "Product not found"} />
        </main>
        <Footer />
      </div>
    );
  }

  const PINK = '#e91e8c';
  const PINK_LIGHT = '#f3e0ea';
  const PINK_PALE = '#fce7f3';
  const DARK = '#1f2937';
  const GRAY = '#4b5563';


  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
        <h1 className="text-2xl font-bold text-zinc-900 mb-6 px-2">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-10 items-start">
          {/* LEFT COLUMN: Shipping Details */}
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden p-6 sm:p-8">
            <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: DARK, borderBottom: `2px solid ${PINK_LIGHT}`, paddingBottom: 10, marginBottom: 20 }}>Shipping Details</h3>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handlePlaceOrder();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div>
                <label style={{ marginBottom: 8, display: 'block', fontSize: 14, fontWeight: 600, color: '#374151' }}>Full Name *</label>
                <input required value={form.shippingName} onChange={(e) => handleFormField('shippingName', e.target.value)} style={{ width: '100%', borderRadius: 12, border: `1.5px solid ${PINK_LIGHT}`, background: '#f9fafb', padding: '14px 16px', fontSize: 14, outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.target.style.borderColor = PINK; e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`; }} onBlur={(e) => { e.target.style.borderColor = PINK_LIGHT; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} placeholder="e.g. Mahadi Hasan" />
              </div>

              <div>
                <label style={{ marginBottom: 8, display: 'block', fontSize: 14, fontWeight: 600, color: '#374151' }}>Phone Number *</label>
                <input required value={form.shippingPhone} onChange={(e) => handleFormField('shippingPhone', e.target.value)} style={{ width: '100%', borderRadius: 12, border: `1.5px solid ${PINK_LIGHT}`, background: '#f9fafb', padding: '14px 16px', fontSize: 14, outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.target.style.borderColor = PINK; e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`; }} onBlur={(e) => { e.target.style.borderColor = PINK_LIGHT; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} placeholder="01XXXXXXXXX" />
              </div>

              <div>
                <label style={{ marginBottom: 8, display: 'block', fontSize: 14, fontWeight: 600, color: '#374151' }}>Shipping Address *</label>
                <textarea required value={form.shippingAddress} onChange={(e) => handleFormField('shippingAddress', e.target.value)} style={{ width: '100%', borderRadius: 12, border: `1.5px solid ${PINK_LIGHT}`, background: '#f9fafb', padding: '14px 16px', fontSize: 14, outline: 'none', transition: 'all 0.2s', resize: 'none', fontFamily: 'inherit' }} onFocus={(e) => { e.target.style.borderColor = PINK; e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`; }} onBlur={(e) => { e.target.style.borderColor = PINK_LIGHT; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} rows={3} placeholder="House, road, area" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ marginBottom: 8, display: 'block', fontSize: 14, fontWeight: 600, color: '#374151' }}>City *</label>
                  <input required value={form.shippingCity} onChange={(e) => handleFormField('shippingCity', e.target.value)} style={{ width: '100%', borderRadius: 12, border: `1.5px solid ${PINK_LIGHT}`, background: '#f9fafb', padding: '14px 16px', fontSize: 14, outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.target.style.borderColor = PINK; e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`; }} onBlur={(e) => { e.target.style.borderColor = PINK_LIGHT; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} />
                </div>
                <div>
                  <label style={{ marginBottom: 8, display: 'block', fontSize: 14, fontWeight: 600, color: '#374151' }}>Postal Code</label>
                  <input value={form.shippingPostal} onChange={(e) => handleFormField('shippingPostal', e.target.value)} style={{ width: '100%', borderRadius: 12, border: `1.5px solid ${PINK_LIGHT}`, background: '#f9fafb', padding: '14px 16px', fontSize: 14, outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.target.style.borderColor = PINK; e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`; }} onBlur={(e) => { e.target.style.borderColor = PINK_LIGHT; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} />
                </div>
              </div>

              <div>
                <label style={{ marginBottom: 8, display: 'block', fontSize: 14, fontWeight: 600, color: '#374151' }}>Order Notes (Optional)</label>
                <textarea value={form.notes} onChange={(e) => handleFormField('notes', e.target.value)} style={{ width: '100%', borderRadius: 12, border: `1.5px solid ${PINK_LIGHT}`, background: '#f9fafb', padding: '14px 16px', fontSize: 14, outline: 'none', transition: 'all 0.2s', resize: 'none', fontFamily: 'inherit' }} onFocus={(e) => { e.target.style.borderColor = PINK; e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`; }} onBlur={(e) => { e.target.style.borderColor = PINK_LIGHT; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} rows={2} placeholder="Special instructions for delivery" />
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden sticky top-24 flex flex-col">
            <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-lg">Order Summary</h3>
              <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-500/30">
                {paymentMethod === 'CASH' ? <Clock size={14} /> : <Wallet size={14} />} 
                {paymentMethod === 'CASH' ? 'Cash on Delivery' : paymentMethod}
              </div>
            </div>
            
            <div className="p-5 sm:p-6 flex flex-col gap-6">
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 80, height: 80, flexShrink: 0, borderRadius: 12, border: `1.5px solid ${PINK_LIGHT}`, padding: 4, background: '#fff' }}>
                  <img src={images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: DARK, lineHeight: 1.4, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</p>
                  
                  {/* Quantity Selector */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 10, overflow: 'hidden', background: '#fff', width: 'fit-content' }}>
                    <button type="button" onClick={() => setQuantity(Math.max(1, safeQuantity - 1))} style={{ width: 30, height: 30, fontSize: 16, fontWeight: 700, color: GRAY, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}>−</button>
                    <span style={{ width: 32, textAlign: 'center', fontSize: 14, fontWeight: 700, color: DARK }}>{safeQuantity}</span>
                    <button type="button" onClick={() => setQuantity(Math.min(maxAllowedQuantity, safeQuantity + 1))} style={{ width: 30, height: 30, fontSize: 16, fontWeight: 700, color: GRAY, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
                  </div>
                </div>
              </div>

              <div style={{ background: PINK_PALE, borderRadius: 16, padding: '16px 20px', border: `1px solid ${PINK_LIGHT}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#4b5563', fontSize: 14 }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600 }}>{formatMoney(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: '#4b5563', fontSize: 14 }}>
                  <span>Shipping</span>
                  <span style={{ fontWeight: 600 }}>Calculated at next step</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1.5px dashed ${PINK_LIGHT}`, paddingTop: 16, alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#9ca3af' }}>Total Amount</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: PINK }}>{formatMoney(subtotal)}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-4">
                <label style={{ fontSize: 13, fontWeight: 700, color: DARK, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {activeMethods.map((m) => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setPaymentMethod(m.name as any)}
                      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all ${
                        paymentMethod === m.name
                          ? 'border-[#e91e8c] bg-[#fce7f3]/30'
                          : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-tight">{m.name}</span>
                      {paymentMethod === m.name && (
                        <div className="absolute -right-2 -top-2 rounded-full bg-[#e91e8c] p-0.5 text-white shadow-sm">
                          <Check size={12} strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {paymentMethod !== 'CASH' && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <label style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: DARK }}>
                      Transaction ID <span className="text-[#e91e8c]">*</span>
                    </label>
                    <input
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter TXN ID"
                      style={{
                        width: '100%',
                        borderRadius: 12,
                        border: `1.5px solid ${PINK_LIGHT}`,
                        background: '#fff',
                        padding: '12px 14px',
                        fontSize: 14,
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <button type="button" onClick={() => handlePlaceOrder()} disabled={codMutation.isPending} style={{ display: 'flex', width: '100%', height: 56, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, background: PINK, fontSize: 16, fontWeight: 800, color: '#fff', transition: 'all 0.3s', border: 'none', cursor: codMutation.isPending ? 'not-allowed' : 'pointer', opacity: codMutation.isPending ? 0.6 : 1, boxShadow: `0 8px 24px ${PINK}44` }}>
                  {codMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" /> Processing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={20} /> Confirm Order
                    </>
                  )}
                </button>
                <p style={{ marginTop: 16, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#6b7280', lineHeight: 1.5 }}>
                  By confirming, you agree to pay <span style={{ color: DARK, fontWeight: 700 }}>{formatMoney(subtotal)}</span> at your doorstep.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex flex-col"><Header /><main className="flex-1 container mx-auto px-4 py-12"><SkeletonCard /></main><Footer /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
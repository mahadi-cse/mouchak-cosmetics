'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense, useMemo } from 'react';
import toast from 'react-hot-toast';
import { ordersAPI, type CreateCodOrderRequest } from '@/modules/orders/api';
import { useMutation } from '@tanstack/react-query';
import { SkeletonCard, ErrorMessage, LoadingSpinner } from '@/shared/components';
import { Clock, ShieldCheck, Trash2 } from 'lucide-react';
import { useCart, type CartItem } from '@/shared/contexts/CartContext';
import { Header } from '@/modules/homepage/components/Header';
import { Footer } from '@/modules/homepage/components/Footer';

const BANGLADESH_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

function formatMoney(value?: number | string | null) {
  return `৳${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
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

function CartCheckoutContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items: cartItems, totalPrice, clearCart } = useCart();
  
  const [form, setForm] = useState<CheckoutFormState>({
    shippingName: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCity: 'Dhaka',
    shippingPostal: '',
    shippingCountry: 'Bangladesh',
    notes: '',
  });

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

  // Redirect if no items
  useEffect(() => {
    if (status === 'authenticated' && cartItems.length === 0) {
      toast.error('Your cart is empty');
      router.push('/shop');
    }
  }, [status, cartItems.length, router]);

  const codMutation = useMutation({
    mutationFn: async (payload: any) => {
      // Create orders for each cart item
      const orderPromises = cartItems.map((item) =>
        ordersAPI.createCodOrder({
          productId: Number(item.id),
          quantity: item.quantity,
          shippingName: form.shippingName.trim(),
          shippingPhone: form.shippingPhone.replace(/\s+/g, ''),
          shippingAddress: form.shippingAddress.trim(),
          shippingCity: form.shippingCity.trim(),
          shippingPostal: form.shippingPostal.trim() || undefined,
          shippingCountry: form.shippingCountry.trim() || 'Bangladesh',
          notes: form.notes.trim() || undefined,
        })
      );
      return Promise.all(orderPromises);
    },
    onSuccess: () => {
      clearCart();
      toast.success('Orders placed! Track them in your dashboard.');
      router.push('/dashboard?tab=order');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to place orders';
      toast.error(message);
    },
  });

  const handleFormField = <T extends keyof CheckoutFormState>(field: T, value: CheckoutFormState[T]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async () => {
    if (codMutation.isPending) return;
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
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

    await codMutation.mutateAsync({});
  };

  if (status === 'loading') {
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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
          <ErrorMessage message="Your cart is empty. Please add items before checkout." />
        </main>
        <Footer />
      </div>
    );
  }

  const PINK = '#e91e8c';
  const PINK_LIGHT = '#f3e0ea';
  const PINK_PALE = '#fce7f3';
  const DARK = '#1f2937';

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
        <h1 className="text-2xl font-bold text-zinc-900 mb-6 px-2">Cart Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-10 items-start">
          {/* LEFT COLUMN: Shipping Details from uat*/}
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden p-6 sm:p-8">
            <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: DARK, borderBottom: `2px solid ${PINK_LIGHT}`, paddingBottom: 10, marginBottom: 20 }}>
              Shipping Details
            </h3>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handlePlaceOrder();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div>
                <label style={{ marginBottom: 8, display: 'block', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  Full Name *
                </label>
                <input
                  required
                  value={form.shippingName}
                  onChange={(e) => handleFormField('shippingName', e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    border: `1.5px solid ${PINK_LIGHT}`,
                    background: '#f9fafb',
                    padding: '14px 16px',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = PINK;
                    e.target.style.background = '#fff';
                    e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = PINK_LIGHT;
                    e.target.style.background = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="e.g. Mahadi Hasan"
                />
              </div>

              <div>
                <label style={{ marginBottom: 8, display: 'block', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  Phone Number *
                </label>
                <input
                  required
                  value={form.shippingPhone}
                  onChange={(e) => handleFormField('shippingPhone', e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    border: `1.5px solid ${PINK_LIGHT}`,
                    background: '#f9fafb',
                    padding: '14px 16px',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = PINK;
                    e.target.style.background = '#fff';
                    e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = PINK_LIGHT;
                    e.target.style.background = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="01XXXXXXXXX"
                />
              </div>

              <div>
                <label style={{ marginBottom: 8, display: 'block', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  Shipping Address *
                </label>
                <textarea
                  required
                  value={form.shippingAddress}
                  onChange={(e) => handleFormField('shippingAddress', e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    border: `1.5px solid ${PINK_LIGHT}`,
                    background: '#f9fafb',
                    padding: '14px 16px',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.2s',
                    resize: 'none',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = PINK;
                    e.target.style.background = '#fff';
                    e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = PINK_LIGHT;
                    e.target.style.background = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                  rows={3}
                  placeholder="House, road, area"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ marginBottom: 8, display: 'block', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                    City *
                  </label>
                  <input
                    required
                    value={form.shippingCity}
                    onChange={(e) => handleFormField('shippingCity', e.target.value)}
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: `1.5px solid ${PINK_LIGHT}`,
                      background: '#f9fafb',
                      padding: '14px 16px',
                      fontSize: 14,
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = PINK;
                      e.target.style.background = '#fff';
                      e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = PINK_LIGHT;
                      e.target.style.background = '#f9fafb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={{ marginBottom: 8, display: 'block', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                    Postal Code
                  </label>
                  <input
                    value={form.shippingPostal}
                    onChange={(e) => handleFormField('shippingPostal', e.target.value)}
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: `1.5px solid ${PINK_LIGHT}`,
                      background: '#f9fafb',
                      padding: '14px 16px',
                      fontSize: 14,
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = PINK;
                      e.target.style.background = '#fff';
                      e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = PINK_LIGHT;
                      e.target.style.background = '#f9fafb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ marginBottom: 8, display: 'block', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  Order Notes (Optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleFormField('notes', e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    border: `1.5px solid ${PINK_LIGHT}`,
                    background: '#f9fafb',
                    padding: '14px 16px',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.2s',
                    resize: 'none',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = PINK;
                    e.target.style.background = '#fff';
                    e.target.style.boxShadow = `0 0 0 4px ${PINK_PALE}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = PINK_LIGHT;
                    e.target.style.background = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                  rows={2}
                  placeholder="Special instructions for delivery"
                />
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden sticky top-24 flex flex-col">
            <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-lg">Order Summary</h3>
              <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-500/30">
                <Clock size={14} /> Cash on Delivery
              </div>
            </div>

            <div className="p-5 sm:p-6 flex flex-col gap-6 flex-1 overflow-y-auto max-h-[calc(100vh-300px)]">
              {/* Cart Items List */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: `1px solid ${PINK_LIGHT}` }} className="last:border-0">
                    {item.image && (
                      <div style={{ width: 60, height: 60, flexShrink: 0, borderRadius: 8, border: `1.5px solid ${PINK_LIGHT}`, overflow: 'hidden' }}>
                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: DARK, marginBottom: 4 }} className="truncate">
                        {item.name}
                      </p>
                      <p style={{ fontSize: 12, color: '#6b7280' }}>
                        {item.quantity}x ৳{item.price}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: PINK, marginTop: 4 }}>
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: PINK_PALE, borderRadius: 16, padding: '16px 20px', border: `1px solid ${PINK_LIGHT}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#4b5563', fontSize: 14 }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600 }}>{formatMoney(totalPrice)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: '#4b5563', fontSize: 14 }}>
                  <span>Shipping</span>
                  <span style={{ fontWeight: 600 }}>Calculated at next step</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1.5px dashed ${PINK_LIGHT}`, paddingTop: 16, alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#9ca3af' }}>
                    Total Amount
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: PINK }}>{formatMoney(totalPrice)}</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handlePlaceOrder()}
                  disabled={codMutation.isPending}
                  style={{
                    display: 'flex',
                    width: '100%',
                    height: 56,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    borderRadius: 14,
                    background: PINK,
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#fff',
                    transition: 'all 0.3s',
                    border: 'none',
                    cursor: codMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: codMutation.isPending ? 0.6 : 1,
                    boxShadow: `0 8px 24px ${PINK}44`,
                  }}
                >
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
                  By confirming, you agree to pay <span style={{ color: DARK, fontWeight: 700 }}>{formatMoney(totalPrice)}</span> at your doorstep.
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

export default function CartCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex flex-col">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-12">
            <SkeletonCard />
          </main>
          <Footer />
        </div>
      }
    >
      <CartCheckoutContent />
    </Suspense>
  );
}

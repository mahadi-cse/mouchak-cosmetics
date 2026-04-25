'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  useAddCustomerWishlistItem,
  useCustomerDashboardOrders,
  useCustomerDashboardProfile,
  useCustomerDashboardSummary,
  useCustomerOrderTracking,
  useCustomerWishlist,
  useRemoveCustomerWishlistItem,
  useUpdateCustomerDashboardProfile,
  type CustomerDashboardOrder,
  type CustomerDashboardProfile,
  type DashboardOrderStatus,
  type UpdateProfilePayload,
} from '@/modules/customer-dashboard';

type CustomerNavId = 'overview' | 'profile' | 'order' | 'wishlist' | 'order-tracking';

type ProfileDraft = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  defaultAddress: string;
  city: string;
  postalCode: string;
  country: string;
};

const DESIGN = {
  primary: '#e91e8c',
  primaryDark: '#c91673',
  bg: '#f6f0f3',
  fg: '#1f2937',
  mutedFg: '#4b5563',
  subtleFg: '#9ca3af',
  card: '#ffffff',
  border: '#f3e0ea',
  ring: '#f3c8dc',
  softPink: '#fce7f3',
  success: '#059669',
  warning: '#f59e0b',
  info: '#3b82f6',
};

const EMPTY_PROFILE_DRAFT: ProfileDraft = {
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  gender: '',
  defaultAddress: '',
  city: '',
  postalCode: '',
  country: 'Bangladesh',
};

const CUSTOMER_NAV_ITEMS: Array<{ id: CustomerNavId; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'order', label: 'Orders', icon: '🧾' },
  { id: 'wishlist', label: 'Wishlist', icon: '💖' },
  { id: 'order-tracking', label: 'Order Tracking', icon: '📦' },
];

const contentByNav: Record<CustomerNavId, { title: string; subtitle: string }> = {
  overview: {
    title: 'Overview',
    subtitle: 'A snapshot of your account activity and recent orders.',
  },
  profile: {
    title: 'Profile',
    subtitle: 'Manage your personal information and preferences.',
  },
  order: {
    title: 'Orders',
    subtitle: 'See your purchase history and latest order details.',
  },
  wishlist: {
    title: 'Wishlist',
    subtitle: 'Keep your favorite products ready for checkout.',
  },
  'order-tracking': {
    title: 'Order tracking',
    subtitle: 'Track shipment updates and delivery progress in one place.',
  },
};

const TRACKING_STEPS: Array<{ status: DashboardOrderStatus; label: string; icon: string }> = [
  { status: 'PENDING',    label: 'Order Placed',   icon: '🛒' },
  { status: 'CONFIRMED',  label: 'Confirmed',      icon: '✅' },
  { status: 'PROCESSING', label: 'Processing',     icon: '⚙️' },
  { status: 'SHIPPED',    label: 'Shipped',        icon: '🚚' },
  { status: 'DELIVERED',  label: 'Delivered',      icon: '📦' },
];

const STATUS_ORDER: DashboardOrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const getStepState = (stepStatus: DashboardOrderStatus, orderStatus: DashboardOrderStatus): 'done' | 'active' | 'upcoming' => {
  if (orderStatus === 'CANCELLED' || orderStatus === 'REFUNDED') return 'upcoming';
  const stepIdx = STATUS_ORDER.indexOf(stepStatus);
  const orderIdx = STATUS_ORDER.indexOf(orderStatus);
  if (stepIdx < orderIdx) return 'done';
  if (stepIdx === orderIdx) return 'active';
  return 'upcoming';
};

const money = (value?: number | string | null) => {
  if (value === null || value === undefined) return '৳0';
  return `৳${Number(value).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
};

const toDateLabel = (value?: string | null) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' });
};

const toDateInputValue = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const orderStatusStyle = (status: DashboardOrderStatus) => {
  switch (status) {
    case 'DELIVERED':
      return { background: '#ecfdf3', color: DESIGN.success };
    case 'SHIPPED':
      return { background: '#eff6ff', color: DESIGN.info };
    case 'PROCESSING':
      return { background: '#fff7ed', color: '#c2410c' };
    case 'CONFIRMED':
      return { background: '#f0f9ff', color: '#0369a1' };
    case 'CANCELLED':
      return { background: '#fef2f2', color: '#b91c1c' };
    case 'REFUNDED':
      return { background: '#fdf4ff', color: '#86198f' };
    default:
      return { background: '#fff7ed', color: DESIGN.warning };
  }
};

const toProfileDraft = (profile: CustomerDashboardProfile): ProfileDraft => ({
  firstName: profile.firstName || '',
  lastName: profile.lastName || '',
  phone: profile.phone || '',
  address: profile.address || '',
  dateOfBirth: toDateInputValue(profile.dateOfBirth),
  gender: profile.gender || '',
  defaultAddress: profile.defaultAddress || '',
  city: profile.city || '',
  postalCode: profile.postalCode || '',
  country: profile.country || 'Bangladesh',
});

const hasProfileChanges = (draft: ProfileDraft, profile?: CustomerDashboardProfile) => {
  if (!profile) return false;

  const current = toProfileDraft(profile);
  return JSON.stringify(draft) !== JSON.stringify(current);
};

function SectionContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border bg-white p-5 shadow-[0_2px_8px_rgba(233,30,140,0.04)]"
      style={{ borderColor: DESIGN.border }}
    >
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-6 text-center" style={{ borderColor: DESIGN.border }}>
      <p className="text-sm" style={{ color: DESIGN.mutedFg }}>
        {message}
      </p>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-6 text-center" style={{ borderColor: DESIGN.border }}>
      <p className="text-sm" style={{ color: DESIGN.mutedFg }}>
        {message}
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: '#fecaca', background: '#fff1f2' }}>
      <p className="text-sm font-semibold" style={{ color: '#b91c1c' }}>
        {message}
      </p>
    </div>
  );
}

function OrderCard({ order, onTrack }: { order: CustomerDashboardOrder; onTrack: (orderId: number) => void }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const statusStyle = orderStatusStyle(order.status);

  return (
    <div
      className="rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1"
      style={{ borderColor: DESIGN.border, boxShadow: '0 2px 8px rgba(233,30,140,0.04)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: DESIGN.fg }}>
            {order.orderNumber}
          </p>
          <p className="text-xs" style={{ color: DESIGN.mutedFg }}>
            Placed on {toDateLabel(order.createdAt)}
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={statusStyle}
        >
          {order.status}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: DESIGN.subtleFg }}>
            Total
          </p>
          <p className="font-semibold" style={{ color: DESIGN.fg }}>
            {money(order.total)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: DESIGN.subtleFg }}>
            Items
          </p>
          <p className="font-semibold" style={{ color: DESIGN.fg }}>
            {itemCount}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: DESIGN.subtleFg }}>
            Payment
          </p>
          <p className="font-semibold" style={{ color: DESIGN.fg }}>
            {order.payment?.status || 'PENDING'}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: DESIGN.subtleFg }}>
            City
          </p>
          <p className="font-semibold" style={{ color: DESIGN.fg }}>
            {order.shippingCity}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs" style={{ color: DESIGN.mutedFg }}>
          {order.notes || 'No additional order notes'}
        </p>
        <button
          onClick={() => onTrack(order.id)}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:-translate-y-0.5"
          style={{ background: DESIGN.primary }}
        >
          Track Order
        </button>
      </div>
    </div>
  );
}

export default function CustomerDashboardClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams?.get('tab') as CustomerNavId | null;
  const validTabs: CustomerNavId[] = ['overview', 'profile', 'order', 'wishlist', 'order-tracking'];
  const initialTab: CustomerNavId = tabParam && validTabs.includes(tabParam) ? tabParam : 'overview';

  const [activeNav, setActiveNav] = React.useState<CustomerNavId>(initialTab);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [orderSearch, setOrderSearch] = React.useState('');
  const [trackingOrderId, setTrackingOrderId] = React.useState<number | undefined>(undefined);
  const [wishlistProductId, setWishlistProductId] = React.useState('');
  const [profileDraft, setProfileDraft] = React.useState<ProfileDraft>(EMPTY_PROFILE_DRAFT);
  const [profileNotice, setProfileNotice] = React.useState<string>('');
  const [wishlistNotice, setWishlistNotice] = React.useState<string>('');
  const [profileDirty, setProfileDirty] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);

  const { data: session } = useSession();

  // Close profile dropdown on outside click
  React.useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  const handleNavChange = (id: CustomerNavId) => {
    setActiveNav(id);
    setSidebarOpen(false);
    // Keep URL in sync
    const url = new URL(window.location.href);
    url.searchParams.set('tab', id);
    void router.replace(url.pathname + url.search, { scroll: false });
  };

  const activeContent = contentByNav[activeNav];

  const orderQueryParams = React.useMemo(() => {
    if (activeNav === 'order') {
      const search = orderSearch.trim();
      return {
        page: 1,
        limit: 20,
        ...(search ? { search } : {}),
      };
    }

    return {
      page: 1,
      limit: 20,
    };
  }, [activeNav, orderSearch]);

  const summaryQuery = useCustomerDashboardSummary();
  const profileQuery = useCustomerDashboardProfile();
  const ordersQuery = useCustomerDashboardOrders(orderQueryParams, {
    enabled: activeNav === 'order' || activeNav === 'order-tracking',
  });
  const wishlistQuery = useCustomerWishlist({ enabled: activeNav === 'wishlist' });
  const trackingQuery = useCustomerOrderTracking(trackingOrderId, {
    enabled: activeNav === 'order-tracking' && !!trackingOrderId,
  });

  const updateProfileMutation = useUpdateCustomerDashboardProfile({
    onSuccess: () => {
      setProfileDirty(false);
      setProfileNotice('Profile updated successfully.');
    },
    onError: () => {
      setProfileNotice('Failed to update profile. Please try again.');
    },
  });

  const addWishlistMutation = useAddCustomerWishlistItem({
    onSuccess: () => {
      setWishlistProductId('');
      setWishlistNotice('Product added to wishlist.');
    },
    onError: () => {
      setWishlistNotice('Unable to add product. Check product ID and try again.');
    },
  });

  const removeWishlistMutation = useRemoveCustomerWishlistItem({
    onSuccess: () => {
      setWishlistNotice('Wishlist item removed.');
    },
    onError: () => {
      setWishlistNotice('Unable to remove wishlist item right now.');
    },
  });

  React.useEffect(() => {
    if (profileQuery.data && !profileDirty) {
      setProfileDraft(toProfileDraft(profileQuery.data));
    }
  }, [profileQuery.data, profileDirty]);

  React.useEffect(() => {
    const orders = ordersQuery.data?.orders || [];
    if (activeNav === 'order-tracking' && orders.length > 0 && !trackingOrderId) {
      setTrackingOrderId(orders[0].id);
    }

    if (trackingOrderId && !orders.some((order) => order.id === trackingOrderId)) {
      setTrackingOrderId(orders[0]?.id);
    }
  }, [activeNav, ordersQuery.data, trackingOrderId]);

  const handleProfileFieldChange = (field: keyof ProfileDraft, value: string) => {
    setProfileNotice('');
    setProfileDirty(true);
    setProfileDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProfileSave = () => {
    const payload: UpdateProfilePayload = {
      firstName: profileDraft.firstName.trim(),
      lastName: profileDraft.lastName.trim(),
      phone: profileDraft.phone.trim(),
      address: profileDraft.address.trim(),
      dateOfBirth: profileDraft.dateOfBirth,
      gender: profileDraft.gender.trim(),
      defaultAddress: profileDraft.defaultAddress.trim(),
      city: profileDraft.city.trim(),
      postalCode: profileDraft.postalCode.trim(),
      country: profileDraft.country.trim() || 'Bangladesh',
    };

    updateProfileMutation.mutate(payload);
  };

  const handleAddWishlistByProductId = () => {
    const productId = Number(wishlistProductId);
    if (!Number.isInteger(productId) || productId <= 0) {
      setWishlistNotice('Enter a valid product ID (positive number).');
      return;
    }

    setWishlistNotice('');
    addWishlistMutation.mutate({ productId });
  };

  const renderOverviewSection = () => {
    const isLoading = summaryQuery.isLoading || profileQuery.isLoading;

    if (isLoading) {
      return (
        <div className="space-y-4">
          {/* Greeting skeleton */}
          <div className="h-24 animate-pulse rounded-2xl" style={{ background: DESIGN.softPink }} />
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border" style={{ borderColor: DESIGN.border, background: '#fff' }} />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-2xl border" style={{ borderColor: DESIGN.border, background: '#fff' }} />
        </div>
      );
    }

    const s = summaryQuery.data;
    const p = profileQuery.data;

    const stats: Array<{ label: string; value: string; icon: string; accent: string }> = [
      {
        label: 'Total Orders',
        value: String(s?.totalOrders ?? 0),
        icon: '🧾',
        accent: DESIGN.primary,
      },
      {
        label: 'Active Orders',
        value: String(s?.activeOrders ?? 0),
        icon: '⚡',
        accent: DESIGN.info,
      },
      {
        label: 'Wishlist',
        value: String(s?.wishlistCount ?? 0),
        icon: '💖',
        accent: '#e11d48',
      },
      {
        label: 'Loyalty Points',
        value: (s?.loyaltyPoints ?? 0).toLocaleString(),
        icon: '⭐',
        accent: DESIGN.warning,
      },
    ];

    const latestOrder = s?.latestOrder;
    const firstName = p?.firstName || s?.customerName?.split(' ')[0] || 'there';
    const segment = p?.segment || s?.segment;

    return (
      <div className="space-y-4">
        {/* Greeting banner */}
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-5"
          style={{
            background: `linear-gradient(135deg, ${DESIGN.primary} 0%, ${DESIGN.primaryDark} 100%)`,
            boxShadow: '0 8px 32px rgba(233,30,140,0.22)',
          }}
        >
          {/* decorative circles */}
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-20"
            style={{ background: '#fff' }}
          />
          <div
            className="pointer-events-none absolute -bottom-6 right-16 h-20 w-20 rounded-full opacity-10"
            style={{ background: '#fff' }}
          />

          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-black text-white" style={{ letterSpacing: '-0.02em' }}>
                Welcome back, {firstName} 👋
              </p>
              <p className="mt-0.5 text-sm text-white/75">
                {money(s?.totalSpent ?? 0)} spent across {s?.totalOrders ?? 0} orders
              </p>
            </div>
            {segment && (
              <span
                className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
              >
                {segment}
              </span>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border bg-white px-4 py-4 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                borderColor: DESIGN.border,
                boxShadow: '0 2px 8px rgba(233,30,140,0.04)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: DESIGN.subtleFg }}>
                  {stat.label}
                </p>
                <span className="text-lg">{stat.icon}</span>
              </div>
              <p className="mt-2 text-2xl font-black" style={{ color: stat.accent, letterSpacing: '-0.03em' }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Latest order + quick actions uat */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Latest order */}
          <SectionContainer>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: DESIGN.mutedFg }}>
              Latest Order
            </p>
            {latestOrder ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold" style={{ color: DESIGN.fg }}>
                      {latestOrder.orderNumber}
                    </p>
                    <p className="text-xs" style={{ color: DESIGN.mutedFg }}>
                      Placed on {toDateLabel(latestOrder.createdAt)}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={orderStatusStyle(latestOrder.status)}
                  >
                    {latestOrder.status}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: DESIGN.softPink }}>
                  <p className="text-sm font-semibold" style={{ color: DESIGN.mutedFg }}>Order Total</p>
                  <p className="text-lg font-black" style={{ color: DESIGN.primary }}>{money(latestOrder.total)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTrackingOrderId(latestOrder.id);
                      handleNavChange('order-tracking');
                    }}
                    className="flex-1 rounded-xl py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
                    style={{ background: DESIGN.primary, boxShadow: '0 6px 16px rgba(233,30,140,0.22)' }}
                  >
                    Track Order
                  </button>
                  <button
                    onClick={() => handleNavChange('order')}
                    className="flex-1 rounded-xl border py-2 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                    style={{ borderColor: DESIGN.border, color: DESIGN.primary }}
                  >
                    All Orders
                  </button>
                </div>
              </div>
            ) : (
              <EmptyState message="No orders placed yet. Start shopping!" />
            )}
          </SectionContainer>

          {/* Quick actions */}
          <SectionContainer>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: DESIGN.mutedFg }}>
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'My Orders', icon: '🧾', nav: 'order' as CustomerNavId },
                { label: 'Wishlist', icon: '💖', nav: 'wishlist' as CustomerNavId },
                { label: 'Track Order', icon: '📦', nav: 'order-tracking' as CustomerNavId },
                { label: 'Edit Profile', icon: '✏️', nav: 'profile' as CustomerNavId },
              ].map((action) => (
                <button
                  key={action.nav}
                  onClick={() => handleNavChange(action.nav)}
                  className="flex flex-col items-center gap-2 rounded-2xl border py-4 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    borderColor: DESIGN.border,
                    color: DESIGN.fg,
                    background: '#fff',
                    boxShadow: '0 2px 8px rgba(233,30,140,0.04)',
                  }}
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span style={{ color: DESIGN.mutedFg, fontSize: 12 }}>{action.label}</span>
                </button>
              ))}
            </div>
          </SectionContainer>
        </div>

        {/* Account summary strip */}
        {p && (
          <SectionContainer>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: DESIGN.mutedFg }}>
              Account Summary
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
              {[
                { label: 'Email', value: p.email },
                { label: 'Phone', value: p.phone || '—' },
                { label: 'City', value: p.city || '—' },
                { label: 'Member Since', value: toDateLabel(p.createdAt) },
              ].map((row) => (
                <div key={row.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: DESIGN.subtleFg }}>
                    {row.label}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold" style={{ color: DESIGN.fg }}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </SectionContainer>
        )}
      </div>
    );
  };

  const renderProfileSection = () => {
    if (profileQuery.isLoading) {
      return <LoadingState message="Loading your profile details..." />;
    }

    if (profileQuery.isError || !profileQuery.data) {
      return <ErrorState message="Unable to load profile information." />;
    }

    const profile = profileQuery.data;
    const canSave = hasProfileChanges(profileDraft, profile) && !updateProfileMutation.isPending;

    return (
      <SectionContainer>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xl font-bold" style={{ color: DESIGN.fg }}>
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-sm" style={{ color: DESIGN.mutedFg }}>
              {profile.email}
            </p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ background: DESIGN.softPink, color: DESIGN.primary }}
          >
            {profile.segment}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span style={{ color: DESIGN.mutedFg }}>First Name</span>
            <input
              value={profileDraft.firstName}
              onChange={(event) => handleProfileFieldChange('firstName', event.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100"
              style={{ borderColor: DESIGN.border, color: DESIGN.fg }}
              placeholder="First name"
            />
          </label>

          <label className="text-sm">
            <span style={{ color: DESIGN.mutedFg }}>Last Name</span>
            <input
              value={profileDraft.lastName}
              onChange={(event) => handleProfileFieldChange('lastName', event.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100"
              style={{ borderColor: DESIGN.border, color: DESIGN.fg }}
              placeholder="Last name"
            />
          </label>

          <label className="text-sm">
            <span style={{ color: DESIGN.mutedFg }}>Phone</span>
            <input
              value={profileDraft.phone}
              onChange={(event) => handleProfileFieldChange('phone', event.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100"
              style={{ borderColor: DESIGN.border, color: DESIGN.fg }}
              placeholder="Phone number"
            />
          </label>

          <label className="text-sm">
            <span style={{ color: DESIGN.mutedFg }}>Gender</span>
            <input
              value={profileDraft.gender}
              onChange={(event) => handleProfileFieldChange('gender', event.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100"
              style={{ borderColor: DESIGN.border, color: DESIGN.fg }}
              placeholder="Gender"
            />
          </label>

          <label className="text-sm">
            <span style={{ color: DESIGN.mutedFg }}>Date of Birth</span>
            <input
              type="date"
              value={profileDraft.dateOfBirth}
              onChange={(event) => handleProfileFieldChange('dateOfBirth', event.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100"
              style={{ borderColor: DESIGN.border, color: DESIGN.fg }}
            />
          </label>

          <label className="text-sm">
            <span style={{ color: DESIGN.mutedFg }}>City</span>
            <input
              value={profileDraft.city}
              onChange={(event) => handleProfileFieldChange('city', event.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100"
              style={{ borderColor: DESIGN.border, color: DESIGN.fg }}
              placeholder="City"
            />
          </label>

          <label className="text-sm md:col-span-2">
            <span style={{ color: DESIGN.mutedFg }}>Address</span>
            <textarea
              value={profileDraft.address}
              onChange={(event) => handleProfileFieldChange('address', event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100"
              style={{ borderColor: DESIGN.border, color: DESIGN.fg }}
              placeholder="Primary address"
            />
          </label>

          <label className="text-sm md:col-span-2">
            <span style={{ color: DESIGN.mutedFg }}>Default Delivery Address</span>
            <textarea
              value={profileDraft.defaultAddress}
              onChange={(event) => handleProfileFieldChange('defaultAddress', event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100"
              style={{ borderColor: DESIGN.border, color: DESIGN.fg }}
              placeholder="Delivery address"
            />
          </label>

          <label className="text-sm">
            <span style={{ color: DESIGN.mutedFg }}>Postal Code</span>
            <input
              value={profileDraft.postalCode}
              onChange={(event) => handleProfileFieldChange('postalCode', event.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100"
              style={{ borderColor: DESIGN.border, color: DESIGN.fg }}
              placeholder="Postal code"
            />
          </label>

          <label className="text-sm">
            <span style={{ color: DESIGN.mutedFg }}>Country</span>
            <input
              value={profileDraft.country}
              onChange={(event) => handleProfileFieldChange('country', event.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100"
              style={{ borderColor: DESIGN.border, color: DESIGN.fg }}
              placeholder="Country"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs" style={{ color: DESIGN.mutedFg }}>
            Last updated on {toDateLabel(profile.updatedAt)}
          </div>

          <button
            onClick={handleProfileSave}
            disabled={!canSave}
            className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            style={{
              background: canSave ? DESIGN.primary : '#9ca3af',
              boxShadow: canSave ? '0 8px 20px rgba(233,30,140,0.25)' : 'none',
            }}
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {profileNotice ? (
          <p className="mt-3 text-sm font-semibold" style={{ color: profileNotice.includes('success') ? DESIGN.success : '#b91c1c' }}>
            {profileNotice}
          </p>
        ) : null}
      </SectionContainer>
    );
  };

  const renderOrdersSection = () => {
    if (ordersQuery.isLoading) {
      return <LoadingState message="Loading your orders..." />;
    }

    if (ordersQuery.isError) {
      return <ErrorState message="Unable to load your orders at this moment." />;
    }

    const orders = ordersQuery.data?.orders || [];

    return (
      <SectionContainer>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-bold" style={{ color: DESIGN.fg }}>
              My Orders
            </p>
            <p className="text-sm" style={{ color: DESIGN.mutedFg }}>
              Track and review your purchases.
            </p>
          </div>

          <input
            value={orderSearch}
            onChange={(event) => setOrderSearch(event.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100 md:w-72"
            style={{ borderColor: DESIGN.border, color: DESIGN.fg }}
            placeholder="Search by order number or name"
          />
        </div>

        <div className="space-y-3">
          {orders.length === 0 ? (
            <EmptyState message="No orders found for the current filter." />
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onTrack={(orderId) => {
                  setTrackingOrderId(orderId);
                  setActiveNav('order-tracking');
                }}
              />
            ))
          )}
        </div>
      </SectionContainer>
    );
  };

  const renderWishlistSection = () => {
    if (wishlistQuery.isLoading) {
      return <LoadingState message="Loading your wishlist..." />;
    }

    if (wishlistQuery.isError) {
      return <ErrorState message="Unable to load wishlist items." />;
    }

    const wishlist = wishlistQuery.data || [];

    return (
      <SectionContainer>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xl font-bold" style={{ color: DESIGN.fg }}>
              Wishlist
            </p>
            <p className="text-sm" style={{ color: DESIGN.mutedFg }}>
              Keep your favorite products ready for checkout.
            </p>
          </div>

          <div className="flex w-full max-w-sm items-center gap-2">
            <input
              value={wishlistProductId}
              onChange={(event) => setWishlistProductId(event.target.value)}
              placeholder="Product ID"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100"
              style={{ borderColor: DESIGN.border, color: DESIGN.fg }}
            />
            <button
              onClick={handleAddWishlistByProductId}
              disabled={addWishlistMutation.isPending}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                background: DESIGN.primary,
                boxShadow: '0 8px 20px rgba(233,30,140,0.25)',
              }}
            >
              {addWishlistMutation.isPending ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>

        {wishlistNotice ? (
          <p className="mb-3 text-sm font-semibold" style={{ color: wishlistNotice.includes('added') || wishlistNotice.includes('removed') ? DESIGN.success : '#b91c1c' }}>
            {wishlistNotice}
          </p>
        ) : null}

        {wishlist.length === 0 ? (
          <EmptyState message="No wishlist items yet. Add a product ID to save items." />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {wishlist.map((item) => {
              const image = item.product.images[0];
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border-[1.5px] bg-white p-4 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    borderColor: DESIGN.border,
                    boxShadow: '0 2px 8px rgba(233,30,140,0.04)',
                  }}
                >
                  <div className="mb-3 h-36 overflow-hidden rounded-xl" style={{ background: DESIGN.softPink }}>
                    {image ? (
                      <img src={image} alt={item.product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm" style={{ color: DESIGN.mutedFg }}>
                        No image
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: DESIGN.primary }}>
                    {item.product.category.name}
                  </p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: DESIGN.fg }}>
                    {item.product.name}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="font-bold" style={{ color: DESIGN.primary }}>
                      {money(item.product.price)}
                    </span>
                    {item.product.compareAtPrice ? (
                      <span className="line-through" style={{ color: DESIGN.subtleFg }}>
                        {money(item.product.compareAtPrice)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs" style={{ color: DESIGN.mutedFg }}>
                      Added {toDateLabel(item.createdAt)}
                    </p>
                    <button
                      onClick={() => removeWishlistMutation.mutate(item.productId)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
                      style={{ borderColor: DESIGN.border, color: DESIGN.primary }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionContainer>
    );
  };

  const renderTrackingSection = () => {
    if (ordersQuery.isLoading) {
      return <LoadingState message="Loading trackable orders..." />;
    }

    if (ordersQuery.isError) {
      return <ErrorState message="Unable to load orders for tracking." />;
    }

    const orders = ordersQuery.data?.orders || [];

    if (orders.length === 0) {
      return <EmptyState message="No orders available to track right now." />;
    }

    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
        <SectionContainer>
          <p className="text-sm font-bold uppercase tracking-wide" style={{ color: DESIGN.mutedFg }}>
            Select Order
          </p>
          <div className="mt-3 space-y-2">
            {orders.map((order) => {
              const isActive = trackingOrderId === order.id;
              return (
                <button
                  key={order.id}
                  onClick={() => setTrackingOrderId(order.id)}
                  className="w-full rounded-xl border px-3 py-2 text-left transition"
                  style={{
                    borderColor: isActive ? DESIGN.primary : DESIGN.border,
                    background: isActive ? DESIGN.softPink : '#fff',
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: DESIGN.fg }}>
                    {order.orderNumber}
                  </p>
                  <p className="text-xs" style={{ color: DESIGN.mutedFg }}>
                    {toDateLabel(order.createdAt)}
                  </p>
                </button>
              );
            })}
          </div>
        </SectionContainer>

        <SectionContainer>
          {trackingQuery.isLoading ? (
            <LoadingState message="Loading tracking timeline..." />
          ) : trackingQuery.isError || !trackingQuery.data ? (
            <ErrorState message="Could not load tracking timeline for this order." />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold" style={{ color: DESIGN.fg }}>
                    {trackingQuery.data.orderNumber}
                  </p>
                  <p className="text-sm" style={{ color: DESIGN.mutedFg }}>
                    Order placed on {toDateLabel(trackingQuery.data.createdAt)}
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                  style={orderStatusStyle(trackingQuery.data.status)}
                >
                  {trackingQuery.data.status}
                </span>
              </div>

              {/* Status stepper */}
              {trackingQuery.data.status !== 'CANCELLED' && trackingQuery.data.status !== 'REFUNDED' ? (
                <div className="mt-6 flex items-center gap-0">
                  {TRACKING_STEPS.map((step, idx) => {
                    const state = getStepState(step.status, trackingQuery.data!.status);
                    return (
                      <React.Fragment key={step.status}>
                        <div className="flex flex-col items-center gap-1.5 min-w-0">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full text-base transition-all"
                            style={{
                              background: state === 'done' ? DESIGN.primary : state === 'active' ? DESIGN.softPink : '#f3f4f6',
                              border: `2px solid ${state === 'upcoming' ? '#e5e7eb' : DESIGN.primary}`,
                              fontSize: 16,
                            }}
                          >
                            {state === 'done' ? '✓' : step.icon}
                          </div>
                          <p className="text-center text-[10px] font-semibold leading-tight" style={{ color: state === 'upcoming' ? DESIGN.subtleFg : DESIGN.primary, maxWidth: 56 }}>
                            {step.label}
                          </p>
                        </div>
                        {idx < TRACKING_STEPS.length - 1 && (
                          <div
                            className="h-0.5 flex-1 mx-1"
                            style={{ background: getStepState(TRACKING_STEPS[idx + 1].status, trackingQuery.data!.status) !== 'upcoming' ? DESIGN.primary : '#e5e7eb' }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                  This order has been {trackingQuery.data.status.toLowerCase()}.
                </div>
              )}

              {/* Timeline events */}
              {trackingQuery.data.trackingEvents.length > 0 && (
                <div className="mt-6 space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: DESIGN.mutedFg }}>Timeline</p>
                  {trackingQuery.data.trackingEvents.map((event, index) => (
                    <div key={event.id} className="relative pl-8">
                      {index < trackingQuery.data!.trackingEvents.length - 1 ? (
                        <div className="absolute left-[7px] top-5 h-[calc(100%+8px)] w-px" style={{ background: DESIGN.border }} />
                      ) : null}
                      <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-2" style={{ borderColor: DESIGN.primary, background: DESIGN.softPink }} />
                      <p className="text-sm font-semibold" style={{ color: DESIGN.fg }}>{event.title}</p>
                      <p className="text-xs" style={{ color: DESIGN.mutedFg }}>{event.description || 'Status updated'}</p>
                      <p className="text-xs" style={{ color: DESIGN.subtleFg }}>{toDateLabel(event.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </SectionContainer>
      </div>
    );
  };

  const renderActiveSection = () => {
    switch (activeNav) {
      case 'overview':
        return renderOverviewSection();
      case 'profile':
        return renderProfileSection();
      case 'order':
        return renderOrdersSection();
      case 'wishlist':
        return renderWishlistSection();
      case 'order-tracking':
        return renderTrackingSection();
      default:
        return null;
    }
  };

  const summary = summaryQuery.data;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 10% 0%, rgba(243,200,220,0.28), transparent 32%), linear-gradient(180deg, #faf7f9 0%, #f6f0f3 100%)',
        color: DESIGN.fg,
        fontFamily: "var(--font-geist-sans), 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <aside
        className="hidden w-64 shrink-0 flex-col border-r md:flex"
        style={{ borderColor: DESIGN.border, background: DESIGN.card }}
      >
        <div className="px-5 pb-4 pt-5" style={{ borderBottom: `1px solid ${DESIGN.border}` }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: DESIGN.primary, letterSpacing: '-0.02em' }}>
            Mouchak
          </div>
          <div
            className="mt-0.5"
            style={{
              fontSize: 10,
              color: DESIGN.mutedFg,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Customer Dashboard
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-3">
          {CUSTOMER_NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavChange(item.id)}
                className="flex w-full items-center gap-3 rounded-[10px] border-0 px-3 py-[11px] text-left text-[14px] transition"
                style={{
                  background: isActive ? DESIGN.softPink : 'transparent',
                  color: isActive ? DESIGN.primary : DESIGN.mutedFg,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div style={{ padding: '12px 8px', borderTop: `1px solid ${DESIGN.border}` }}>
          <a
            href="/"
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-[11px] text-[14px] transition"
            style={{ color: DESIGN.mutedFg, fontWeight: 500 }}
          >
            <span style={{ fontSize: 15 }}>🛍️</span>
            <span>Back to Shop</span>
          </a>
        </div>
      </aside>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside
            className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r md:hidden"
            style={{ borderColor: DESIGN.border, background: DESIGN.card }}
          >
            <div className="flex items-center justify-between px-5 pb-4 pt-5" style={{ borderBottom: `1px solid ${DESIGN.border}` }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: DESIGN.primary, letterSpacing: '-0.02em' }}>
                  Mouchak
                </div>
                <div
                  className="mt-0.5"
                  style={{
                    fontSize: 10,
                    color: DESIGN.mutedFg,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Customer Dashboard
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="border-0 bg-transparent text-xl"
                style={{ color: DESIGN.mutedFg, cursor: 'pointer' }}
                aria-label="Close sidebar"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-2 py-3">
              {CUSTOMER_NAV_ITEMS.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavChange(item.id)}
                    className="flex w-full items-center gap-3 rounded-[10px] border-0 px-3 py-[11px] text-left text-[14px] transition"
                    style={{
                      background: isActive ? DESIGN.softPink : 'transparent',
                      color: isActive ? DESIGN.primary : DESIGN.mutedFg,
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className="flex items-center justify-between border-b px-4 py-3 md:px-6"
          style={{ borderColor: DESIGN.border, background: DESIGN.card }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
              style={{ borderColor: DESIGN.border, color: DESIGN.fg, background: DESIGN.card, cursor: 'pointer' }}
              aria-label="Open sidebar"
            >
              ☰
            </button>
            <div>
              <p className="text-lg font-black" style={{ color: DESIGN.fg }}>
                Customer dashboard
              </p>
              <p className="text-xs" style={{ color: DESIGN.mutedFg }}>
                Welcome to your account space
              </p>
            </div>
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full px-1.5 py-1 transition-all hover:shadow-md"
              style={{
                background: DESIGN.softPink,
                border: `1px solid ${DESIGN.border}`,
                cursor: 'pointer',
              }}
              title="Account"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
                style={{ background: DESIGN.primary }}
              >
                {session?.user?.name?.charAt(0)?.toUpperCase() ||
                  profileQuery.data?.firstName?.charAt(0)?.toUpperCase() ||
                  'U'}
              </div>
              <span className="hidden pr-1 text-[13px] font-bold md:block" style={{ color: DESIGN.fg }}>
                {session?.user?.name || profileQuery.data?.firstName || 'Account'}
              </span>
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl shadow-2xl"
                style={{ background: DESIGN.card, border: `1px solid ${DESIGN.border}` }}
              >
                {/* User header */}
                <div
                  className="border-b px-6 py-5 text-center"
                  style={{
                    borderColor: DESIGN.border,
                    background: `linear-gradient(180deg, ${DESIGN.softPink} 0%, transparent 100%)`,
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black text-white shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${DESIGN.primary} 0%, ${DESIGN.primaryDark} 100%)`,
                        border: `3px solid ${DESIGN.card}`,
                      }}
                    >
                      {session?.user?.name?.charAt(0)?.toUpperCase() ||
                        profileQuery.data?.firstName?.charAt(0)?.toUpperCase() ||
                        'U'}
                    </div>
                    <div>
                      <p className="text-[15px] font-bold" style={{ color: DESIGN.fg }}>
                        {profileQuery.data
                          ? `${profileQuery.data.firstName} ${profileQuery.data.lastName}`.trim()
                          : session?.user?.name || 'Customer'}
                      </p>
                      <p className="text-[11px]" style={{ color: DESIGN.mutedFg }}>
                        {profileQuery.data?.email || session?.user?.email || ''}
                      </p>
                      {(profileQuery.data?.segment || summaryQuery.data?.segment) && (
                        <span
                          className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                          style={{ background: DESIGN.softPink, color: DESIGN.primary }}
                        >
                          {profileQuery.data?.segment || summaryQuery.data?.segment}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-5 py-4">
                  <button
                    onClick={() => {
                      handleNavChange('profile');
                      setProfileOpen(false);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-bold transition-all hover:-translate-y-0.5"
                    style={{
                      background: DESIGN.softPink,
                      color: DESIGN.primary,
                      border: `1px solid ${DESIGN.border}`,
                    }}
                  >
                    <span>👤</span>
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-bold transition-all hover:-translate-y-0.5"
                    style={{
                      background: '#fff1f2',
                      color: '#e11d48',
                      border: '1px solid #ffe4e6',
                    }}
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <section className="flex-1 overflow-auto p-4 md:p-6">
          {renderActiveSection()}
        </section>
      </main>
    </div>
  );
}

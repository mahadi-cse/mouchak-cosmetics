'use client';

import React from 'react';
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

type CustomerNavId = 'profile' | 'order' | 'wishlist' | 'order-tracking';

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
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'order', label: 'Orders', icon: '🧾' },
  { id: 'wishlist', label: 'Wishlist', icon: '💖' },
  { id: 'order-tracking', label: 'Order Tracking', icon: '📦' },
];

const contentByNav: Record<CustomerNavId, { title: string; subtitle: string }> = {
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
  const [activeNav, setActiveNav] = React.useState<CustomerNavId>('profile');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [orderSearch, setOrderSearch] = React.useState('');
  const [trackingOrderId, setTrackingOrderId] = React.useState<number | undefined>(undefined);
  const [wishlistProductId, setWishlistProductId] = React.useState('');
  const [profileDraft, setProfileDraft] = React.useState<ProfileDraft>(EMPTY_PROFILE_DRAFT);
  const [profileNotice, setProfileNotice] = React.useState<string>('');
  const [wishlistNotice, setWishlistNotice] = React.useState<string>('');
  const [profileDirty, setProfileDirty] = React.useState(false);

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

              <div className="mt-5 space-y-4">
                {trackingQuery.data.trackingEvents.map((event, index) => (
                  <div key={event.id} className="relative pl-8">
                    {index < trackingQuery.data.trackingEvents.length - 1 ? (
                      <div
                        className="absolute left-[7px] top-5 h-[calc(100%+8px)] w-px"
                        style={{ background: DESIGN.border }}
                      />
                    ) : null}
                    <div
                      className="absolute left-0 top-1 h-4 w-4 rounded-full border-2"
                      style={{ borderColor: DESIGN.primary, background: DESIGN.softPink }}
                    />
                    <p className="text-sm font-semibold" style={{ color: DESIGN.fg }}>
                      {event.title}
                    </p>
                    <p className="text-xs" style={{ color: DESIGN.mutedFg }}>
                      {event.description || 'Status updated'}
                    </p>
                    <p className="text-xs" style={{ color: DESIGN.subtleFg }}>
                      {toDateLabel(event.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionContainer>
      </div>
    );
  };

  const renderActiveSection = () => {
    switch (activeNav) {
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
                onClick={() => setActiveNav(item.id)}
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
                    onClick={() => {
                      setActiveNav(item.id);
                      setSidebarOpen(false);
                    }}
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
          <div
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: DESIGN.softPink, color: DESIGN.primary }}
          >
            Active
          </div>
        </header>

        <section className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div
              className="rounded-2xl border bg-white p-4 shadow-[0_2px_8px_rgba(233,30,140,0.04)]"
              style={{ borderColor: DESIGN.border }}
            >
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: DESIGN.mutedFg }}>
                Current Section
              </p>
              <p className="mt-2 text-lg font-black" style={{ color: DESIGN.fg }}>
                {activeContent.title}
              </p>
            </div>
            <div
              className="rounded-2xl border bg-white p-4 shadow-[0_2px_8px_rgba(233,30,140,0.04)]"
              style={{ borderColor: DESIGN.border }}
            >
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: DESIGN.mutedFg }}>
                Saved Items
              </p>
              <p className="mt-2 text-lg font-black" style={{ color: DESIGN.primary }}>
                {summaryQuery.isLoading ? '...' : (summary?.wishlistCount ?? 0)}
              </p>
            </div>
            <div
              className="rounded-2xl border bg-white p-4 shadow-[0_2px_8px_rgba(233,30,140,0.04)]"
              style={{ borderColor: DESIGN.border }}
            >
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: DESIGN.mutedFg }}>
                Trackable Orders
              </p>
              <p className="mt-2 text-lg font-black" style={{ color: DESIGN.fg }}>
                {summaryQuery.isLoading ? '...' : (summary?.trackableOrders ?? 0)}
              </p>
            </div>
            <div
              className="rounded-2xl border bg-white p-4 shadow-[0_2px_8px_rgba(233,30,140,0.04)]"
              style={{ borderColor: DESIGN.border }}
            >
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: DESIGN.mutedFg }}>
                Loyalty Points
              </p>
              <p className="mt-2 text-lg font-black" style={{ color: DESIGN.fg }}>
                {summaryQuery.isLoading ? '...' : (summary?.loyaltyPoints ?? 0)}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xl font-black" style={{ color: DESIGN.fg }}>
              {activeContent.title}
            </p>
            <p className="mt-1 text-sm" style={{ color: DESIGN.mutedFg }}>
              {activeContent.subtitle}
            </p>
          </div>

          {renderActiveSection()}
        </section>
      </main>
    </div>
  );
}

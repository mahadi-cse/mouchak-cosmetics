'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, Btn, Badge } from '../Primitives';
import { NAV, SETTINGS_ITEMS } from '@/modules/dashboard/utils/constants';
import {
  useListCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useUpdateCategoryStatus,
} from '@/modules/categories/queries';
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUpdateProductStatus,
} from '@/modules/products/queries';
import { useListBranches } from '@/modules/branches/queries';
import { toast } from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { confirmDialog } from '@/shared/lib/confirmDialog';
import { useDashboardLocale } from '../../locales/DashboardLocaleContext';
import { useSession } from 'next-auth/react';
import apiClient from '@/shared/lib/apiClient';
import StaffFormPageClient from '@/app/(staff-dashboard)/dashboard/settings/staff/_components/StaffFormPageClient';
import {
  usePromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useTogglePromotion,
  useDeletePromotion,
} from '@/modules/promotions';
import type { Promotion as APIPromotion } from '@/modules/promotions';
import ImageUploader from '@/shared/components/ImageUploader';
import type { ImageUploaderRef } from '@/shared/components/ImageUploader';
import {
  homepageAPI,
  useHomepageStats,
  useSiteSettings,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod
} from '@/modules/homepage';

interface SettingsViewProps {
  products: any[];
  tab: string;
  setTab: (tab: string) => void;
}

type StaffStatus = 'active' | 'inactive';

// ─── Staff / User management types ───────────────────────────────────────────

interface StaffUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  typeId?: number;
  userType?: { id: number; name: string };
  isActive: boolean;
  createdAt: string;
  userModules?: Array<{ module: { id: number; code: string; name: string; icon?: string } }>;
}

interface StaffUserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  typeId: string;
  isActive: boolean;
  moduleCodes: string[];
}

interface AvailableModule {
  id: number;
  code: string;
  name: string;
  icon?: string;
}

const EMPTY_STAFF_FORM: StaffUserForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  typeId: '',
  isActive: true,
  moduleCodes: [],
};

// ─── Legacy local-only types (kept for promotions/settings) ──────────────────

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  branch: string;
  status: StaffStatus;
}

interface SettingsState {
  storeName: string;
  primaryColor: string;
  currency: string;
  taxRate: number;
  timezone: string;
  lowStockThreshold: number;
  autoReserve: boolean;
  barcodeEnabled: boolean;
  sslStoreId: string;
  sslStoreSecret: string;
  refundDays: number;
  defaultShipping: number;
  freeShippingOver: number;
  deliveryEstimate: string;
  emailOrders: boolean;
  emailStock: boolean;
  emailNewCustomer: boolean;
  smsOrders: boolean;
  smsDelivery: boolean;
  storeLogo: string;
  acceptedPayments: {
    bkash: boolean;
    nagad: boolean;
    card: boolean;
    cash: boolean;
  };
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  heroHeadline: string;
  heroYear: string;
  heroDescription: string;
}

const DASHBOARD_SETTINGS_KEY = 'mouchak.dashboard.settings.v1';
const DASHBOARD_STAFF_KEY = 'mouchak.dashboard.staff.v1';

const DEFAULT_SETTINGS: SettingsState = {
  storeName: 'Mouchak Cosmetics',
  primaryColor: '#f01172',
  currency: 'BDT',
  taxRate: 15,
  timezone: 'Asia/Dhaka',
  lowStockThreshold: 15,
  autoReserve: true,
  barcodeEnabled: true,
  sslStoreId: 'mouchak_store_01',
  sslStoreSecret: '',
  refundDays: 7,
  defaultShipping: 80,
  freeShippingOver: 1000,
  deliveryEstimate: '3-5 business days',
  emailOrders: true,
  emailStock: true,
  emailNewCustomer: false,
  smsOrders: false,
  smsDelivery: true,
  storeLogo: '',
  acceptedPayments: { bkash: true, nagad: true, card: true, cash: true },
  contactAddress: 'Dhaka, Bangladesh',
  contactPhone: '+880 1XXX-XXXXXX',
  contactEmail: 'hello@mouchakcosmetics.com',
  heroHeadline: 'Spring Beauty',
  heroYear: '2026',
  heroDescription: 'Discover luxurious skincare and makeup that celebrates your natural glow.',
};

const STAFF_LIST: StaffMember[] = [
  {
    id: 1,
    name: 'Karim Hossain',
    email: 'karim@mouchak.com',
    role: 'Admin',
    branch: 'Dhaka Main',
    status: 'active',
  },
  {
    id: 2,
    name: 'Fatima Khanam',
    email: 'fatima@mouchak.com',
    role: 'Staff',
    branch: 'Chittagong',
    status: 'active',
  },
  {
    id: 3,
    name: 'Raihan Ahmed',
    email: 'raihan@mouchak.com',
    role: 'Staff',
    branch: 'Sylhet Outlet',
    status: 'inactive',
  },
];

const inputClass =
  'w-full box-border rounded-lg border border-border bg-white px-[14px] py-2.5 text-[13px] text-foreground outline-none';
const selectClass = `${inputClass} cursor-pointer`;
const labelClass = 'mb-1.5 block text-xs font-semibold text-foreground';

const FormSection = ({ title, children }: any) => (
  <div className="mb-6">
    <div
      className="mb-3 border-b-2 pb-2 text-sm font-bold"
      style={{ color: Theme.fg, borderBottomColor: Theme.secondary }}
    >
      {title}
    </div>
    {children}
  </div>
);

const Toggle = ({ val, onToggle, label }: any) => (
  <div className="flex items-center justify-between border-b border-border py-3">
    <span className="text-[13px]" style={{ color: Theme.fg }}>
      {label}
    </span>
    <button
      onClick={onToggle}
      className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-none transition-colors"
      style={{ background: val ? Theme.primary : Theme.border }}
    >
      <div
        className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-all"
        style={{ left: val ? 22 : 3 }}
      />
    </button>
  </div>
);

const categoryEmojis: any = {
  Skincare: '🧴',
  Lipstick: '💄',
  Foundation: '🌿',
  Eyewear: '👁️',
  Fragrance: '🌸',
};

export default function SettingsView({ products: _products, tab, setTab }: SettingsViewProps) {
  const { isMobile } = useResponsive();
  const { t } = useDashboardLocale();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = true; // Staff dashboard is already protected by middleware; role-based UI gating can be added once role values are confirmed

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterBranchId, setFilterBranchId] = useState('');
  const [productCategoryBranchId, setProductCategoryBranchId] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const productImageRef = useRef<ImageUploaderRef>(null);
  const categoryImageRef = useRef<ImageUploaderRef>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');

  const { data: siteSettingsData } = useSiteSettings();
  const { data: homepageStatsData } = useHomepageStats();

  const { data: apiCategories = [], isLoading: isLoadingCats } = useListCategories(
    filterBranchId ? { includeInactive: true, branchId: Number(filterBranchId) } : { includeInactive: true },
    { queryKey: ['categories', 'list', 'settings', { branchId: filterBranchId || null, includeInactive: true }] }
  );
  const { data: productCategories = [], isLoading: isLoadingProductCategories } = useListCategories(
    productCategoryBranchId
      ? { includeInactive: true, branchId: Number(productCategoryBranchId) }
      : undefined,
    {
      enabled: !!productCategoryBranchId,
      queryKey: ['categories', 'list', 'product-form', { branchId: productCategoryBranchId, includeInactive: true }],
    }
  );
  const { data: apiProducts = [], isLoading: isLoadingProducts } = useListProducts(
    {
      limit: 100,
      includeInactive: true, // Display everything in settings
      ...(filterBranchId ? { branchId: Number(filterBranchId) } : {})
    } as any,
    { queryKey: ['products', 'list', { branchId: filterBranchId, includeInactive: true }] }
  );
  const { data: branches = [] } = useListBranches();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const updateCategoryStatus = useUpdateCategoryStatus();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateProductStatus = useUpdateProductStatus();

  const createPaymentMethod = useCreatePaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();

  // ─── Staff / User management ───────────────────────────────────────────────
  // These endpoints are pending backend implementation.
  // Set enabled: false until /auth/users and /auth/user-types are available.
  const { data: staffUsers = [], isLoading: isLoadingStaff, refetch: refetchStaff } = useQuery<StaffUser[]>({
    queryKey: ['auth', 'users'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/auth/users', { params: { limit: 200 } });
        const raw: any[] = res.data?.data ?? res.data ?? [];
        return raw.filter((u: any) => {
          const typeName = (u.userType?.name || '').toLowerCase();
          return typeName !== 'customer' && typeName !== 'guest';
        });
      } catch {
        return [];
      }
    },
    enabled: true,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });

  const { data: userTypes = [] } = useQuery<Array<{ id: number; name: string; code?: string }>>({
    queryKey: ['auth', 'user-types'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/auth/user-types');
        return res.data?.data ?? res.data ?? [];
      } catch {
        return [];
      }
    },
    enabled: true,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  // Static module list derived from NAV + SETTINGS_ITEMS — no API needed
  const availableModules: AvailableModule[] = React.useMemo(() => [
    ...NAV.map((n, i) => ({ id: i + 1, code: n.id, name: n.label, icon: n.icon })),
    ...SETTINGS_ITEMS.map((s, i) => ({
      id: NAV.length + i + 1,
      code: `settings:${s.id}`,
      name: `Settings › ${s.label}`,
      icon: s.icon,
    })),
  ], []);

  const createUserMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/auth/users', data).then((r) => r.data?.data ?? r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auth', 'users'] }); },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.patch(`/auth/users/${id}`, data).then((r) => r.data?.data ?? r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auth', 'users'] }); },
  });

  const updateUserModulesMutation = useMutation({
    mutationFn: ({ id, moduleCodes }: { id: number; moduleCodes: string[] }) =>
      apiClient.put(`/auth/users/${id}/modules`, { moduleCodes }).then((r) => r.data?.data ?? r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auth', 'users'] }); },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/auth/users/${id}/force-logout`).then((r) => r.data),
  });

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [staffForm, setStaffForm] = useState<StaffUserForm>(EMPTY_STAFF_FORM);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffFormTab, setStaffFormTab] = useState<'details' | 'modules'>('details');
  const [staffFormView, setStaffFormView] = useState<'list' | 'new' | 'edit'>('list');
  const [staffEditId, setStaffEditId] = useState<number | null>(null);

  const openCreateUser = () => {
    setEditingUserId(null);
    setStaffForm(EMPTY_STAFF_FORM);
    setStaffFormTab('details');
    setStaffModalOpen(true);
  };

  const openEditUser = (user: StaffUser) => {
    setEditingUserId(user.id);
    setStaffForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      password: '',
      typeId: user.userType?.id ? String(user.userType.id) : ((user as any).userTypeId ? String((user as any).userTypeId) : ''),
      isActive: user.isActive,
      moduleCodes: user.userModules?.map((um) => um.module.code) ?? [],
    });
    setStaffFormTab('details');
    setStaffModalOpen(true);
  };

  const handleSaveStaffUser = async () => {
    if (!staffForm.firstName.trim() || !staffForm.email.trim()) {
      toast.error('First name and email are required');
      return;
    }
    try {
      if (editingUserId !== null) {
        const payload: any = {
          firstName: staffForm.firstName.trim(),
          lastName: staffForm.lastName.trim(),
          phone: staffForm.phone.trim() || undefined,
          isActive: staffForm.isActive,
          ...(staffForm.typeId ? { typeId: Number(staffForm.typeId) } : {}),
        };
        if (staffForm.password.trim()) payload.password = staffForm.password.trim();
        await updateUserMutation.mutateAsync({ id: editingUserId, data: payload });
        await updateUserModulesMutation.mutateAsync({ id: editingUserId, moduleCodes: staffForm.moduleCodes });
        toast.success('User updated');
      } else {
        if (!staffForm.password.trim()) { toast.error('Password is required for new users'); return; }
        const created: any = await createUserMutation.mutateAsync({
          firstName: staffForm.firstName.trim(),
          lastName: staffForm.lastName.trim(),
          email: staffForm.email.trim(),
          phone: staffForm.phone.trim() || undefined,
          password: staffForm.password.trim(),
          isActive: staffForm.isActive,
          ...(staffForm.typeId ? { typeId: Number(staffForm.typeId) } : {}),
          moduleCodes: staffForm.moduleCodes,
        });
        toast.success('User created');
      }
      setStaffModalOpen(false);
    } catch {
      toast.error('Failed to save user');
    }
  };

  const handleToggleUserActive = async (user: StaffUser) => {
    try {
      await updateUserMutation.mutateAsync({ id: user.id, data: { isActive: !user.isActive } });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleForceLogout = async (user: StaffUser) => {
    const confirmed = await confirmDialog({
      title: 'Force Logout?',
      text: `Force logout ${user.firstName} ${user.lastName}? Their active session will be invalidated.`,
      confirmButtonText: 'Yes, force logout',
      icon: 'question',
    });
    if (!confirmed) return;
    try {
      await forceLogoutMutation.mutateAsync(user.id);
      toast.success('Session invalidated');
    } catch {
      toast.error('Force logout not available');
    }
  };

  const filteredStaffUsers = React.useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    if (!q) return staffUsers;
    return staffUsers.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.userType?.name || '').toLowerCase().includes(q)
    );
  }, [staffUsers, staffSearch]);
  // ─── End staff management ───────────────────────────────────────────────────

  const updateSiteSettingsMutation = useMutation({
    mutationFn: (data: any) => homepageAPI.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage', 'settings'] });
    },
  });
  const updateHomepageStatsMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => homepageAPI.updateStats(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage', 'stats'] });
    },
  });

  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [staff, setStaff] = useState<StaffMember[]>(STAFF_LIST);

  // Promotions — fully API-driven
  const { data: promotions = [], isLoading: isLoadingPromotions } = usePromotions();
  const createPromotionMut = useCreatePromotion();
  const updatePromotionMut = useUpdatePromotion();
  const togglePromotionMut = useTogglePromotion();
  const deletePromotionMut = useDeletePromotion();

  const categories = apiCategories;
  const productsList = apiProducts;

  const [editCat, setEditCat] = useState<number | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', slug: '', desc: '', active: true, imageUrl: '', branchId: '' });
  const [showPromotionEditor, setShowPromotionEditor] = useState(false);
  const [editingPromotionId, setEditingPromotionId] = useState<number | null>(null);
  const [promotionForm, setPromotionForm] = useState({
    label: '',
    pct: '',
    ends: '',
    banner: '',
    active: true,
  });

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<number | null>(null);
  const [trendingSearch, setTrendingSearch] = useState('');
  const [trendingBranchId, setTrendingBranchId] = useState('');

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    branchId: '',
    price: '',
    costPrice: '',
    stock: '',
    description: '',
    image: '',
    unitType: 'PIECE' as 'PIECE' | 'WEIGHT',
    unitLabel: 'pc',
    sizes: [] as Array<{ name: string; imageUrl: string; priceOverride: string }>,
  });

  React.useEffect(() => {
    if (!productForm.branchId && productForm.categoryId) {
      setProductForm((prev) => ({ ...prev, categoryId: '' }));
    }
  }, [productForm.branchId, productForm.categoryId]);

  React.useEffect(() => {
    if (!productForm.categoryId || productCategories.length === 0) return;
    const selectedCategoryExists = productCategories.some((c: any) => String(c.id) === productForm.categoryId);
    if (!selectedCategoryExists) {
      setProductForm((prev) => ({ ...prev, categoryId: '' }));
    }
  }, [productCategories, productForm.categoryId]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedSettings = window.localStorage.getItem(DASHBOARD_SETTINGS_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings) as Partial<SettingsState>;
        setSettings((prev) => ({ ...prev, ...parsed }));
      }

      const storedStaff = window.localStorage.getItem(DASHBOARD_STAFF_KEY);
      if (storedStaff) {
        const parsed = JSON.parse(storedStaff) as StaffMember[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStaff(parsed);
        }
      }

      // Clean up legacy promotions localStorage (now API-driven)
      window.localStorage.removeItem('mouchak.dashboard.promotions.v1');
    } catch {
      toast.error('Unable to read saved settings from browser storage');
    } finally {
      setIsHydrated(true);
    }
  }, []);

  React.useEffect(() => {
    if (!siteSettingsData && !homepageStatsData) return;

    setSettings((prev) => ({
      ...prev,
      ...(siteSettingsData ? {
        storeName: siteSettingsData.storeName || prev.storeName,
        primaryColor: siteSettingsData.primaryColor || prev.primaryColor,
        contactAddress: siteSettingsData.contactAddress || prev.contactAddress,
        contactPhone: siteSettingsData.contactPhone || prev.contactPhone,
        contactEmail: siteSettingsData.contactEmail || prev.contactEmail,
        heroHeadline: siteSettingsData.heroHeadline || prev.heroHeadline,
        heroYear: siteSettingsData.heroYear || prev.heroYear,
        heroDescription: siteSettingsData.heroDescription || prev.heroDescription,
      } : {}),
      ...(homepageStatsData
        ? {
          freeShippingOver: homepageStatsData.minFreeDeliveryAmount ?? prev.freeShippingOver,
          deliveryEstimate: homepageStatsData.deliveryTimeframe || prev.deliveryEstimate,
        }
        : {}),
    }));
  }, [homepageStatsData, siteSettingsData]);

  React.useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(DASHBOARD_SETTINGS_KEY, JSON.stringify(settings));
  }, [isHydrated, settings]);

  React.useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(DASHBOARD_STAFF_KEY, JSON.stringify(staff));
  }, [isHydrated, staff]);

  const handleAddCategory = async () => {
    if (!catForm.name || !catForm.branchId) {
      return toast.error('Category name and Branch are required');
    }
    try {
      // Upload pending image if any
      let imageUrl = catForm.imageUrl;
      if (categoryImageRef.current?.hasPending()) {
        const uploaded = await categoryImageRef.current.upload();
        if (uploaded) imageUrl = uploaded;
      }

      if (editCat) {
        await updateCategory.mutateAsync({
          id: editCat,
          data: {
            name: catForm.name,
            description: catForm.desc,
            isActive: catForm.active,
            imageUrl,
            branchId: Number(catForm.branchId),
          } as any,
        });
        toast.success('Category updated');
      } else {
        await createCategory.mutateAsync({
          name: catForm.name,
          description: catForm.desc,
          isActive: catForm.active,
          imageUrl,
          branchId: Number(catForm.branchId),
        } as any);
        toast.success('Category created');
      }
      setShowAddCat(false);
      setEditCat(null);
      setCatForm({ name: '', slug: '', desc: '', active: true, imageUrl: '', branchId: '' });
    } catch (error) {
      toast.error('Failed to save category');
    }
  };

  const handleUpdateCategoryStatus = async (id: number, isActive: boolean) => {
    try {
      await updateCategoryStatus.mutateAsync({ id, data: { isActive } });
      toast.success(`Category ${isActive ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update category status');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const confirmed = await confirmDialog({
      title: 'Delete Category?',
      text: 'This will permanently delete this category and may affect all products in it.',
      confirmButtonText: 'Yes, delete it',
      icon: 'warning',
    });
    if (confirmed) {
      try {
        await deleteCategory.mutateAsync(id);
        toast.success('Category permanently deleted');
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.sku || !productForm.price || !productForm.categoryId || !productForm.branchId) {
      return toast.error('Please fill all required fields, including Category and Branch');
    }
    try {
      // Upload pending image if any
      let imageUrl = productForm.image;
      if (productImageRef.current?.hasPending()) {
        const uploaded = await productImageRef.current.upload();
        if (uploaded) imageUrl = uploaded;
      }

      const defaultImage = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop';
      const images = imageUrl ? [imageUrl] : [defaultImage];

      const sizesPayload = productForm.sizes
        .filter((s) => s.name.trim())
        .map((s, i) => ({
          name: s.name.trim(),
          sortOrder: i,
          imageUrl: s.imageUrl || null,
          priceOverride: s.priceOverride ? Number(s.priceOverride) : null,
        }));

      if (editProduct) {
        await updateProduct.mutateAsync({
          id: editProduct,
          data: {
            name: productForm.name,
            sku: productForm.sku,
            price: Number(productForm.price),
            costPrice: productForm.costPrice ? Number(productForm.costPrice) : undefined,
            categoryId: Number(productForm.categoryId),
            branchId: Number(productForm.branchId),
            description: productForm.description,
            images,
            unitType: productForm.unitType,
            unitLabel: productForm.unitLabel,
            sizes: sizesPayload,
          } as any,
        });
        toast.success('Product updated successfully');
      } else {
        await createProduct.mutateAsync({
          name: productForm.name,
          sku: productForm.sku,
          price: Number(productForm.price),
          costPrice: productForm.costPrice ? Number(productForm.costPrice) : undefined,
          categoryId: Number(productForm.categoryId),
          branchId: Number(productForm.branchId),
          description: productForm.description,
          images,
          unitType: productForm.unitType,
          unitLabel: productForm.unitLabel,
          sizes: sizesPayload,
        } as any);
        toast.success('Product created successfully');
      }

      setProductForm({
        name: '',
        sku: '',
        categoryId: '',
        branchId: '',
        price: '',
        costPrice: '',
        stock: '',
        description: '',
        image: '',
        unitType: 'PIECE',
        unitLabel: 'pc',
        sizes: [],
      });
      setShowAddProduct(false);
      setEditProduct(null);
    } catch (error: any) {
      toast.error(error?.message || (editProduct ? 'Failed to update product' : 'Failed to create product'));
    }
  };

  const handleUpdateProductStatus = async (id: number, isActive: boolean) => {
    try {
      await updateProductStatus.mutateAsync({ id, data: { isActive } });
      toast.success(`Product ${isActive ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update product status');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const confirmed = await confirmDialog({
      title: 'Delete Product?',
      text: 'This will permanently delete this product. This cannot be undone.',
      confirmButtonText: 'Yes, delete it',
      icon: 'warning',
    });
    if (confirmed) {
      try {
        await deleteProduct.mutateAsync(id);
        toast.success('Product permanently deleted');
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };
  const triggerSavedIndicator = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const activePromotion = useMemo(
    () => promotions.find((p) => p.isActive) ?? null,
    [promotions]
  );

  const availableBranchNames = useMemo(() => {
    const dynamicBranchNames = branches.map((branch: any) => branch.name);
    if (dynamicBranchNames.length > 0) return dynamicBranchNames;
    return ['Dhaka Main', 'Chittagong', 'Sylhet Outlet'];
  }, [branches]);

  const openProductEditor = (product: any) => {
    const editBranchId = product.inventories?.[0]?.warehouseId?.toString() || '';
    setProductCategoryBranchId(editBranchId);
    setProductForm({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId?.toString() || '',
      branchId: editBranchId,
      price: product.price?.toString() || '',
      costPrice: product.costPrice?.toString() || '',
      stock: '',
      description: product.description || '',
      image: product.images?.[0] || '',
      unitType: product.unitType || 'PIECE',
      unitLabel: product.unitLabel || 'pc',
      sizes: (product.sizes || []).map((s: any) => ({
        name: s.name,
        imageUrl: s.imageUrl || '',
        priceOverride: s.priceOverride?.toString() || '',
      })),
    });
    setEditProduct(product.id);
    setShowAddProduct(true);
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSettings((prev) => ({ ...prev, storeLogo: String(reader.result || '') }));
      toast.success('Logo selected. Save to apply.');
    };
    reader.readAsDataURL(file);
  };

  const openPromotionEditor = (promotion?: APIPromotion) => {
    if (promotion) {
      setEditingPromotionId(promotion.id);
      setPromotionForm({
        label: promotion.label,
        pct: String(promotion.pct),
        ends: promotion.endsAt || '',
        banner: promotion.banner,
        active: promotion.isActive,
      });
    } else {
      setEditingPromotionId(null);
      setPromotionForm({ label: '', pct: '', ends: '', banner: '', active: true });
    }
    setShowPromotionEditor(true);
  };

  const handleSavePromotion = async () => {
    if (!promotionForm.label.trim() || !promotionForm.banner.trim()) {
      toast.error('Promotion label and banner text are required');
      return;
    }

    const percentage = Number(promotionForm.pct);
    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 95) {
      toast.error('Discount percentage must be between 1 and 95');
      return;
    }

    try {
      const payload = {
        label: promotionForm.label.trim(),
        banner: promotionForm.banner.trim(),
        pct: Math.round(percentage),
        endsAt: promotionForm.ends.trim() || undefined,
        isActive: promotionForm.active,
      };

      if (editingPromotionId !== null) {
        await updatePromotionMut.mutateAsync({ id: editingPromotionId, ...payload });
      } else {
        await createPromotionMut.mutateAsync(payload);
      }

      setShowPromotionEditor(false);
      setEditingPromotionId(null);
      toast.success('Promotion saved');
    } catch {
      toast.error('Failed to save promotion');
    }
  };

  const handleTogglePromotionActive = async (id: number) => {
    try {
      await togglePromotionMut.mutateAsync(id);
    } catch {
      toast.error('Failed to toggle promotion');
    }
  };

  const handleResetCurrentTab = () => {
    if (tab === 'general') {
      setSettings((prev) => ({
        ...prev,
        storeName: siteSettingsData?.storeName || DEFAULT_SETTINGS.storeName,
        primaryColor: siteSettingsData?.primaryColor || DEFAULT_SETTINGS.primaryColor,
        currency: DEFAULT_SETTINGS.currency,
        taxRate: DEFAULT_SETTINGS.taxRate,
        timezone: DEFAULT_SETTINGS.timezone,
        contactAddress: siteSettingsData?.contactAddress || DEFAULT_SETTINGS.contactAddress,
        contactPhone: siteSettingsData?.contactPhone || DEFAULT_SETTINGS.contactPhone,
        contactEmail: siteSettingsData?.contactEmail || DEFAULT_SETTINGS.contactEmail,
        heroHeadline: siteSettingsData?.heroHeadline || DEFAULT_SETTINGS.heroHeadline,
        heroYear: siteSettingsData?.heroYear || DEFAULT_SETTINGS.heroYear,
        heroDescription: siteSettingsData?.heroDescription || DEFAULT_SETTINGS.heroDescription,
        storeLogo: '',
      }));
    }

    if (tab === 'payment') {
      setSettings((prev) => ({
        ...prev,
        sslStoreId: DEFAULT_SETTINGS.sslStoreId,
        sslStoreSecret: DEFAULT_SETTINGS.sslStoreSecret,
        refundDays: DEFAULT_SETTINGS.refundDays,
        acceptedPayments: DEFAULT_SETTINGS.acceptedPayments,
      }));
    }

    if (tab === 'shipping') {
      setSettings((prev) => ({
        ...prev,
        defaultShipping: DEFAULT_SETTINGS.defaultShipping,
        freeShippingOver: homepageStatsData?.minFreeDeliveryAmount || DEFAULT_SETTINGS.freeShippingOver,
        deliveryEstimate: homepageStatsData?.deliveryTimeframe || DEFAULT_SETTINGS.deliveryEstimate,
      }));
    }

    if (tab === 'inventory') {
      setSettings((prev) => ({
        ...prev,
        lowStockThreshold: DEFAULT_SETTINGS.lowStockThreshold,
        autoReserve: DEFAULT_SETTINGS.autoReserve,
        barcodeEnabled: DEFAULT_SETTINGS.barcodeEnabled,
      }));
    }

    if (tab === 'notifications') {
      setSettings((prev) => ({
        ...prev,
        emailOrders: DEFAULT_SETTINGS.emailOrders,
        emailStock: DEFAULT_SETTINGS.emailStock,
        emailNewCustomer: DEFAULT_SETTINGS.emailNewCustomer,
        smsOrders: DEFAULT_SETTINGS.smsOrders,
        smsDelivery: DEFAULT_SETTINGS.smsDelivery,
      }));
    }

    if (tab === 'staff') {
      setStaff(STAFF_LIST);
    }

    toast.success('Current tab reset');
  };

  const handleSave = async (targetTab: string = tab) => {
    try {
      setIsSaving(true);

      if (targetTab === 'general') {
        await updateSiteSettingsMutation.mutateAsync({
          storeName: settings.storeName.trim() || DEFAULT_SETTINGS.storeName,
          primaryColor: settings.primaryColor || DEFAULT_SETTINGS.primaryColor,
          contactAddress: settings.contactAddress || DEFAULT_SETTINGS.contactAddress,
          contactPhone: settings.contactPhone || DEFAULT_SETTINGS.contactPhone,
          contactEmail: settings.contactEmail || DEFAULT_SETTINGS.contactEmail,
          heroHeadline: settings.heroHeadline || DEFAULT_SETTINGS.heroHeadline,
          heroYear: settings.heroYear || DEFAULT_SETTINGS.heroYear,
          heroDescription: settings.heroDescription || DEFAULT_SETTINGS.heroDescription,
        });
      }

      if (targetTab === 'shipping') {
        await updateHomepageStatsMutation.mutateAsync({
          minFreeDeliveryAmount: Number(settings.freeShippingOver) || 0,
          deliveryTimeframe: settings.deliveryEstimate || DEFAULT_SETTINGS.deliveryEstimate,
        });
      }

      if (targetTab === 'discounts') {
        // Sync the active promotion to homepage_stats for the storefront
        await updateHomepageStatsMutation.mutateAsync({
          currentOfferText: activePromotion?.banner || '',
          currentOfferPercentage: activePromotion?.pct || 0,
          isOfferActive: Boolean(activePromotion),
          minFreeDeliveryAmount: Number(settings.freeShippingOver) || 0,
          deliveryTimeframe: settings.deliveryEstimate || DEFAULT_SETTINGS.deliveryEstimate,
        });
      }

      if (targetTab === 'trending') {
        toast.success('Featured products published');
      } else if (targetTab === 'discounts') {
        toast.success('Promotions published');
      } else {
        toast.success('Settings saved');
      }

      triggerSavedIndicator();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const currentLabel = SETTINGS_ITEMS.find((i) => i.id === tab)?.label || '';

  const panels: any = {
    general: (
      <div>
        <FormSection title={t.settings.storeIdentity}>
          <div className={`mb-[14px] grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <label className={labelClass}>{t.settings.storeName}</label>
              <input
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Primary Brand Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-9 w-12 cursor-pointer rounded border border-border p-1 outline-none"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  />
                  <input
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className={inputClass}
                  />
                  <Btn
                    variant="secondary"
                    size="sm"
                    className="h-9 whitespace-nowrap"
                    onClick={() => setSettings({ ...settings, primaryColor: '#f01172' })}
                  >
                    Reset
                  </Btn>
                </div>
            </div>
            <div>
              <label className={labelClass}>{t.settings.currency}</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className={selectClass}
              >
                <option value="BDT">BDT — Bangladeshi Taka (৳)</option>
                <option value="USD">USD — US Dollar ($)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t.settings.taxRate}</label>
              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t.settings.timezone}</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className={selectClass}
              >
                <option value="Asia/Dhaka">Asia/Dhaka (GMT +6:00)</option>
                <option value="UTC">UTC (GMT +0:00)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-[14px] grid-cols-1 md:grid-cols-3">
            <div>
              <label className={labelClass}>Contact Address</label>
              <input
                value={settings.contactAddress}
                onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
                className={inputClass}
                placeholder="e.g. Dhaka, Bangladesh"
              />
            </div>
            <div>
              <label className={labelClass}>Contact Phone</label>
              <input
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className={inputClass}
                placeholder="e.g. +880 1XXX-XXXXXX"
              />
            </div>
            <div>
              <label className={labelClass}>Contact Email</label>
              <input
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className={inputClass}
                placeholder="e.g. hello@mouchak.com"
              />
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-8">
            <h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-zinc-400">Hero Section Content</h4>
            <div className="grid gap-[14px] grid-cols-1 md:grid-cols-2">
              <div>
                <label className={labelClass}>Hero Headline</label>
                <input
                  value={settings.heroHeadline}
                  onChange={(e) => setSettings({ ...settings, heroHeadline: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Spring Beauty"
                />
              </div>
              <div>
                <label className={labelClass}>Hero Year / Sub-label</label>
                <input
                  value={settings.heroYear}
                  onChange={(e) => setSettings({ ...settings, heroYear: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. 2026"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass}>Hero Description</label>
              <textarea
                value={settings.heroDescription}
                onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })}
                className={`${inputClass} min-h-[80px] py-3`}
                placeholder="Describe your collection..."
              />
            </div>
          </div>
          
          <div className="mt-8 border-t border-border pt-8">
            <label className={labelClass}>{t.settings.storeLogo}</label>
            <div
              onClick={() => logoInputRef.current?.click()}
              className="cursor-pointer rounded-[10px] border-2 border-dashed border-border px-5 py-5 text-center"
              style={{ background: Theme.muted }}
            >
              {settings.storeLogo ? (
                <img src={settings.storeLogo} alt="Store logo preview" className="mx-auto mb-2 h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="mb-1.5 text-2xl">🖼️</div>
              )}
              <div className="text-[13px]" style={{ color: Theme.mutedFg }}>
                {settings.storeLogo ? t.settings.clickToReplaceLogo : t.settings.clickToUploadLogo}
              </div>
            </div>
            <input ref={logoInputRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" onChange={handleLogoFileChange} className="hidden" />
          </div>
        </FormSection>
      </div>
    ),

    payment: (
      <div>
        <FormSection title={t.settings.paymentConfig}>
          <div className={`mb-[14px] grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <label className={labelClass}>{t.settings.storeId}</label>
              <input value={settings.sslStoreId} onChange={(e) => setSettings({ ...settings, sslStoreId: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t.settings.refundPolicy}</label>
              <input type="number" value={settings.refundDays} onChange={(e) => setSettings({ ...settings, refundDays: Number(e.target.value) })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>{t.settings.storeSignature}</label>
            <input type="password" value={settings.sslStoreSecret} onChange={(e) => setSettings({ ...settings, sslStoreSecret: e.target.value })} className={inputClass} placeholder={t.settings.enterApiSecret} />
          </div>
        </FormSection>
        <FormSection title={t.settings.acceptedPaymentMethods}>
          <div className="flex flex-col gap-3 mb-5">
            {homepageStatsData?.paymentMethods?.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-zinc-50/50 hover:bg-white transition-colors"
                style={{ opacity: method.isActive ? 1 : 0.6 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: method.isActive ? Theme.success : Theme.border }}
                  />
                  <span className="text-[13px] font-semibold" style={{ color: Theme.fg }}>
                    {method.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updatePaymentMethod.mutate({ id: method.id, data: { isActive: !method.isActive } })}
                    className="relative h-5 w-9 shrink-0 cursor-pointer rounded-full border-none transition-colors"
                    style={{ background: method.isActive ? Theme.primary : Theme.border }}
                  >
                    <div
                      className="absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-all"
                      style={{ left: method.isActive ? 18 : 2 }}
                    />
                  </button>

                  <button
                    onClick={async () => {
                      const confirmed = await confirmDialog({
                        title: 'Delete Payment Method?',
                        text: `Are you sure you want to remove "${method.name}"?`,
                        confirmButtonText: 'Yes, delete',
                        icon: 'warning'
                      });
                      if (confirmed) deletePaymentMethod.mutate(method.id);
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {(!homepageStatsData?.paymentMethods || homepageStatsData.paymentMethods.length === 0) && (
              <div className="py-4 text-center text-xs italic" style={{ color: Theme.mutedFg }}>
                No payment methods configured.
              </div>
            )}
          </div>

          <div className="flex gap-2 p-1 rounded-xl bg-zinc-100/50 border border-border">
            <input
              value={newPaymentMethod}
              onChange={(e) => setNewPaymentMethod(e.target.value)}
              placeholder="e.g. Rocket"
              className={`${inputClass} border-none bg-transparent h-10`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newPaymentMethod.trim()) {
                  e.preventDefault();
                  createPaymentMethod.mutate(newPaymentMethod.trim());
                  setNewPaymentMethod('');
                }
              }}
            />
            <Btn
              variant="primary"
              size="sm"
              className="h-10 px-6"
              onClick={() => {
                if (newPaymentMethod.trim()) {
                  createPaymentMethod.mutate(newPaymentMethod.trim());
                  setNewPaymentMethod('');
                }
              }}
            >
              Add Method
            </Btn>
          </div>
        </FormSection>
      </div>
    ),

    shipping: (
      <div>
        <FormSection title={t.settings.shippingRates}>
          <div className={`mb-[14px] grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <label className={labelClass}>{t.settings.defaultShipping}</label>
              <input
                type="number"
                value={settings.defaultShipping}
                onChange={(e) => setSettings({ ...settings, defaultShipping: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t.settings.freeShippingOver}</label>
              <input
                type="number"
                value={settings.freeShippingOver}
                onChange={(e) =>
                  setSettings({ ...settings, freeShippingOver: Number(e.target.value) })
                }
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>{t.settings.deliveryTimeEstimate}</label>
            <input
              value={settings.deliveryEstimate}
              onChange={(e) => setSettings({ ...settings, deliveryEstimate: e.target.value })}
              className={inputClass}
            />
          </div>
        </FormSection>
      </div>
    ),

    inventory: (
      <div>
        <FormSection title={t.settings.stockThresholds}>
          <div className={`grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <label className={labelClass}>{t.settings.lowStockAlert}</label>
              <input
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })
                }
                className={inputClass}
              />
            </div>
          </div>
        </FormSection>
        <FormSection title={t.settings.inventoryBehaviour}>
          <Toggle
            val={settings.autoReserve}
            onToggle={() => setSettings({ ...settings, autoReserve: !settings.autoReserve })}
            label={t.settings.autoReserve}
          />
          <Toggle
            val={settings.barcodeEnabled}
            onToggle={() =>
              setSettings({ ...settings, barcodeEnabled: !settings.barcodeEnabled })
            }
            label={t.settings.enableBarcode}
          />
        </FormSection>
      </div>
    ),

    notifications: (
      <div>
        <FormSection title={t.settings.emailNotifications}>
          <Toggle
            val={settings.emailOrders}
            onToggle={() => setSettings({ ...settings, emailOrders: !settings.emailOrders })}
            label={t.settings.newOrderPlaced}
          />
          <Toggle
            val={settings.emailStock}
            onToggle={() => setSettings({ ...settings, emailStock: !settings.emailStock })}
            label={t.settings.lowStockAlertEmail}
          />
          <Toggle
            val={settings.emailNewCustomer}
            onToggle={() =>
              setSettings({ ...settings, emailNewCustomer: !settings.emailNewCustomer })
            }
            label={t.settings.newCustomerRegistered}
          />
        </FormSection>
        <FormSection title={t.settings.smsNotifications}>
          <Toggle
            val={settings.smsOrders}
            onToggle={() => setSettings({ ...settings, smsOrders: !settings.smsOrders })}
            label={t.settings.orderConfSms}
          />
          <Toggle
            val={settings.smsDelivery}
            onToggle={() => setSettings({ ...settings, smsDelivery: !settings.smsDelivery })}
            label={t.settings.deliveryStatusSms}
          />
        </FormSection>
      </div>
    ),

    staff: (
      <div>
        {!isAdmin ? (
          <div className="rounded-xl border p-6 text-center text-sm font-semibold" style={{ borderColor: Theme.border, color: Theme.mutedFg }}>
            {t.settings.adminOnly}
          </div>
        ) : staffFormView !== 'list' ? (
          <StaffFormPageClient
            userId={staffFormView === 'edit' ? staffEditId : null}
            onBack={() => { setStaffFormView('list'); refetchStaff(); }}
          />
        ) : (
          <>
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <input
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder={t.settings.searchStaff}
                  className={inputClass}
                  style={{ maxWidth: 280 }}
                />
                <div className="text-[13px]" style={{ color: Theme.mutedFg }}>
                  {isLoadingStaff ? 'Loading…' : `${filteredStaffUsers.length} ${filteredStaffUsers.length !== 1 ? t.settings.users : t.settings.user}`}
                </div>
                <Btn variant="ghost" size="sm" onClick={() => refetchStaff()}>↻ {t.ecommerce.refresh}</Btn>
              </div>
              <Btn variant="primary" size="sm" onClick={() => setStaffFormView('new')}>{t.settings.addUser}</Btn>
            </div>

            {/* User list */}
            {isLoadingStaff ? (
              <div className="py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>Loading users…</div>
            ) : filteredStaffUsers.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>{t.settings.noStaffFound}</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {filteredStaffUsers.map((u) => {
                  const initials = `${u.firstName[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
                  const typeName = u.userType?.name || '—';
                  return (
                    <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-border bg-white px-[14px] py-3 transition" style={{ opacity: u.isActive ? 1 : 0.55 }}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold" style={{ background: Theme.secondary, color: Theme.primary }}>{initials || '?'}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: Theme.fg }}>{u.firstName} {u.lastName}</span>
                          {!u.isActive && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-gray-500">{t.settings.inactive}</span>}
                        </div>
                        <div className="text-[11px]" style={{ color: Theme.mutedFg }}>
                          {u.email}
                          {u.userModules && u.userModules.length > 0 && <span className="ml-2 opacity-70">· {u.userModules.length} {t.settings.modules}</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <Badge label={typeName} bg={Theme.secondary} color={Theme.primary} />
                        <Btn variant="ghost" size="sm" onClick={() => { setStaffEditId(u.id); setStaffFormView('edit'); }}>{t.settings.edit}</Btn>
                        <Btn variant="ghost" size="sm" onClick={() => handleToggleUserActive(u)}>{u.isActive ? t.settings.deactivate : t.settings.activate}</Btn>
                        <Btn variant="ghost" size="sm" onClick={() => handleForceLogout(u)}>{t.settings.forceLogout}</Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    ),

    trending: (
      <div>
        <FormSection title={t.settings.trendingProducts}>
          <div className="mb-[14px] text-[13px]" style={{ color: Theme.mutedFg }}>
            {t.settings.trendingDesc}
            <span className="ml-1 font-semibold" style={{ color: Theme.primary }}>
              {productsList.filter((p: any) => p.isFeatured).length} {t.settings.featured}
            </span>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              value={trendingSearch}
              onChange={(e) => setTrendingSearch(e.target.value)}
              placeholder={t.settings.searchProducts}
              className={inputClass}
              style={{ maxWidth: 240 }}
            />
            <select
              className={selectClass}
              value={trendingBranchId}
              onChange={(e) => setTrendingBranchId(e.target.value)}
              style={{ minWidth: 140 }}
            >
              <option value="">{t.settings.allBranches}</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2.5">
            {isLoadingProducts ? (
              <div className="py-4 text-center text-sm">{t.settings.loadingProducts}</div>
            ) : (() => {
              const q = trendingSearch.trim().toLowerCase();
              const filtered = productsList.filter((p: any) => {
                if (trendingBranchId && String(p.inventories?.[0]?.warehouseId) !== trendingBranchId) return false;
                if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !(p.category?.name || '').toLowerCase().includes(q)) return false;
                return true;
              });
              if (filtered.length === 0) return <div className="py-4 text-center text-sm">{t.settings.noProductsFound}</div>;
              // Show featured first, then the rest
              const sorted = [...filtered].sort((a: any, b: any) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
              return sorted.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-[10px] border bg-white px-[14px] py-3"
                  style={{ borderColor: p.isFeatured ? Theme.primary : Theme.border }}
                >
                  <input
                    type="checkbox"
                    checked={p.isFeatured}
                    onChange={async (e) => {
                      try {
                        await updateProduct.mutateAsync({
                          id: p.id,
                          data: { isFeatured: e.target.checked },
                        });
                        triggerSavedIndicator();
                        toast.success(e.target.checked ? 'Added to featured' : 'Removed from featured');
                      } catch {
                        toast.error('Failed to update product');
                      }
                    }}
                    className="h-4 w-4 shrink-0"
                    style={{ accentColor: Theme.primary }}
                  />
                  <div
                    className="h-9 w-9 shrink-0 overflow-hidden rounded"
                    style={{ background: Theme.muted }}
                  >
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm">📦</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold" style={{ color: Theme.fg }}>
                        {p.name}
                      </span>
                      {p.isFeatured && (
                        <span className="rounded bg-pink-50 px-1.5 py-0.5 text-[9px] font-bold text-pink-600 border border-pink-100">
                          {t.settings.featured}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px]" style={{ color: Theme.mutedFg }}>
                      {p.category?.name} · ৳{p.price} · {branches.find((b: any) => b.id === p.inventories?.[0]?.warehouseId)?.name || 'Default'}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </FormSection>
      </div>
    ),

    discounts: (
      <div>
        {showPromotionEditor && (
          <div
            className={`fixed inset-0 z-[9999] flex justify-center bg-black/50 ${isMobile ? 'items-end p-0' : 'items-center p-4'
              }`}
            onClick={() => { setShowPromotionEditor(false); setEditingPromotionId(null); }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`max-h-[92vh] w-full max-w-[560px] overflow-y-auto bg-white shadow-[0_24px_60px_rgba(0,0,0,0.2)] ${isMobile ? 'rounded-t-[20px]' : 'rounded-2xl'
                }`}
            >
              <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-border bg-white px-6 py-5">
                <div className="text-[17px] font-bold" style={{ color: Theme.fg }}>
                  {editingPromotionId !== null ? t.settings.editPromotion : t.settings.createPromotion}
                </div>
                <button
                  onClick={() => { setShowPromotionEditor(false); setEditingPromotionId(null); }}
                  className="cursor-pointer border-none bg-transparent text-xl leading-none"
                  style={{ color: Theme.mutedFg }}
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-4 p-6">
                <div>
                  <label className={labelClass}>{t.settings.promotionName}</label>
                  <input
                    className={inputClass}
                    value={promotionForm.label}
                    onChange={(e) => setPromotionForm((prev) => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g. Eid Flash Sale"
                  />
                </div>
                <div>
                  <label className={labelClass}>{t.settings.discountPct}</label>
                  <input
                    type="number"
                    className={inputClass}
                    min={1}
                    max={95}
                    value={promotionForm.pct}
                    onChange={(e) => setPromotionForm((prev) => ({ ...prev, pct: e.target.value }))}
                    placeholder="e.g. 20"
                  />
                </div>
                <div>
                  <label className={labelClass}>{t.settings.bannerText}</label>
                  <textarea
                    className={`${inputClass} h-20 resize-y`}
                    value={promotionForm.banner}
                    onChange={(e) => setPromotionForm((prev) => ({ ...prev, banner: e.target.value }))}
                    placeholder="e.g. Eid Special - 20% off sitewide!"
                  />
                </div>
                <div>
                  <label className={labelClass}>{t.settings.offerEndDate}</label>
                  <input
                    className={inputClass}
                    value={promotionForm.ends}
                    onChange={(e) => setPromotionForm((prev) => ({ ...prev, ends: e.target.value }))}
                    placeholder="e.g. Apr 30"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={promotionForm.active}
                    onChange={(e) =>
                      setPromotionForm((prev) => ({ ...prev, active: e.target.checked }))
                    }
                    style={{ accentColor: Theme.primary }}
                  />
                  {t.settings.markActive}
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <Btn variant="ghost" onClick={() => { setShowPromotionEditor(false); setEditingPromotionId(null); }}>
                    {t.settings.cancel}
                  </Btn>
                  <Btn variant="primary" onClick={handleSavePromotion}>
                    {t.settings.savePromotion}
                  </Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        <FormSection title={t.settings.activePromotions}>
          <div className="flex flex-col gap-3">
            {isLoadingPromotions ? (
              <div className="text-xs" style={{ color: Theme.mutedFg }}>{t.settings.loadingPromotions}</div>
            ) : promotions.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border-[1.5px] p-4"
                style={{
                  borderColor: d.isActive ? Theme.primary : Theme.border,
                  background: d.isActive ? Theme.secondary : '#fff',
                }}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold" style={{ color: Theme.fg }}>
                    {d.label}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge label={`${d.pct}% ${t.settings.off}`} bg={Theme.primary} color="#fff" />
                    <Badge
                      label={d.isActive ? t.settings.live : t.settings.paused}
                      bg={d.isActive ? '#dcfce7' : '#f5f5f5'}
                      color={d.isActive ? '#166534' : Theme.mutedFg}
                    />
                  </div>
                </div>
                <div className="mb-2 text-xs" style={{ color: Theme.mutedFg }}>
                  {d.banner}
                  {d.endsAt ? ` · ${t.settings.ends} ${d.endsAt}` : ''}
                </div>
                <div className="flex gap-2">
                  <Btn variant="ghost" size="sm" onClick={() => handleTogglePromotionActive(d.id)}>
                    {d.isActive ? t.settings.pause : t.settings.activate}
                  </Btn>
                  <Btn variant="ghost" size="sm" onClick={() => openPromotionEditor(d)}>
                    {t.settings.edit}
                  </Btn>
                  <Btn
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        await deletePromotionMut.mutateAsync(d.id);
                        toast.success('Promotion removed');
                      } catch {
                        toast.error('Failed to remove promotion');
                      }
                    }}
                  >
                    {t.settings.remove}
                  </Btn>
                </div>
              </div>
            ))}
            <Btn variant="secondary" size="sm" onClick={() => openPromotionEditor()}>
              {t.settings.createNewPromotion}
            </Btn>
          </div>
        </FormSection>
      </div>
    ),

  };

  return (
    <div className="flex flex-col gap-4">
      {isMobile && (
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value)}
          className="w-full cursor-pointer rounded-[10px] border border-border bg-white px-[14px] py-2.5 text-sm font-semibold text-foreground outline-none"
        >
          {SETTINGS_ITEMS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      )}

      <Card className={`${isMobile ? 'p-[18px]' : 'p-7'}`}>
        {tab !== 'staff' && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div className="text-base font-bold" style={{ color: Theme.fg }}>
              {currentLabel}
            </div>
            {['trending', 'discounts'].includes(tab) && (
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="text-xs font-semibold" style={{ color: Theme.success }}>
                    {t.settings.saved}
                  </span>
                )}
                <Btn variant="primary" size="sm" onClick={() => handleSave(tab)}>
                  {isSaving ? t.settings.saving : t.settings.saveAndPublish}
                </Btn>
              </div>
            )}
          </div>
        )}

        {panels[tab] || (
          <div className="text-[13px]" style={{ color: Theme.mutedFg }}>
            {t.settings.selectSetting}
          </div>
        )}

        {!['products', 'categories', 'trending', 'discounts', 'staff'].includes(tab) && (
          <div className="mt-8 flex items-center justify-end gap-2 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              {saved && (
                <span className="text-xs font-semibold" style={{ color: Theme.success }}>
                  {t.settings.saved}
                </span>
              )}
              <Btn variant="ghost" size="sm" onClick={handleResetCurrentTab}>
                {t.settings.reset}
              </Btn>
              <Btn variant="primary" size="sm" onClick={() => handleSave(tab)}>
                {isSaving ? t.settings.saving : t.settings.saveChanges}
              </Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

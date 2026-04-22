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
import { homepageAPI, useHomepageStats, useSiteSettings } from '@/modules/homepage';
import { useSession } from 'next-auth/react';
import apiClient from '@/shared/lib/apiClient';
import StaffFormPageClient from '@/app/(staff-dashboard)/dashboard/settings/staff/_components/StaffFormPageClient';

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
}

interface Promotion {
  id: number;
  label: string;
  active: boolean;
  pct: number;
  ends: string;
  banner: string;
}

const DASHBOARD_SETTINGS_KEY = 'mouchak.dashboard.settings.v1';
const DASHBOARD_STAFF_KEY = 'mouchak.dashboard.staff.v1';
const DASHBOARD_PROMOTIONS_KEY = 'mouchak.dashboard.promotions.v1';

const DEFAULT_SETTINGS: SettingsState = {
  storeName: 'Mouchak Cosmetics',
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

const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: 1,
    label: 'Eid Flash Sale',
    active: true,
    pct: 20,
    ends: 'Apr 15',
    banner: 'Eid Special - 20% off sitewide!',
  },
  {
    id: 2,
    label: 'Skincare Week',
    active: false,
    pct: 15,
    ends: 'Apr 20',
    banner: 'Skincare Week - 15% off all skincare',
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
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = true; // Staff dashboard is already protected by middleware; role-based UI gating can be added once role values are confirmed

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterBranchId, setFilterBranchId] = useState('');
  const [productCategoryBranchId, setProductCategoryBranchId] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

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
    if (!window.confirm(`Force logout ${user.firstName} ${user.lastName}? Their active session will be invalidated.`)) return;
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

  const updateSiteSettingsMutation = useMutation({    mutationFn: (data: Partial<{ storeName: string }>) => homepageAPI.updateSettings(data),
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
  const [promotions, setPromotions] = useState<Promotion[]>(DEFAULT_PROMOTIONS);

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

      const storedPromotions = window.localStorage.getItem(DASHBOARD_PROMOTIONS_KEY);
      if (storedPromotions) {
        const parsed = JSON.parse(storedPromotions) as Promotion[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPromotions(parsed);
        }
      }
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
      ...(siteSettingsData ? { storeName: siteSettingsData.storeName || prev.storeName } : {}),
      ...(homepageStatsData
        ? {
            freeShippingOver: homepageStatsData.minFreeDeliveryAmount ?? prev.freeShippingOver,
            deliveryEstimate: homepageStatsData.deliveryTimeframe || prev.deliveryEstimate,
          }
        : {}),
    }));

    if (homepageStatsData) {
      setPromotions((prev) => {
        const homepagePromo: Promotion = {
          id: 1,
          label: prev.find((item) => item.id === 1)?.label || 'Homepage Offer',
          active: Boolean(homepageStatsData.isOfferActive),
          pct: Number(homepageStatsData.currentOfferPercentage || 0),
          ends: prev.find((item) => item.id === 1)?.ends || '',
          banner: homepageStatsData.currentOfferText || prev.find((item) => item.id === 1)?.banner || '',
        };

        if (prev.some((item) => item.id === 1)) {
          return prev.map((item) => (item.id === 1 ? homepagePromo : item));
        }

        return [homepagePromo, ...prev];
      });
    }
  }, [homepageStatsData, siteSettingsData]);

  React.useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(DASHBOARD_SETTINGS_KEY, JSON.stringify(settings));
  }, [isHydrated, settings]);

  React.useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(DASHBOARD_STAFF_KEY, JSON.stringify(staff));
  }, [isHydrated, staff]);

  React.useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(DASHBOARD_PROMOTIONS_KEY, JSON.stringify(promotions));
  }, [isHydrated, promotions]);

  const handleAddCategory = async () => {
    if (!catForm.name || !catForm.branchId) {
      return toast.error('Category name and Branch are required');
    }
    try {
      if (editCat) {
        await updateCategory.mutateAsync({
          id: editCat,
          data: {
            name: catForm.name,
            description: catForm.desc,
            isActive: catForm.active,
            imageUrl: catForm.imageUrl,
            branchId: Number(catForm.branchId),
          } as any,
        });
        toast.success('Category updated');
      } else {
        await createCategory.mutateAsync({
          name: catForm.name,
          description: catForm.desc,
          isActive: catForm.active,
          imageUrl: catForm.imageUrl,
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
    if (window.confirm('Are you sure you want to PERMANENTLY delete this category? This will delete all products in this category too if not moved.')) {
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
      const defaultImage = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop';
      const images = productForm.image ? [productForm.image] : [defaultImage];

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
      });
      setShowAddProduct(false);
      setEditProduct(null);
    } catch (error) {
      toast.error(editProduct ? 'Failed to update product' : 'Failed to create product');
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
    if (window.confirm('Are you sure you want to PERMANENTLY delete this product? This cannot be undone.')) {
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
    () => promotions.find((promotion) => promotion.active) ?? null,
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

  const openPromotionEditor = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotionId(promotion.id);
      setPromotionForm({
        label: promotion.label,
        pct: String(promotion.pct),
        ends: promotion.ends,
        banner: promotion.banner,
        active: promotion.active,
      });
    } else {
      setEditingPromotionId(null);
      setPromotionForm({ label: '', pct: '', ends: '', banner: '', active: true });
    }
    setShowPromotionEditor(true);
  };

  const handleSavePromotion = () => {
    if (!promotionForm.label.trim() || !promotionForm.banner.trim()) {
      toast.error('Promotion label and banner text are required');
      return;
    }

    const percentage = Number(promotionForm.pct);
    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 95) {
      toast.error('Discount percentage must be between 1 and 95');
      return;
    }

    const draftPromotion: Promotion = {
      id: editingPromotionId ?? Date.now(),
      label: promotionForm.label.trim(),
      pct: Math.round(percentage),
      ends: promotionForm.ends.trim(),
      banner: promotionForm.banner.trim(),
      active: promotionForm.active,
    };

    setPromotions((prev) => {
      let next =
        editingPromotionId !== null
          ? prev.map((item) => (item.id === editingPromotionId ? draftPromotion : item))
          : [...prev, draftPromotion];

      if (draftPromotion.active) {
        next = next.map((item) =>
          item.id === draftPromotion.id ? { ...item, active: true } : { ...item, active: false }
        );
      }

      return next;
    });

    setShowPromotionEditor(false);
    setEditingPromotionId(null);
    triggerSavedIndicator();
    toast.success('Promotion saved');
  };

  const handleTogglePromotionActive = (id: number) => {
    setPromotions((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target) return prev;

      const shouldActivate = !target.active;
      return prev.map((item) => {
        if (item.id === id) return { ...item, active: shouldActivate };
        return shouldActivate ? { ...item, active: false } : item;
      });
    });
    triggerSavedIndicator();
  };

  const handleResetCurrentTab = () => {
    if (tab === 'general') {
      setSettings((prev) => ({
        ...prev,
        storeName: siteSettingsData?.storeName || DEFAULT_SETTINGS.storeName,
        currency: DEFAULT_SETTINGS.currency,
        taxRate: DEFAULT_SETTINGS.taxRate,
        timezone: DEFAULT_SETTINGS.timezone,
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
        });
      }

      if (targetTab === 'shipping') {
        await updateHomepageStatsMutation.mutateAsync({
          minFreeDeliveryAmount: Number(settings.freeShippingOver) || 0,
          deliveryTimeframe: settings.deliveryEstimate || DEFAULT_SETTINGS.deliveryEstimate,
        });
      }

      if (targetTab === 'discounts') {
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
    products: (
      <div>
        {/* <FormSection title="Products"> */}
          <div className="mb-[14px] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="text-[13px]" style={{ color: Theme.mutedFg }}>
                {isLoadingProducts
                  ? 'Loading...'
                  : `${productsList.length} product${productsList.length !== 1 ? 's' : ''}${
                      filterBranchId
                        ? ` in ${branches.find((b: any) => b.id === Number(filterBranchId))?.name ?? 'branch'}`
                        : ' across all branches'
                    }`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                className={selectClass}
                value={filterBranchId}
                onChange={(e) => setFilterBranchId(e.target.value)}
                style={{ minWidth: 140 }}
              >
                <option value="">All Branches</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <Btn
                variant="primary"
                size="sm"
                onClick={() => {
                  setProductCategoryBranchId(filterBranchId);
                  setProductForm({
                    name: '',
                    sku: '',
                    categoryId: '',
                    branchId: filterBranchId,
                    price: '',
                    costPrice: '',
                    stock: '',
                    description: '',
                    image: '',
                  });
                  setShowAddProduct(true);
                }}
              >
                ＋ Add Product
              </Btn>
            </div>
          </div>

          {(showAddProduct || editProduct !== null) && (
            <div
              className="mb-4 rounded-xl border-[1.5px] p-4"
              style={{ borderColor: Theme.primary, background: Theme.secondary }}
            >
              <div className="mb-3 text-sm font-bold" style={{ color: Theme.primary }}>
                {editProduct !== null ? 'Edit Product' : 'New Product'}
              </div>
              
              <div className="flex flex-col gap-4">
                <div className={`grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <div>
                    <label className={labelClass}>Product Name *</label>
                    <input
                      placeholder="e.g. Rose Glow Serum"
                      className={inputClass}
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>SKU *</label>
                    <input
                      placeholder="e.g. SKU-019"
                      className={inputClass}
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Category *</label>
                    <select
                      className={selectClass}
                      value={productForm.categoryId}
                      disabled={!productForm.branchId || isLoadingProductCategories}
                      onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    >
                      <option value="">
                        {!productForm.branchId
                          ? 'Select Branch First'
                          : isLoadingProductCategories
                            ? 'Loading categories...'
                            : 'Select Category'}
                      </option>
                      {productCategories.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      {productForm.branchId && !isLoadingProductCategories && productCategories.length === 0 && (
                        <option value="" disabled>
                          No categories for selected branch
                        </option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Branch *</label>
                    <select
                      className={selectClass}
                      value={productForm.branchId}
                      onChange={(e) => {
                        const nextBranchId = e.target.value;
                        setProductCategoryBranchId(nextBranchId);
                        setProductForm({ ...productForm, branchId: nextBranchId, categoryId: '' });
                      }}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Selling Price (৳) *</label>
                    <input
                      type="number"
                      placeholder="0"
                      className={inputClass}
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Cost/Actual Price (৳)</label>
                    <input
                      type="number"
                      placeholder="0"
                      className={inputClass}
                      value={productForm.costPrice}
                      onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    placeholder="Product description for storefront..."
                    className={`${inputClass} h-20 resize-y`}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelClass}>Product Image URL</label>
                  <input
                    placeholder="https://example.com/image.jpg"
                    className={inputClass}
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Btn
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddProduct(false);
                      setEditProduct(null);
                      setProductCategoryBranchId('');
                    }}
                  >
                    Cancel
                  </Btn>
                  <Btn variant="primary" size="sm" onClick={handleAddProduct}>
                    {editProduct !== null ? 'Save Changes' : 'Create Product'}
                  </Btn>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {isLoadingProducts ? (
              <div className="py-4 text-center text-sm">Loading products...</div>
            ) : productsList.length === 0 ? (
              <div className="py-4 text-center text-sm">No products found</div>
            ) : (
              productsList.map((p: any) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 rounded-[10px] border border-border bg-white px-[14px] py-3"
                  style={{ opacity: p.isActive ? 1 : 0.6 }}
                >
                  <div
                    className="h-10 w-10 shrink-0 overflow-hidden rounded text-lg"
                    style={{ background: Theme.muted }}
                  >
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      '📦'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold" style={{ color: Theme.fg }}>
                        {p.name}
                      </span>
                      {!p.isActive && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500 uppercase">
                          Inactive
                        </span>
                      )}
                      <span className="text-[11px]" style={{ color: Theme.mutedFg }}>
                        · ৳{p.price}
                      </span>
                    </div>
                    <div className="text-[11px]" style={{ color: Theme.mutedFg }}>
                      {p.category?.name} · Branch: {branches.find((b: any) => b.id === p.inventories?.[0]?.warehouseId)?.name || 'Default'} · SKU: {p.sku}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => openProductEditor(p)}
                    >
                      Edit
                    </Btn>
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateProductStatus(p.id, !p.isActive)}
                    >
                      {p.isActive ? 'Deactivate' : 'Activate'}
                    </Btn>
                    <Btn variant="ghost" size="sm" onClick={() => handleDeleteProduct(p.id)}>
                      🗑️
                    </Btn>
                  </div>
                </div>
              ))
            )}
          </div>
        {/* </FormSection> */}
      </div>
    ),

    categories: (
      <div>
        {/* <FormSection title="Product Categories"> */}
          <div className="mb-[14px] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="text-[13px]" style={{ color: Theme.mutedFg }}>
                {isLoadingCats
                  ? 'Loading...'
                  : `${categories.length} total categories`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                className={selectClass}
                value={filterBranchId}
                onChange={(e) => setFilterBranchId(e.target.value)}
                style={{ minWidth: 140 }}
              >
                <option value="">All Branches</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <Btn
                variant="primary"
                size="sm"
                onClick={() => {
                  setCatForm({ name: '', slug: '', desc: '', active: true, imageUrl: '', branchId: filterBranchId });
                  setShowAddCat(true);
                }}
              >
                ＋ New Category
              </Btn>
            </div>
          </div>

          {(showAddCat || editCat !== null) && (
            <div
              className="mb-4 rounded-xl border-[1.5px] p-4"
              style={{ borderColor: Theme.primary, background: Theme.secondary }}
            >
              <div className="mb-3 text-sm font-bold" style={{ color: Theme.primary }}>
                {editCat !== null ? 'Edit Category' : 'New Category'}
              </div>
              <div className={`mb-3 grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div>
                  <label className={labelClass}>Name *</label>
                  <input
                    value={catForm.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCatForm((f) => ({
                        ...f,
                        name: v,
                        slug: v.toLowerCase().replace(/\s+/g, '-'),
                      }));
                    }}
                    placeholder="e.g. Skincare"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Slug</label>
                  <input
                    value={catForm.slug}
                    onChange={(e) => setCatForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="skincare"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Branch *</label>
                  <select
                    className={selectClass}
                    value={catForm.branchId}
                    onChange={(e) => setCatForm((f) => ({ ...f, branchId: e.target.value }))}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={`${isMobile ? '' : 'col-span-2'}`}>
                  <label className={labelClass}>Description</label>
                  <input
                    value={catForm.desc}
                    onChange={(e) => setCatForm((f) => ({ ...f, desc: e.target.value }))}
                    placeholder="Short description"
                    className={inputClass}
                  />
                </div>
                <div className={`${isMobile ? '' : 'col-span-2'}`}>
                  <label className={labelClass}>Image URL</label>
                  <input
                    value={catForm.imageUrl}
                    onChange={(e) => setCatForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://example.com/category.jpg"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="mb-3 flex items-center gap-3.5">
                <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={catForm.active}
                    onChange={(e) => setCatForm((f) => ({ ...f, active: e.target.checked }))}
                    style={{ accentColor: Theme.primary }}
                  />
                  Active on storefront
                </label>
              </div>
              <div className="flex gap-2">
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddCat(false);
                    setEditCat(null);
                  }}
                >
                  Cancel
                </Btn>
                <Btn
                  variant="primary"
                  size="sm"
                  onClick={handleAddCategory}
                >
                  {editCat !== null ? 'Save Changes' : 'Create Category'}
                </Btn>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {isLoadingCats ? (
              <div className="py-4 text-center text-sm">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="py-4 text-center text-sm">No categories found</div>
            ) : (
              categories.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 rounded-[10px] border border-border bg-white px-[14px] py-3"
                  style={{ opacity: c.isActive ? 1 : 0.6 }}
                >
                  <div
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] text-lg"
                    style={{ background: c.isActive ? Theme.secondary : Theme.muted }}
                  >
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      categoryEmojis[c.name] || '🏷️'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: Theme.fg }}>
                        {c.name}
                      </span>
                      {!c.isActive && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500 uppercase">
                          Inactive
                        </span>
                      )}
                      <span className="font-mono text-[10px]" style={{ color: Theme.mutedFg }}>
                        /{c.slug}
                      </span>
                      {c.branchId ? (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600 border border-blue-100">
                          {branches.find((b: any) => b.id === c.branchId)?.name || 'Unknown Branch'}
                        </span>
                      ) : (
                        <span className="rounded bg-gray-50 px-1.5 py-0.5 text-[9px] font-medium text-gray-400 border border-gray-100">
                          Global
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs" style={{ color: Theme.mutedFg }}>
                      {c.description} · {c._count?.products || 0} products
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCatForm({
                          name: c.name,
                          slug: c.slug,
                          desc: c.description || '',
                          active: c.isActive,
                          imageUrl: c.imageUrl || '',
                          branchId: c.branchId?.toString() || '',
                        });
                        setEditCat(c.id);
                        setShowAddCat(true);
                      }}
                    >
                      Edit
                    </Btn>
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateCategoryStatus(c.id, !c.isActive)}
                    >
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </Btn>
                    <Btn variant="ghost" size="sm" onClick={() => handleDeleteCategory(c.id)}>
                      🗑️
                    </Btn>
                  </div>
                </div>
              ))
            )}
          </div>
        {/* </FormSection> */}
      </div>
    ),
    
    general: (
      <div>
        <FormSection title="Store Identity">
          <div className={`mb-[14px] grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <label className={labelClass}>Store Name</label>
              <input
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
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
              <label className={labelClass}>Tax Rate (%)</label>
              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Timezone</label>
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
          <div>
            <label className={labelClass}>Store Logo</label>
            <div
              onClick={() => logoInputRef.current?.click()}
              className="cursor-pointer rounded-[10px] border-2 border-dashed border-border px-5 py-5 text-center"
              style={{ background: Theme.muted }}
            >
              {settings.storeLogo ? (
                <img
                  src={settings.storeLogo}
                  alt="Store logo preview"
                  className="mx-auto mb-2 h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="mb-1.5 text-2xl">🖼️</div>
              )}
              <div className="text-[13px]" style={{ color: Theme.mutedFg }}>
                {settings.storeLogo
                  ? 'Click to replace logo · PNG or SVG · Max 2MB'
                  : 'Click to upload logo · PNG or SVG · Max 2MB'}
              </div>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              onChange={handleLogoFileChange}
              className="hidden"
            />
          </div>
        </FormSection>
      </div>
    ),

    payment: (
      <div>
        <FormSection title="SSLCommerz Configuration">
          <div className={`mb-[14px] grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <label className={labelClass}>Store ID</label>
              <input
                value={settings.sslStoreId}
                onChange={(e) => setSettings({ ...settings, sslStoreId: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Refund Policy (days)</label>
              <input
                type="number"
                value={settings.refundDays}
                onChange={(e) => setSettings({ ...settings, refundDays: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Store Signature (API Secret)</label>
            <input
              type="password"
              value={settings.sslStoreSecret}
              onChange={(e) => setSettings({ ...settings, sslStoreSecret: e.target.value })}
              className={inputClass}
              placeholder="Enter API secret"
            />
          </div>
        </FormSection>
        <FormSection title="Accepted Payment Methods">
          <Toggle
            val={settings.acceptedPayments.bkash}
            onToggle={() =>
              setSettings({
                ...settings,
                acceptedPayments: {
                  ...settings.acceptedPayments,
                  bkash: !settings.acceptedPayments.bkash,
                },
              })
            }
            label="bKash 🔴"
          />
          <Toggle
            val={settings.acceptedPayments.nagad}
            onToggle={() =>
              setSettings({
                ...settings,
                acceptedPayments: {
                  ...settings.acceptedPayments,
                  nagad: !settings.acceptedPayments.nagad,
                },
              })
            }
            label="Nagad 🟠"
          />
          <Toggle
            val={settings.acceptedPayments.card}
            onToggle={() =>
              setSettings({
                ...settings,
                acceptedPayments: {
                  ...settings.acceptedPayments,
                  card: !settings.acceptedPayments.card,
                },
              })
            }
            label="Card (Visa/Mastercard) 💳"
          />
          <Toggle
            val={settings.acceptedPayments.cash}
            onToggle={() =>
              setSettings({
                ...settings,
                acceptedPayments: {
                  ...settings.acceptedPayments,
                  cash: !settings.acceptedPayments.cash,
                },
              })
            }
            label="Cash 💵"
          />
        </FormSection>
      </div>
    ),

    shipping: (
      <div>
        <FormSection title="Shipping Rates">
          <div className={`mb-[14px] grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <label className={labelClass}>Default Shipping Cost (৳)</label>
              <input
                type="number"
                value={settings.defaultShipping}
                onChange={(e) => setSettings({ ...settings, defaultShipping: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Free Shipping Over (৳)</label>
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
            <label className={labelClass}>Delivery Time Estimate</label>
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
        <FormSection title="Stock Thresholds">
          <div className={`grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <label className={labelClass}>Low Stock Alert Threshold</label>
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
        <FormSection title="Inventory Behaviour">
          <Toggle
            val={settings.autoReserve}
            onToggle={() => setSettings({ ...settings, autoReserve: !settings.autoReserve })}
            label="Auto-reserve stock on checkout"
          />
          <Toggle
            val={settings.barcodeEnabled}
            onToggle={() =>
              setSettings({ ...settings, barcodeEnabled: !settings.barcodeEnabled })
            }
            label="Enable barcode scanning"
          />
        </FormSection>
      </div>
    ),

    notifications: (
      <div>
        <FormSection title="Email Notifications">
          <Toggle
            val={settings.emailOrders}
            onToggle={() => setSettings({ ...settings, emailOrders: !settings.emailOrders })}
            label="New order placed"
          />
          <Toggle
            val={settings.emailStock}
            onToggle={() => setSettings({ ...settings, emailStock: !settings.emailStock })}
            label="Low stock alert"
          />
          <Toggle
            val={settings.emailNewCustomer}
            onToggle={() =>
              setSettings({ ...settings, emailNewCustomer: !settings.emailNewCustomer })
            }
            label="New customer registered"
          />
        </FormSection>
        <FormSection title="SMS Notifications">
          <Toggle
            val={settings.smsOrders}
            onToggle={() => setSettings({ ...settings, smsOrders: !settings.smsOrders })}
            label="Order confirmation SMS"
          />
          <Toggle
            val={settings.smsDelivery}
            onToggle={() => setSettings({ ...settings, smsDelivery: !settings.smsDelivery })}
            label="Delivery status SMS"
          />
        </FormSection>
      </div>
    ),

    staff: (
      <div>
        {!isAdmin ? (
          <div className="rounded-xl border p-6 text-center text-sm font-semibold" style={{ borderColor: Theme.border, color: Theme.mutedFg }}>
            🔒 Only system administrators can manage users and permissions.
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
                  placeholder="Search by name, email or type…"
                  className={inputClass}
                  style={{ maxWidth: 280 }}
                />
                <div className="text-[13px]" style={{ color: Theme.mutedFg }}>
                  {isLoadingStaff ? 'Loading…' : `${filteredStaffUsers.length} user${filteredStaffUsers.length !== 1 ? 's' : ''}`}
                </div>
                <Btn variant="ghost" size="sm" onClick={() => refetchStaff()}>↻ Refresh</Btn>
              </div>
              <Btn variant="primary" size="sm" onClick={() => setStaffFormView('new')}>＋ Add User</Btn>
            </div>

            {/* User list */}
            {isLoadingStaff ? (
              <div className="py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>Loading users…</div>
            ) : filteredStaffUsers.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>No staff users found.</div>
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
                          {!u.isActive && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-gray-500">Inactive</span>}
                        </div>
                        <div className="text-[11px]" style={{ color: Theme.mutedFg }}>
                          {u.email}
                          {u.userModules && u.userModules.length > 0 && <span className="ml-2 opacity-70">· {u.userModules.length} module{u.userModules.length !== 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <Badge label={typeName} bg={Theme.secondary} color={Theme.primary} />
                        <Btn variant="ghost" size="sm" onClick={() => { setStaffEditId(u.id); setStaffFormView('edit'); }}>Edit</Btn>
                        <Btn variant="ghost" size="sm" onClick={() => handleToggleUserActive(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</Btn>
                        <Btn variant="ghost" size="sm" onClick={() => handleForceLogout(u)}>Force Logout</Btn>
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
        <FormSection title="Trending Products on Homepage">
          <div className="mb-[14px] text-[13px]" style={{ color: Theme.mutedFg }}>
            Select products to feature in the Trending section on your storefront.
          </div>
          <div className="flex flex-col gap-2.5">
            {isLoadingProducts ? (
              <div className="py-4 text-center text-sm">Loading products...</div>
            ) : productsList.length === 0 ? (
              <div className="py-4 text-center text-sm">No products found</div>
            ) : (
              productsList.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-[10px] border border-border bg-white px-[14px] py-3"
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
                        toast.success('Product updated');
                      } catch {
                        toast.error('Failed to update product');
                      }
                    }}
                    className="h-4 w-4 shrink-0"
                    style={{ accentColor: Theme.primary }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold" style={{ color: Theme.fg }}>
                      {p.name}
                    </div>
                    <div className="text-[11px]" style={{ color: Theme.mutedFg }}>
                      {p.category?.name} · ৳{p.price} · SKU: {p.sku}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTab('products');
                        openProductEditor(p);
                      }}
                    >
                      Edit
                    </Btn>
                    <Btn variant="ghost" size="sm" onClick={() => handleDeleteProduct(p.id)}>
                      🗑️
                    </Btn>
                  </div>
                </div>
              ))
            )}
          </div>
        </FormSection>
      </div>
    ),

    discounts: (
      <div>
        {showPromotionEditor && (
          <div
            className={`fixed inset-0 z-[9999] flex justify-center bg-black/50 ${
              isMobile ? 'items-end p-0' : 'items-center p-4'
            }`}
            onClick={() => setShowPromotionEditor(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`max-h-[92vh] w-full max-w-[560px] overflow-y-auto bg-white shadow-[0_24px_60px_rgba(0,0,0,0.2)] ${
                isMobile ? 'rounded-t-[20px]' : 'rounded-2xl'
              }`}
            >
              <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-border bg-white px-6 py-5">
                <div className="text-[17px] font-bold" style={{ color: Theme.fg }}>
                  {editingPromotionId !== null ? 'Edit Promotion' : 'Create Promotion'}
                </div>
                <button
                  onClick={() => setShowPromotionEditor(false)}
                  className="cursor-pointer border-none bg-transparent text-xl leading-none"
                  style={{ color: Theme.mutedFg }}
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-4 p-6">
                <div>
                  <label className={labelClass}>Promotion Name *</label>
                  <input
                    className={inputClass}
                    value={promotionForm.label}
                    onChange={(e) => setPromotionForm((prev) => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g. Eid Flash Sale"
                  />
                </div>
                <div>
                  <label className={labelClass}>Discount Percentage *</label>
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
                  <label className={labelClass}>Banner Text *</label>
                  <textarea
                    className={`${inputClass} h-20 resize-y`}
                    value={promotionForm.banner}
                    onChange={(e) => setPromotionForm((prev) => ({ ...prev, banner: e.target.value }))}
                    placeholder="e.g. Eid Special - 20% off sitewide!"
                  />
                </div>
                <div>
                  <label className={labelClass}>Offer End Date (label)</label>
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
                  Mark as active offer
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <Btn variant="ghost" onClick={() => setShowPromotionEditor(false)}>
                    Cancel
                  </Btn>
                  <Btn variant="primary" onClick={handleSavePromotion}>
                    Save Promotion
                  </Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        <FormSection title="Active Promotions">
          <div className="flex flex-col gap-3">
            {promotions.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border-[1.5px] p-4"
                style={{
                  borderColor: d.active ? Theme.primary : Theme.border,
                  background: d.active ? Theme.secondary : '#fff',
                }}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold" style={{ color: Theme.fg }}>
                    {d.label}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge label={`${d.pct}% OFF`} bg={Theme.primary} color="#fff" />
                    <Badge
                      label={d.active ? 'Live' : 'Paused'}
                      bg={d.active ? '#dcfce7' : '#f5f5f5'}
                      color={d.active ? '#166534' : Theme.mutedFg}
                    />
                  </div>
                </div>
                <div className="mb-2 text-xs" style={{ color: Theme.mutedFg }}>
                  {d.banner}
                  {d.ends ? ` · Ends ${d.ends}` : ''}
                </div>
                <div className="flex gap-2">
                  <Btn variant="ghost" size="sm" onClick={() => handleTogglePromotionActive(d.id)}>
                    {d.active ? 'Pause' : 'Activate'}
                  </Btn>
                  <Btn variant="ghost" size="sm" onClick={() => openPromotionEditor(d)}>
                    Edit
                  </Btn>
                  <Btn
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPromotions((prev) => prev.filter((item) => item.id !== d.id));
                      triggerSavedIndicator();
                    }}
                  >
                    Remove
                  </Btn>
                </div>
              </div>
            ))}
            <Btn variant="secondary" size="sm" onClick={() => openPromotionEditor()}>
              ＋ Create New Promotion
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
                  ✓ Saved
                </span>
              )}
              <Btn variant="primary" size="sm" onClick={() => handleSave(tab)}>
                {isSaving ? 'Saving...' : 'Save & Publish'}
              </Btn>
            </div>
          )}
        </div>
        )}

        {panels[tab] || (
          <div className="text-[13px]" style={{ color: Theme.mutedFg }}>
            Select a setting from the menu.
          </div>
        )}

        {!['products', 'categories', 'trending', 'discounts', 'staff'].includes(tab) && (
          <div className="mt-8 flex items-center justify-end gap-2 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              {saved && (
                <span className="text-xs font-semibold" style={{ color: Theme.success }}>
                  ✓ Saved
                </span>
              )}
              <Btn variant="ghost" size="sm" onClick={handleResetCurrentTab}>
                Reset
              </Btn>
              <Btn variant="primary" size="sm" onClick={() => handleSave(tab)}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

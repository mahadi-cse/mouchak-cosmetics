'use client';

import React, { useState } from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, Btn, Badge } from '../Primitives';
import { SETTINGS_ITEMS } from '@/modules/dashboard/utils/constants';
import { INITIAL_PRODUCTS } from '@/modules/dashboard/data/mockData';
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

interface SettingsViewProps {
  products: any[];
  tab: string;
  setTab: (tab: string) => void;
}

const STAFF_LIST = [
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

const INITIAL_CATEGORIES = [
  {
    id: 1,
    name: 'Skincare',
    slug: 'skincare',
    desc: 'Serums, moisturisers, cleansers',
    active: true,
    products: 48,
  },
  {
    id: 2,
    name: 'Lipstick',
    slug: 'lipstick',
    desc: 'Matte, gloss, liquid lip colours',
    active: true,
    products: 34,
  },
  {
    id: 3,
    name: 'Foundation',
    slug: 'foundation',
    desc: 'Liquid, powder, cushion bases',
    active: true,
    products: 22,
  },
  {
    id: 4,
    name: 'Eyewear',
    slug: 'eyewear',
    desc: 'Palettes, liner, mascara',
    active: true,
    products: 17,
  },
  {
    id: 5,
    name: 'Fragrance',
    slug: 'fragrance',
    desc: 'Perfumes and body mists',
    active: false,
    products: 9,
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

export default function SettingsView({ products, tab, setTab }: SettingsViewProps) {
  const { isMobile } = useResponsive();
  const [saved, setSaved] = useState(false);
  const [filterBranchId, setFilterBranchId] = useState('');
  
  const { data: apiCategories = [], isLoading: isLoadingCats } = useListCategories({ includeInactive: true }); // Always fetch all for UI control
  const { data: apiProducts = [], isLoading: isLoadingProducts } = useListProducts(
    { 
      limit: 100, 
      includeInactive: true, // Display everything in settings
      ...(filterBranchId ? { branchId: Number(filterBranchId) } : {}) 
    },
    { queryKey: ['products', 'list', { branchId: filterBranchId, includeInactive: true }] }
  );
  const { data: branches = [], isLoading: isLoadingBranches } = useListBranches();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const updateCategoryStatus = useUpdateCategoryStatus();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateProductStatus = useUpdateProductStatus();

  const [categories, setCategories] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);

  React.useEffect(() => {
    if (apiCategories) setCategories(apiCategories);
  }, [apiCategories]);

  React.useEffect(() => {
    if (apiProducts) setProductsList(apiProducts);
  }, [apiProducts]);

  const [staff, setStaff] = useState(STAFF_LIST);
  const [editCat, setEditCat] = useState<number | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', slug: '', desc: '', active: true, imageUrl: '', branchId: '' });
  const [editingStaff, setEditingStaff] = useState<number | null>(null);
  const [staffForm, setStaffForm] = useState({ role: '', branch: '', status: 'active' });

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
          },
        });
        toast.success('Category updated');
      } else {
        await createCategory.mutateAsync({
          name: catForm.name,
          description: catForm.desc,
          isActive: catForm.active,
          imageUrl: catForm.imageUrl,
          branchId: Number(catForm.branchId),
        });
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
          },
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
        });
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
  const [settings, setSettings] = useState({
    storeName: 'Mouchak Cosmetics',
    currency: 'BDT',
    taxRate: 15,
    timezone: 'Asia/Dhaka',
    lowStockThreshold: 15,
    autoReserve: true,
    barcodeEnabled: true,
    sslStoreId: 'mouchak_store_01',
    refundDays: 7,
    defaultShipping: 80,
    freeShippingOver: 1000,
    deliveryEstimate: '3-5 business days',
    emailOrders: true,
    emailStock: true,
    emailNewCustomer: false,
    smsOrders: false,
    smsDelivery: true,
    acceptedPayments: { bkash: true, nagad: true, card: true, cash: true },
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
                      onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Branch *</label>
                    <select
                      className={selectClass}
                      value={productForm.branchId}
                      onChange={(e) => setProductForm({ ...productForm, branchId: e.target.value })}
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
                    }}
                  >
                    Cancel
                  </Btn>
                  <Btn variant="primary" size="sm" onClick={handleAddProduct} isLoading={createProduct.isPending || updateProduct.isPending}>
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
                      onClick={() => {
                        setProductForm({
                          name: p.name,
                          sku: p.sku,
                          categoryId: p.categoryId?.toString() || '',
                          branchId: p.inventories?.[0]?.warehouseId?.toString() || '',
                          price: p.price?.toString() || '',
                          costPrice: p.costPrice?.toString() || '',
                          stock: '',
                          description: p.description || '',
                          image: p.images?.[0] || '',
                        });
                        setEditProduct(p.id);
                        setShowAddProduct(true);
                      }}
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
                  isLoading={createCategory.isPending || updateCategory.isPending}
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
              className="cursor-pointer rounded-[10px] border-2 border-dashed border-border px-5 py-5 text-center"
              style={{ background: Theme.muted }}
            >
              <div className="mb-1.5 text-2xl">🖼️</div>
              <div className="text-[13px]" style={{ color: Theme.mutedFg }}>
                Click to upload logo · PNG or SVG · Max 2MB
              </div>
            </div>
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
            <input type="password" defaultValue="*********************" className={inputClass} />
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
        {editingStaff !== null && (
          <div
            className={`fixed inset-0 z-[9999] flex justify-center bg-black/50 ${
              isMobile ? 'items-end p-0' : 'items-center p-4'
            }`}
            onClick={() => setEditingStaff(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`max-h-[92vh] w-full max-w-[500px] overflow-y-auto bg-white shadow-[0_24px_60px_rgba(0,0,0,0.2)] ${
                isMobile ? 'rounded-t-[20px]' : 'rounded-2xl'
              }`}
            >
              {isMobile && (
                <div
                  className="mx-auto mt-3 h-1 w-10 rounded"
                  style={{ background: Theme.border }}
                />
              )}
              <div
                className="sticky top-0 z-[1] flex items-center justify-between border-b border-border bg-white px-6 py-5"
              >
                <div>
                  <div className="text-[17px] font-bold" style={{ color: Theme.fg }}>
                    Edit Staff Member
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: Theme.mutedFg }}>
                    {staff.find((s) => s.id === editingStaff)?.name}
                  </div>
                </div>
                <button
                  onClick={() => setEditingStaff(null)}
                  className="cursor-pointer border-none bg-transparent text-xl leading-none"
                  style={{ color: Theme.mutedFg }}
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-[18px] p-6">
                <div>
                  <label className={labelClass}>Role</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className={selectClass}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Branch</label>
                  <select
                    value={staffForm.branch}
                    onChange={(e) => setStaffForm({ ...staffForm, branch: e.target.value })}
                    className={selectClass}
                  >
                    <option value="Dhaka Main">Dhaka Main</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Sylhet Outlet">Sylhet Outlet</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={staffForm.status}
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                    className={selectClass}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <Btn variant="ghost" onClick={() => setEditingStaff(null)}>
                    Cancel
                  </Btn>
                  <Btn
                    variant="primary"
                    onClick={() => {
                      setStaff((prev) =>
                        prev.map((s) =>
                          s.id === editingStaff
                            ? {
                                ...s,
                                role: staffForm.role,
                                branch: staffForm.branch,
                                status: staffForm.status,
                              }
                            : s
                        )
                      );
                      setEditingStaff(null);
                      setSaved(true);
                      setTimeout(() => setSaved(false), 2500);
                    }}
                  >
                    Save Changes
                  </Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        <FormSection title="Staff Members">
          <div className="mb-[14px] flex flex-col gap-2.5">
            {staff.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-[10px] border border-border bg-white px-[14px] py-3"
              >
                <div
                  className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
                  style={{ background: Theme.secondary, color: Theme.primary }}
                >
                  {s.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold" style={{ color: Theme.fg }}>
                    {s.name}
                  </div>
                  <div
                    className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px]"
                    style={{ color: Theme.mutedFg }}
                  >
                    {s.email} · {s.branch}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge
                    label={s.role}
                    bg={s.role === 'Admin' ? '#fef9c3' : '#f5f5f5'}
                    color={s.role === 'Admin' ? '#854d0e' : Theme.mutedFg}
                  />
                  <Btn
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStaffForm({ role: s.role, branch: s.branch, status: s.status });
                      setEditingStaff(s.id);
                    }}
                  >
                    Edit
                  </Btn>
                  <Btn
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setStaff((prev) =>
                        prev.map((item) =>
                          item.id === s.id
                            ? {
                                ...item,
                                status: item.status === 'active' ? 'inactive' : 'active',
                              }
                            : item
                        )
                      )
                    }
                  >
                    {s.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Btn>
                </div>
              </div>
            ))}
          </div>
          <Btn variant="primary" size="sm">
            + Invite Staff Member
          </Btn>
        </FormSection>
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
                        // Implement edit product if needed
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
        <FormSection title="Active Promotions">
          <div className="flex flex-col gap-3">
            {[
              {
                id: 1,
                label: 'Eid Flash Sale',
                active: true,
                pct: 20,
                ends: 'Apr 15',
                banner: '🎉 Eid Special — 20% off sitewide!',
              },
              {
                id: 2,
                label: 'Skincare Week',
                active: false,
                pct: 15,
                ends: 'Apr 20',
                banner: '✨ Skincare Week — 15% off all skincare',
              },
            ].map((d) => (
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
                  {d.banner} · Ends {d.ends}
                </div>
                <div className="flex gap-2">
                  <Btn variant="ghost" size="sm">
                    {d.active ? 'Pause' : 'Activate'}
                  </Btn>
                  <Btn variant="ghost" size="sm">
                    Edit
                  </Btn>
                </div>
              </div>
            ))}
            <Btn variant="secondary" size="sm">
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
              <Btn variant="primary" size="sm" onClick={handleSave}>
                Save & Publish
              </Btn>
            </div>
          )}
        </div>

        {panels[tab] || (
          <div className="text-[13px]" style={{ color: Theme.mutedFg }}>
            Select a setting from the menu.
          </div>
        )}

        {!['products', 'categories', 'trending', 'discounts'].includes(tab) && (
          <div className="mt-8 flex items-center justify-end gap-2 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              {saved && (
                <span className="text-xs font-semibold" style={{ color: Theme.success }}>
                  ✓ Saved
                </span>
              )}
              <Btn variant="ghost" size="sm">
                Reset
              </Btn>
              <Btn variant="primary" size="sm" onClick={handleSave}>
                Save Changes
              </Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

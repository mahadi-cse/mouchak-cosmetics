'use client';

import React, { useState } from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, Btn, Badge } from '../Primitives';
import { SETTINGS_ITEMS } from '@/modules/dashboard/utils/constants';
import { INITIAL_PRODUCTS } from '@/modules/dashboard/data/mockData';

interface SettingsViewProps {
  products: any[];
  tab: string;
  setTab: (tab: string) => void;
}

const STAFF_LIST = [
  { id: 1, name: 'Karim Hossain', email: 'karim@mouchak.com', role: 'Admin', branch: 'Dhaka Main', status: 'active' },
  { id: 2, name: 'Fatima Khanam', email: 'fatima@mouchak.com', role: 'Staff', branch: 'Chittagong', status: 'active' },
  { id: 3, name: 'Raihan Ahmed', email: 'raihan@mouchak.com', role: 'Staff', branch: 'Sylhet Outlet', status: 'inactive' },
];

const INITIAL_CATEGORIES = [
  { id: 1, name: 'Skincare', slug: 'skincare', desc: 'Serums, moisturisers, cleansers', active: true, products: 48 },
  { id: 2, name: 'Lipstick', slug: 'lipstick', desc: 'Matte, gloss, liquid lip colours', active: true, products: 34 },
  { id: 3, name: 'Foundation', slug: 'foundation', desc: 'Liquid, powder, cushion bases', active: true, products: 22 },
  { id: 4, name: 'Eyewear', slug: 'eyewear', desc: 'Palettes, liner, mascara', active: true, products: 17 },
  { id: 5, name: 'Fragrance', slug: 'fragrance', desc: 'Perfumes and body mists', active: false, products: 9 },
];

export default function SettingsView({ products, tab, setTab }: SettingsViewProps) {
  const { isMobile } = useResponsive();
  const [saved, setSaved] = useState(false);
  const [staff, setStaff] = useState(STAFF_LIST);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [editCat, setEditCat] = useState<number | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', slug: '', desc: '', active: true });
  const [editingStaff, setEditingStaff] = useState<number | null>(null);
  const [staffForm, setStaffForm] = useState({ role: '', branch: '', status: 'active' });
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

  const inp = {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid ${Theme.border}`,
    borderRadius: 8,
    fontSize: 13,
    color: Theme.fg,
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const lbl = {
    fontSize: 12,
    fontWeight: 600 as const,
    color: Theme.fg,
    marginBottom: 6,
    display: 'block' as const,
  };

  const FormSection = ({ title, children }: any) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: Theme.fg, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${Theme.secondary}` }}>
        {title}
      </div>
      {children}
    </div>
  );

  const Toggle = ({ val, onToggle, label }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${Theme.border}` }}>
      <span style={{ fontSize: 13, color: Theme.fg }}>{label}</span>
      <button
        onClick={onToggle}
        style={{
          width: 44,
          height: 24,
          borderRadius: 99,
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          background: val ? Theme.primary : Theme.border,
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{ position: 'absolute', top: 3, left: val ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  );

  const categoryEmojis: any = {
    'Skincare': '🧴',
    'Lipstick': '💄',
    'Foundation': '🌿',
    'Eyewear': '👁️',
    'Fragrance': '🌸',
  };

  const panels: any = {
    general: (
      <div>
        <FormSection title="Store Identity">
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Store Name</label>
              <input value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} style={inp} />
            </div>
            <div>
              <label style={lbl}>Currency</label>
              <select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                <option value="BDT">BDT — Bangladeshi Taka (৳)</option>
                <option value="USD">USD — US Dollar ($)</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Tax Rate (%)</label>
              <input type="number" value={settings.taxRate} onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })} style={inp} />
            </div>
            <div>
              <label style={lbl}>Timezone</label>
              <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                <option value="Asia/Dhaka">Asia/Dhaka (GMT +6:00)</option>
                <option value="UTC">UTC (GMT +0:00)</option>
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Store Logo</label>
            <div style={{ border: `2px dashed ${Theme.border}`, borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer', background: Theme.muted }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🖼️</div>
              <div style={{ fontSize: 13, color: Theme.mutedFg }}>Click to upload logo · PNG or SVG · Max 2MB</div>
            </div>
          </div>
        </FormSection>
      </div>
    ),

    payment: (
      <div>
        <FormSection title="SSLCommerz Configuration">
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Store ID</label>
              <input value={settings.sslStoreId} onChange={(e) => setSettings({ ...settings, sslStoreId: e.target.value })} style={inp} />
            </div>
            <div>
              <label style={lbl}>Refund Policy (days)</label>
              <input type="number" value={settings.refundDays} onChange={(e) => setSettings({ ...settings, refundDays: Number(e.target.value) })} style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>Store Signature (API Secret)</label>
            <input type="password" defaultValue="*********************" style={inp} />
          </div>
        </FormSection>
        <FormSection title="Accepted Payment Methods">
          <Toggle val={settings.acceptedPayments.bkash} onToggle={() => setSettings({ ...settings, acceptedPayments: { ...settings.acceptedPayments, bkash: !settings.acceptedPayments.bkash } })} label="bKash 🔴" />
          <Toggle val={settings.acceptedPayments.nagad} onToggle={() => setSettings({ ...settings, acceptedPayments: { ...settings.acceptedPayments, nagad: !settings.acceptedPayments.nagad } })} label="Nagad 🟠" />
          <Toggle val={settings.acceptedPayments.card} onToggle={() => setSettings({ ...settings, acceptedPayments: { ...settings.acceptedPayments, card: !settings.acceptedPayments.card } })} label="Card (Visa/Mastercard) 💳" />
          <Toggle val={settings.acceptedPayments.cash} onToggle={() => setSettings({ ...settings, acceptedPayments: { ...settings.acceptedPayments, cash: !settings.acceptedPayments.cash } })} label="Cash 💵" />
        </FormSection>
      </div>
    ),

    shipping: (
      <div>
        <FormSection title="Shipping Rates">
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Default Shipping Cost (৳)</label>
              <input type="number" value={settings.defaultShipping} onChange={(e) => setSettings({ ...settings, defaultShipping: Number(e.target.value) })} style={inp} />
            </div>
            <div>
              <label style={lbl}>Free Shipping Over (৳)</label>
              <input type="number" value={settings.freeShippingOver} onChange={(e) => setSettings({ ...settings, freeShippingOver: Number(e.target.value) })} style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>Delivery Time Estimate</label>
            <input value={settings.deliveryEstimate} onChange={(e) => setSettings({ ...settings, deliveryEstimate: e.target.value })} style={inp} />
          </div>
        </FormSection>
      </div>
    ),

    inventory: (
      <div>
        <FormSection title="Stock Thresholds">
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Low Stock Alert Threshold</label>
              <input type="number" value={settings.lowStockThreshold} onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })} style={inp} />
            </div>
          </div>
        </FormSection>
        <FormSection title="Inventory Behaviour">
          <Toggle val={settings.autoReserve} onToggle={() => setSettings({ ...settings, autoReserve: !settings.autoReserve })} label="Auto-reserve stock on checkout" />
          <Toggle val={settings.barcodeEnabled} onToggle={() => setSettings({ ...settings, barcodeEnabled: !settings.barcodeEnabled })} label="Enable barcode scanning" />
        </FormSection>
      </div>
    ),

    notifications: (
      <div>
        <FormSection title="Email Notifications">
          <Toggle val={settings.emailOrders} onToggle={() => setSettings({ ...settings, emailOrders: !settings.emailOrders })} label="New order placed" />
          <Toggle val={settings.emailStock} onToggle={() => setSettings({ ...settings, emailStock: !settings.emailStock })} label="Low stock alert" />
          <Toggle val={settings.emailNewCustomer} onToggle={() => setSettings({ ...settings, emailNewCustomer: !settings.emailNewCustomer })} label="New customer registered" />
        </FormSection>
        <FormSection title="SMS Notifications">
          <Toggle val={settings.smsOrders} onToggle={() => setSettings({ ...settings, smsOrders: !settings.smsOrders })} label="Order confirmation SMS" />
          <Toggle val={settings.smsDelivery} onToggle={() => setSettings({ ...settings, smsDelivery: !settings.smsDelivery })} label="Delivery status SMS" />
        </FormSection>
      </div>
    ),

    staff: (
      <div>
        {editingStaff !== null && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 9999,
              display: 'flex',
              alignItems: isMobile ? 'flex-end' : 'center',
              justifyContent: 'center',
              padding: isMobile ? 0 : '16px',
            }}
            onClick={() => setEditingStaff(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: isMobile ? '20px 20px 0 0' : '16px',
                width: isMobile ? '100%' : '500px',
                maxWidth: '100%',
                boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
                overflow: 'hidden',
                maxHeight: isMobile ? '92vh' : '90vh',
                overflowY: 'auto',
              }}
            >
              {isMobile && <div style={{ width: 40, height: 4, borderRadius: 2, background: Theme.border, margin: '12px auto 0' }} />}
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${Theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: Theme.fg }}>Edit Staff Member</div>
                  <div style={{ fontSize: 12, color: Theme.mutedFg, marginTop: 2 }}>
                    {staff.find((s) => s.id === editingStaff)?.name}
                  </div>
                </div>
                <button onClick={() => setEditingStaff(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: Theme.mutedFg, lineHeight: 1 }}>
                  ✕
                </button>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={lbl}>Role</label>
                  <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Branch</label>
                  <select value={staffForm.branch} onChange={(e) => setStaffForm({ ...staffForm, branch: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="Dhaka Main">Dhaka Main</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Sylhet Outlet">Sylhet Outlet</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Status</label>
                  <select value={staffForm.status} onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                  <Btn variant="ghost" onClick={() => setEditingStaff(null)}>
                    Cancel
                  </Btn>
                  <Btn
                    variant="primary"
                    onClick={() => {
                      setStaff((prev) =>
                        prev.map((s) =>
                          s.id === editingStaff ? { ...s, role: staffForm.role, branch: staffForm.branch, status: staffForm.status } : s
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {staff.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: `1px solid ${Theme.border}`, background: '#fff' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: Theme.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: Theme.primary, flexShrink: 0 }}>
                  {s.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: Theme.fg }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: Theme.mutedFg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.email} · {s.branch}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <Badge label={s.role} bg={s.role === 'Admin' ? '#fef9c3' : '#f5f5f5'} color={s.role === 'Admin' ? '#854d0e' : Theme.mutedFg} />
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
                          item.id === s.id ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' } : item
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
          <div style={{ fontSize: 13, color: Theme.mutedFg, marginBottom: 14 }}>
            Select products to feature in the Trending section on your storefront.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {INITIAL_PRODUCTS.map((p: any) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: `1px solid ${Theme.border}`, background: '#fff' }}>
                <input type="checkbox" defaultChecked={[1, 2, 3].includes(p.id)} style={{ accentColor: Theme.primary, width: 16, height: 16, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: Theme.fg }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: Theme.mutedFg }}>
                    {p.category} · ৳{p.price} · {p.sold} sold
                  </div>
                </div>
                <Badge label={p.status === 'out' ? 'Out' : p.status === 'low' ? 'Low' : 'OK'} bg={p.status === 'active' ? '#dcfce7' : p.status === 'low' ? '#fef9c3' : '#fee2e2'} color={p.status === 'active' ? '#166534' : p.status === 'low' ? '#854d0e' : '#991b1b'} />
              </div>
            ))}
          </div>
        </FormSection>
      </div>
    ),

    discounts: (
      <div>
        <FormSection title="Active Promotions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { id: 1, label: 'Eid Flash Sale', active: true, pct: 20, ends: 'Apr 15', banner: '🎉 Eid Special — 20% off sitewide!' },
              { id: 2, label: 'Skincare Week', active: false, pct: 15, ends: 'Apr 20', banner: '✨ Skincare Week — 15% off all skincare' },
            ].map((d) => (
              <div key={d.id} style={{ padding: '16px', borderRadius: 12, border: `1.5px solid ${d.active ? Theme.primary : Theme.border}`, background: d.active ? Theme.secondary : '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: Theme.fg }}>{d.label}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Badge label={`${d.pct}% OFF`} bg={Theme.primary} color="#fff" />
                    <Badge label={d.active ? 'Live' : 'Paused'} bg={d.active ? '#dcfce7' : '#f5f5f5'} color={d.active ? '#166534' : Theme.mutedFg} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: Theme.mutedFg, marginBottom: 8 }}>
                  {d.banner} · Ends {d.ends}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
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

    add_product: (
      <div>
        <FormSection title="New Product">
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Product Name *</label>
              <input placeholder="e.g. Rose Glow Serum 30ml" style={inp} />
            </div>
            <div>
              <label style={lbl}>SKU *</label>
              <input placeholder="e.g. SKU-019" style={inp} />
            </div>
            <div>
              <label style={lbl}>Category</label>
              <select style={{ ...inp, cursor: 'pointer' }}>
                <option>Skincare</option>
                <option>Lipstick</option>
                <option>Foundation</option>
                <option>Eyewear</option>
                <option>Fragrance</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Price (৳) *</label>
              <input type="number" placeholder="0" style={inp} />
            </div>
            <div>
              <label style={lbl}>Cost Price (৳)</label>
              <input type="number" placeholder="0" style={inp} />
            </div>
            <div>
              <label style={lbl}>Initial Stock</label>
              <input type="number" placeholder="0" style={inp} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Description</label>
            <textarea placeholder="Product description for storefront..." style={{ ...inp, height: 80, resize: 'vertical' } as any} />
          </div>
          <div>
            <label style={lbl}>Product Image</label>
            <div style={{ border: `2px dashed ${Theme.border}`, borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer', background: Theme.muted }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
              <div style={{ fontSize: 13, color: Theme.mutedFg }}>Click to upload · JPG or PNG · Max 5MB</div>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost">Reset</Btn>
            <Btn variant="primary">Save Product</Btn>
          </div>
        </FormSection>
      </div>
    ),

    categories: (
      <div>
        <FormSection title="Product Categories">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 13, color: Theme.mutedFg }}>
              {categories.filter((c) => c.active).length} active categories
            </div>
            <Btn
              variant="primary"
              size="sm"
              onClick={() => {
                setCatForm({ name: '', slug: '', desc: '', active: true });
                setShowAddCat(true);
              }}
            >
              ＋ New Category
            </Btn>
          </div>
          {(showAddCat || editCat !== null) && (
            <div style={{ border: `1.5px solid ${Theme.primary}`, borderRadius: 12, padding: 16, marginBottom: 16, background: Theme.secondary }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: Theme.primary, marginBottom: 12 }}>
                {editCat !== null ? 'Edit Category' : 'New Category'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>Name *</label>
                  <input
                    value={catForm.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCatForm((f) => ({ ...f, name: v, slug: v.toLowerCase().replace(/\s+/g, '-') }));
                    }}
                    placeholder="e.g. Skincare"
                    style={inp}
                  />
                </div>
                <div>
                  <label style={lbl}>Slug</label>
                  <input value={catForm.slug} onChange={(e) => setCatForm((f) => ({ ...f, slug: e.target.value }))} placeholder="skincare" style={inp} />
                </div>
                <div style={{ gridColumn: isMobile ? '1' : undefined, gridColumnEnd: isMobile ? '1' : 'span 2' }}>
                  <label style={lbl}>Description</label>
                  <input value={catForm.desc} onChange={(e) => setCatForm((f) => ({ ...f, desc: e.target.value }))} placeholder="Short description" style={inp} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={catForm.active} onChange={(e) => setCatForm((f) => ({ ...f, active: e.target.checked }))} style={{ accentColor: Theme.primary }} />
                  Active on storefront
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
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
                  onClick={() => {
                    if (editCat !== null) {
                      setCategories((cs) => cs.map((c) => (c.id === editCat ? { ...c, ...catForm } : c)));
                      setEditCat(null);
                    } else {
                      setCategories((cs) => [...cs, { ...catForm, id: Date.now(), products: 0 }]);
                      setShowAddCat(false);
                    }
                  }}
                >
                  {editCat !== null ? 'Save Changes' : 'Create Category'}
                </Btn>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {categories.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: `1px solid ${Theme.border}`, background: '#fff', flexWrap: 'wrap' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: c.active ? Theme.secondary : Theme.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {categoryEmojis[c.name] || '🏷️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: Theme.fg }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: Theme.mutedFg, fontFamily: 'monospace' }}>/{c.slug}</span>
                  </div>
                  <div style={{ fontSize: 12, color: Theme.mutedFg, marginTop: 1 }}>
                    {c.desc} · {c.products} products
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <Badge label={c.active ? 'Active' : 'Hidden'} bg={c.active ? '#dcfce7' : '#f5f5f5'} color={c.active ? '#166534' : Theme.mutedFg} />
                  <Btn
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCatForm({ name: c.name, slug: c.slug, desc: c.desc, active: c.active });
                      setEditCat(c.id);
                      setShowAddCat(false);
                    }}
                  >
                    Edit
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </FormSection>
      </div>
    ),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: Theme.fg }}>
          System Settings
        </div>
        <div style={{ fontSize: 13, color: Theme.mutedFg, marginTop: 2 }}>
          Configure store, integrations, homepage, and catalogue
        </div>
      </div>

      {/* Mobile: dropdown tab selector */}
      {isMobile && (
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value)}
          style={{
            padding: '10px 14px',
            border: `1px solid ${Theme.border}`,
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: Theme.fg,
            background: '#fff',
            cursor: 'pointer',
            outline: 'none',
            width: '100%',
          }}
        >
          {SETTINGS_ITEMS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      )}

      <Card
        style={{
          background: Theme.card,
          border: `1px solid ${Theme.border}`,
          borderRadius: 14,
          padding: isMobile ? 18 : 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: Theme.fg }}>
            {currentLabel}
          </div>
          {!['add_product', 'categories', 'trending', 'discounts'].includes(tab) && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {saved && (
                <span style={{ fontSize: 12, color: Theme.success, fontWeight: 600 }}>
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
          )}
          {['trending', 'discounts'].includes(tab) && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {saved && (
                <span style={{ fontSize: 12, color: Theme.success, fontWeight: 600 }}>
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
          <div style={{ color: Theme.mutedFg, fontSize: 13 }}>
            Select a setting from the menu.
          </div>
        )}
      </Card>
    </div>
  );
}

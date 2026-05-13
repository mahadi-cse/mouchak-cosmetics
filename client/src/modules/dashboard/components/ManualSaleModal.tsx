'use client';

import React, { useState } from 'react';
import { Theme, formatCurrency } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Btn } from './Primitives';
import { Product } from '@/modules/dashboard/data/mockData';
import { useDashboardLocale } from '../locales/DashboardLocaleContext';

interface ManualSaleModalProps {
  products: Product[];
  onClose: () => void;
  onConfirm: (product: Product, qty: number, note: string, total: number) => void;
}

export default function ManualSaleModal({ products, onClose, onConfirm }: ManualSaleModalProps) {
  const { isMobile } = useResponsive();
  const { t } = useDashboardLocale();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [qty, setQty] = useState(1);
  const [salePrice, setSalePrice] = useState(0);
  const [lastSale, setLastSale] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const basePrice = salePrice > 0 ? salePrice : (selectedProduct?.price || 0);
  const total = basePrice * qty;
  const overStock = selectedProduct && qty > selectedProduct.stock;

  const filteredProducts = products.filter((p) =>
    p.stock > 0 && (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const inp: React.CSSProperties = {
    border: `1px solid ${Theme.border}`,
    fontSize: 13,
    color: Theme.fg,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const lbl: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: Theme.fg,
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(String(product.id));
    setSearchQuery(product.name);
    setShowDropdown(false);
    setQty(1);
    setSalePrice(0);
  };

  const handleConfirm = () => {
    if (selectedProduct && qty > 0 && !overStock) {
      onConfirm(selectedProduct, qty, '', total);
      setLastSale(`✓ ${t.sold} ${qty} × ${selectedProduct.name}`);
      setSelectedProductId('');
      setSearchQuery('');
      setSalePrice(0);
      setQty(1);
      setTimeout(() => setLastSale(null), 3000);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex justify-center bg-black/50 ${isMobile ? 'items-end p-0' : 'items-center p-4'}`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-w-full flex-col overflow-hidden bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] ${isMobile ? 'w-full rounded-t-[20px] rounded-b-none' : 'w-[680px] rounded-xl'}`}
      >
        {isMobile && (
          <div
            className="mx-auto mt-2 h-1 w-10 rounded-sm"
            style={{ background: Theme.border }}
          />
        )}

        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${Theme.border}` }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: Theme.fg }}>
              {t.modal.recordSale}
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer border-0 bg-transparent p-0 text-[20px] leading-none"
            style={{ color: Theme.mutedFg }}
          >
            ✕
          </button>
        </div>

        {/* Last Sale Notification */}
        {lastSale && (
          <div
            className="border-b border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2 text-[11px] font-semibold text-[#166534]"
          >
            {lastSale}
          </div>
        )}

        {/* Form */}
        <div className="flex flex-col gap-[10px] px-4 py-3">
          {/* Product Selection with Search */}
          <div className="relative">
            <label className="mb-1 block" style={lbl}>{t.modal.product} *</label>
            <div className="relative">
              <input
                type="text"
                placeholder={t.modal.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className={`box-border w-full rounded-md py-2 ${selectedProductId ? 'pr-9 pl-3' : 'px-3'}`}
                style={{
                  ...inp,
                  background: selectedProductId ? '#f9fafb' : '#fff',
                }}
              />
              {selectedProductId && (
                <button
                  onClick={() => {
                    setSelectedProductId('');
                    setSearchQuery('');
                    setShowDropdown(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent px-2 py-1 text-base"
                  style={{ color: Theme.mutedFg }}
                >
                  ✕
                </button>
              )}
              {showDropdown && (
                <div
                  className="absolute left-0 right-0 top-full z-10 max-h-60 overflow-y-auto rounded-b-md border border-t-0 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                  style={{ borderColor: Theme.border }}
                >
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="flex w-full cursor-pointer items-center justify-between border-0 border-b px-3 py-2 text-left text-xs"
                        style={{
                          background: selectedProductId === String(p.id) ? Theme.muted : 'transparent',
                          color: Theme.fg,
                          borderBottom: `1px solid ${Theme.border}`,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: Theme.mutedFg }}>{t.modal.sku}: {p.sku}</div>
                        </div>
                        <div className="ml-2 text-[11px]" style={{ color: Theme.mutedFg }}>
                          {p.stock} {t.modal.inStock}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-center text-xs" style={{ color: Theme.mutedFg }}>
                      {t.modal.noProductsFound}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quantity & Price - Stacked Layout */}
          <div className="flex flex-col gap-[10px]">
            {/* Quantity */}
            <div>
              <label className="mb-1 block" style={lbl}>{t.modal.quantity} *</label>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={!selectedProduct}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className={`h-8 w-8 shrink-0 rounded-md border text-base ${selectedProduct ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  style={{
                    borderColor: Theme.border,
                    background: selectedProduct ? Theme.muted : '#e5e7eb',
                    opacity: selectedProduct ? 1 : 0.5,
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={selectedProduct?.stock || 1}
                  value={qty}
                  disabled={!selectedProduct}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                  className="box-border w-[60px] rounded-md px-3 py-2 text-center"
                  style={{
                    ...inp,
                    textAlign: 'center',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                    background: '#fff',
                  }}
                />
                <button
                  disabled={!selectedProduct}
                  onClick={() =>
                    selectedProduct && setQty((q) => Math.min(selectedProduct.stock, q + 1))
                  }
                  className={`h-8 w-8 shrink-0 rounded-md border text-base ${selectedProduct ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  style={{
                    borderColor: Theme.border,
                    background: selectedProduct ? Theme.muted : '#e5e7eb',
                    opacity: selectedProduct ? 1 : 0.5,
                  }}
                >
                  +
                </button>
                <span className="text-[11px]" style={{ color: Theme.mutedFg }}>
                  {selectedProduct ? `${t.modal.max}: ${selectedProduct.stock}` : ''}
                </span>
              </div>
            </div>

            {/* Sale Price */}
            <div>
              <label className="mb-1 block" style={lbl}>{t.modal.salePrice}</label>
              <input
                type="number"
                disabled={!selectedProduct}
                value={salePrice > 0 ? salePrice : ''}
                onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
                placeholder={selectedProduct ? String(selectedProduct.price) : '0'}
                className="box-border w-full rounded-md px-3 py-2"
                style={{ ...inp, background: '#fff', opacity: selectedProduct ? 1 : 0.5 }}
              />
              <div className="mt-0.5 text-[9px]" style={{ color: Theme.mutedFg }}>
                {salePrice > 0 ? `✎ ${t.modal.customPrice}` : selectedProduct ? t.modal.defaultPrice : '—'}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div
            className="mt-1 rounded-lg px-3 py-2.5"
            style={{
              background: Theme.muted,
              borderLeft: `3px solid ${selectedProduct ? Theme.primary : Theme.border}`,
              opacity: selectedProduct ? 1 : 0.5,
            }}
          >
            <div className="mb-1 flex justify-between text-[11px]" style={{ color: Theme.mutedFg }}>
              <span>{t.modal.unitPrice}</span>
              <span style={{ fontWeight: 600, color: Theme.fg }}>
                {selectedProduct ? formatCurrency(basePrice) : '—'}
              </span>
            </div>
            <div className="mb-1 flex justify-between text-[11px]" style={{ color: Theme.mutedFg }}>
              <span>{t.modal.quantity}</span>
              <span style={{ fontWeight: 600, color: Theme.fg }}>
                {selectedProduct ? qty : '—'}
              </span>
            </div>
            <div className="my-1.5 h-px" style={{ background: Theme.border }} />
            <div className="flex justify-between text-sm font-bold">
              <span>{t.modal.total}</span>
              <span style={{ color: Theme.primary }}>
                {selectedProduct ? formatCurrency(total) : '—'}
              </span>
            </div>
          </div>

          {selectedProduct && overStock && (
            <div className="rounded-md bg-[#fee2e2] px-[10px] py-1.5 text-[11px] font-semibold text-[#991b1b]">
              ⚠ {t.modal.maxWarning}: {selectedProduct.stock}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex shrink-0 justify-end gap-2 bg-[#fafafa] px-4 py-2.5"
          style={{ borderTop: `1px solid ${Theme.border}` }}
        >
          <Btn variant="ghost" onClick={onClose}>
            {t.modal.close}
          </Btn>
          <Btn
            variant="primary"
            disabled={!selectedProduct || qty < 1 || overStock}
            onClick={handleConfirm}
          >
            {t.modal.record} ({formatCurrency(total)})
          </Btn>
        </div>
      </div>
    </div>
  );
}

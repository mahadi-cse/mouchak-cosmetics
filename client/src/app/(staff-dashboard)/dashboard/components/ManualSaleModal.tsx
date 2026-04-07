'use client';

import React, { useState } from 'react';
import { Theme, formatCurrency } from '../theme';
import { useResponsive } from '../page';
import { Btn } from './Primitives';
import { Product } from '../data/mockData';

interface ManualSaleModalProps {
  products: Product[];
  onClose: () => void;
  onConfirm: (product: Product, qty: number, note: string, total: number) => void;
}

export default function ManualSaleModal({ products, onClose, onConfirm }: ManualSaleModalProps) {
  const { isMobile } = useResponsive();
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

  const inp = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${Theme.border}`,
    borderRadius: 6,
    fontSize: 13,
    color: Theme.fg,
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const lbl = {
    fontSize: 11,
    fontWeight: 600 as const,
    color: Theme.fg,
    marginBottom: 4,
    display: 'block' as const,
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
      setLastSale(`✓ Sold ${qty} × ${selectedProduct.name}`);
      setSelectedProductId('');
      setSearchQuery('');
      setSalePrice(0);
      setQty(1);
      setTimeout(() => setLastSale(null), 3000);
    }
  };

  return (
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
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: isMobile ? '20px 20px 0 0' : '12px',
          width: isMobile ? '100%' : '680px',
          maxWidth: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isMobile && (
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: Theme.border,
              margin: '8px auto 0',
            }}
          />
        )}

        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${Theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: Theme.fg }}>
              Record Sale
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: Theme.mutedFg,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Last Sale Notification */}
        {lastSale && (
          <div
            style={{
              padding: '8px 16px',
              background: '#f0fdf4',
              borderBottom: `1px solid #bbf7d0`,
              color: '#166534',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {lastSale}
          </div>
        )}

        {/* Form */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Product Selection with Search */}
          <div style={{ position: 'relative' }}>
            <label style={lbl}>Product *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search product name or SKU..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                style={{
                  ...inp,
                  paddingRight: selectedProductId ? '36px' : '12px',
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
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    fontSize: 16,
                    cursor: 'pointer',
                    color: Theme.mutedFg,
                    padding: '4px 8px',
                  }}
                >
                  ✕
                </button>
              )}
              {showDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: `1px solid ${Theme.border}`,
                    borderTop: 'none',
                    borderRadius: '0 0 6px 6px',
                    maxHeight: 240,
                    overflowY: 'auto',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: 'none',
                          background: selectedProductId === String(p.id) ? Theme.muted : 'transparent',
                          color: Theme.fg,
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: 12,
                          borderBottom: `1px solid ${Theme.border}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: Theme.mutedFg }}>SKU: {p.sku}</div>
                        </div>
                        <div style={{ fontSize: 11, color: Theme.mutedFg, marginLeft: 8 }}>
                          {p.stock} in stock
                        </div>
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: '12px', color: Theme.mutedFg, fontSize: 12, textAlign: 'center' }}>
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quantity & Price - Stacked Layout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Quantity */}
            <div>
              <label style={lbl}>Quantity *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  disabled={!selectedProduct}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: `1px solid ${Theme.border}`,
                    fontSize: 16,
                    cursor: selectedProduct ? 'pointer' : 'not-allowed',
                    background: selectedProduct ? Theme.muted : '#e5e7eb',
                    flexShrink: 0,
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
                  style={{ 
                    ...inp, 
                    width: 60, 
                    textAlign: 'center',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                  } as React.CSSProperties}
                />
                <button
                  disabled={!selectedProduct}
                  onClick={() =>
                    selectedProduct && setQty((q) => Math.min(selectedProduct.stock, q + 1))
                  }
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: `1px solid ${Theme.border}`,
                    fontSize: 16,
                    cursor: selectedProduct ? 'pointer' : 'not-allowed',
                    background: selectedProduct ? Theme.muted : '#e5e7eb',
                    flexShrink: 0,
                    opacity: selectedProduct ? 1 : 0.5,
                  }}
                >
                  +
                </button>
                <span style={{ fontSize: 11, color: Theme.mutedFg }}>
                {selectedProduct ? `Max: ${selectedProduct.stock}` : ''}
                </span>
              </div>
            </div>

            {/* Sale Price */}
            <div>
              <label style={lbl}>Sale Price (৳)</label>
              <input
                type="number"
                disabled={!selectedProduct}
                value={salePrice > 0 ? salePrice : ''}
                onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
                placeholder={selectedProduct ? String(selectedProduct.price) : '0'}
                style={{ ...inp, opacity: selectedProduct ? 1 : 0.5 }}
              />
              <div style={{ fontSize: 9, color: Theme.mutedFg, marginTop: 2 }}>
                {salePrice > 0 ? '✎ Custom' : selectedProduct ? 'Default' : '—'}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div
            style={{
              background: Theme.muted,
              borderRadius: 8,
              padding: '10px 12px',
              borderLeft: `3px solid ${selectedProduct ? Theme.primary : Theme.border}`,
              marginTop: 4,
              opacity: selectedProduct ? 1 : 0.5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: Theme.mutedFg }}>
              <span>Unit Price</span>
              <span style={{ fontWeight: 600, color: Theme.fg }}>
                {selectedProduct ? formatCurrency(basePrice) : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: Theme.mutedFg }}>
              <span>Quantity</span>
              <span style={{ fontWeight: 600, color: Theme.fg }}>
                {selectedProduct ? qty : '—'}
              </span>
            </div>
            <div style={{ height: 1, background: Theme.border, margin: '6px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: Theme.primary }}>
                {selectedProduct ? formatCurrency(total) : '—'}
              </span>
            </div>
          </div>

          {selectedProduct && overStock && (
            <div style={{ padding: '6px 10px', background: '#fee2e2', borderRadius: 6, color: '#991b1b', fontSize: 11, fontWeight: 600 }}>
              ⚠ Max: {selectedProduct.stock}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: `1px solid ${Theme.border}`,
            background: '#fafafa',
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <Btn variant="ghost" onClick={onClose}>
            Close
          </Btn>
          <Btn
            variant="primary"
            disabled={!selectedProduct || qty < 1 || overStock}
            onClick={handleConfirm}
          >
            Record ({formatCurrency(total)})
          </Btn>
        </div>
      </div>
    </div>
  );
}

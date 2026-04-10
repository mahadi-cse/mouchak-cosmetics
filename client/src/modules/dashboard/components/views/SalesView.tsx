'use client';

import React, { useState, useMemo } from 'react';
import { Theme, formatCurrency, statusStyles } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, SecHead, Btn, Badge } from '../Primitives';
import { Product, SellLog } from '@/modules/dashboard/data/mockData';

interface SalesViewProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  sellLog: SellLog[];
  setSellLog: (log: SellLog[]) => void;
}

export default function SalesView({
  products,
  setProducts,
  sellLog,
  setSellLog,
}: SalesViewProps) {
  const { isMobile } = useResponsive();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [qty, setQty] = useState(1);
  const [salePrice, setSalePrice] = useState(0);
  const [lastSale, setLastSale] = useState<string | null>(null);
  const [searchLog, setSearchLog] = useState('');

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const basePrice = salePrice > 0 ? salePrice : (selectedProduct?.price || 0);
  const total = basePrice * qty;
  const overStock = selectedProduct && qty > selectedProduct.stock;

  const filteredProducts = products.filter((p) =>
    p.stock > 0 && (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredSellLog = useMemo(() => {
    return sellLog.filter((s) =>
      s.product.toLowerCase().includes(searchLog.toLowerCase()) ||
      s.by.toLowerCase().includes(searchLog.toLowerCase())
    );
  }, [sellLog, searchLog]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(String(product.id));
    setSearchQuery(product.name);
    setShowDropdown(false);
    setQty(1);
    setSalePrice(0);
  };

  const handleConfirm = () => {
    if (selectedProduct && qty > 0 && !overStock) {
      setProducts(
        products.map((p: Product) => {
          if (p.id !== selectedProduct.id) return p;
          const ns = p.stock - qty;
          return {
            ...p,
            stock: ns,
            manualSold: p.manualSold + qty,
            sold: p.sold + qty,
            status: ns === 0 ? 'out' : ns < 15 ? 'low' : 'active',
          };
        })
      );
      
      setSellLog([
        {
          id: `MS-${String(sellLog.length + 1).padStart(3, '0')}`,
          product: selectedProduct.name,
          qty,
          amount: total,
          note: 'Manual Sale',
          date: new Date().toLocaleDateString(),
          by: 'Staff',
        },
        ...sellLog,
      ]);

      setLastSale(`✓ Sold ${qty} × ${selectedProduct.name}`);
      setSelectedProductId('');
      setSearchQuery('');
      setSalePrice(0);
      setQty(1);
      setTimeout(() => setLastSale(null), 3000);
    }
  };

  return (
    <div className={`flex flex-col ${isMobile ? 'gap-3' : 'gap-3.5'}`}>
      {/* Header */}
      <div>
        <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-black text-foreground tracking-tight`}>
          Manual Sales
        </div>
        <div className="text-sm text-muted-foreground mt-0.5">
          Record and manage manual sales transactions
        </div>
      </div>

      {/* Last Sale Notification */}
      {lastSale && (
        <div className="px-3.5 py-2.5 bg-green-50 border-l-4 border-green-500 rounded text-green-900 text-sm font-semibold flex items-center gap-2">
          <span>✓</span>
          {lastSale}
        </div>
      )}

      {/* Add Sale Form Card */}
      <Card>
        <SecHead title="Add New Sale" sub="Record a manual sales transaction" />
        
        <div className="px-3.5 py-3.5 flex flex-col gap-3">
          {/* Product Selection with Search */}
          <div className="relative">
            <label className="block text-xs font-semibold mb-1" style={{ color: Theme.fg }}>Product *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search product name or SKU..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full px-3 py-2 border rounded text-xs outline-none"
                style={{
                  borderColor: Theme.border,
                  color: Theme.fg,
                  background: selectedProductId ? '#f9fafb' : '#fff',
                  paddingRight: selectedProductId ? '36px' : '12px',
                }}
              />
              {selectedProductId && (
                <button
                  onClick={() => {
                    setSelectedProductId('');
                    setSearchQuery('');
                    setShowDropdown(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-base cursor-pointer p-1"
                  style={{ color: Theme.mutedFg }}
                >
                  ✕
                </button>
              )}
              {showDropdown && (
                <div
                  className="absolute top-full left-0 right-0 bg-white border rounded-b-md max-h-60 overflow-y-auto z-10"
                  style={{
                    borderColor: Theme.border,
                    borderTop: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="w-full px-3 py-2 border-b text-left cursor-pointer text-xs flex justify-between items-center font-medium"
                        style={{
                          background: selectedProductId === String(p.id) ? Theme.muted : 'transparent',
                          color: Theme.fg,
                          borderColor: Theme.border,
                        }}
                      >
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs" style={{ color: Theme.mutedFg }}>SKU: {p.sku}</div>
                        </div>
                        <div className="text-xs ml-2" style={{ color: Theme.mutedFg }}>
                          {p.stock} in stock
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-center text-xs" style={{ color: Theme.mutedFg }}>
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quantity & Price Grid */}
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: Theme.fg }}>Quantity *</label>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={!selectedProduct}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded flex-shrink-0 text-base font-semibold"
                  style={{
                    border: `1px solid ${Theme.border}`,
                    cursor: selectedProduct ? 'pointer' : 'not-allowed',
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
                  className="w-full px-3 py-2 border rounded text-center text-xs outline-none"
                  style={{ 
                    borderColor: Theme.border,
                    color: Theme.fg,
                    background: '#fff',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                  } as React.CSSProperties}
                />
                <button
                  disabled={!selectedProduct}
                  onClick={() =>
                    selectedProduct && setQty((q) => Math.min(selectedProduct.stock, q + 1))
                  }
                  className="w-8 h-8 rounded flex-shrink-0 text-base font-semibold"
                  style={{
                    border: `1px solid ${Theme.border}`,
                    cursor: selectedProduct ? 'pointer' : 'not-allowed',
                    background: selectedProduct ? Theme.muted : '#e5e7eb',
                    opacity: selectedProduct ? 1 : 0.5,
                  }}
                >
                  +
                </button>
              </div>
              {selectedProduct && (
                <div className="mt-1 text-xs" style={{ color: Theme.mutedFg }}>
                  Max: {selectedProduct.stock}
                </div>
              )}
            </div>

            {/* Sale Price */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: Theme.fg }}>Sale Price (৳)</label>
              <input
                type="number"
                disabled={!selectedProduct}
                value={salePrice > 0 ? salePrice : ''}
                onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
                placeholder={selectedProduct ? String(selectedProduct.price) : '0'}
                className="w-full px-3 py-2 border rounded text-xs outline-none"
                style={{ 
                  borderColor: Theme.border,
                  color: Theme.fg,
                  background: '#fff',
                  opacity: selectedProduct ? 1 : 0.5 
                }}
              />
              <div className="mt-1 text-xs" style={{ color: Theme.mutedFg }}>
                {salePrice > 0 ? '✎ Custom' : selectedProduct ? 'Default' : '—'}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div
            className="rounded-lg px-3.5 py-3 border-l-4"
            style={{
              background: Theme.muted,
              borderColor: selectedProduct ? Theme.primary : Theme.border,
              opacity: selectedProduct ? 1 : 0.5,
            }}
          >
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <div className="text-xs mb-0.5" style={{ color: Theme.mutedFg }}>Unit Price</div>
                <div className="text-sm font-bold" style={{ color: Theme.fg }}>
                  {selectedProduct ? formatCurrency(basePrice) : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs mb-0.5" style={{ color: Theme.mutedFg }}>Quantity</div>
                <div className="text-sm font-bold" style={{ color: Theme.fg }}>
                  {selectedProduct ? qty : '—'}
                </div>
              </div>
            </div>
            <div className="h-px my-2" style={{ background: Theme.border }} />
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold" style={{ color: Theme.mutedFg }}>TOTAL</span>
              <span className="text-lg font-black" style={{ color: Theme.primary }}>
                {selectedProduct ? formatCurrency(total) : '—'}
              </span>
            </div>
          </div>

          {selectedProduct && overStock && (
            <div className="px-3 py-2 bg-red-100 rounded text-red-900 text-xs font-semibold flex items-center gap-1.5">
              <span>⚠</span>
              Insufficient stock. Maximum: {selectedProduct.stock}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end mt-1">
            <Btn
              variant="ghost"
              onClick={() => {
                setSelectedProductId('');
                setSearchQuery('');
                setSalePrice(0);
                setQty(1);
              }}
            >
              Reset
            </Btn>
            <Btn
              variant="primary"
              disabled={!selectedProduct || qty < 1 || overStock}
              onClick={handleConfirm}
            >
              Record Sale ({formatCurrency(total)})
            </Btn>
          </div>
        </div>
      </Card>

      {/* Sales History */}
      <Card>
        <SecHead 
          title="Sales History" 
          sub={`Total sales: ${sellLog.length}`}
        />
        
        <div className="p-3.5">
          {/* Search Box */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search by product or staff..."
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              className="w-full px-3 py-2 border rounded text-xs outline-none"
              style={{
                borderColor: Theme.border,
                color: Theme.fg,
                background: '#fff',
              }}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b-2" style={{ borderColor: Theme.border }}>
                  <th className="px-2 py-2 font-bold text-left" style={{ color: Theme.mutedFg }}>Sale ID</th>
                  <th className="px-2 py-2 font-bold text-left" style={{ color: Theme.mutedFg }}>Product</th>
                  <th className="px-2 py-2 font-bold text-center" style={{ color: Theme.mutedFg }}>Qty</th>
                  <th className="px-2 py-2 font-bold text-right" style={{ color: Theme.mutedFg }}>Amount</th>
                  <th className="px-2 py-2 font-bold text-left" style={{ color: Theme.mutedFg }}>Date</th>
                  <th className="px-2 py-2 font-bold text-left" style={{ color: Theme.mutedFg }}>By</th>
                </tr>
              </thead>
              <tbody>
                {filteredSellLog.length > 0 ? (
                  filteredSellLog.map((sale) => (
                    <tr 
                      key={sale.id}
                      className="border-b"
                      style={{ borderColor: Theme.border }}
                    >
                      <td className="px-2 py-2.5 font-semibold" style={{ color: Theme.primary }}>
                        {sale.id}
                      </td>
                      <td className="px-2 py-2.5" style={{ color: Theme.fg }}>
                        {sale.product}
                      </td>
                      <td className="px-2 py-2.5 text-center font-semibold" style={{ color: Theme.fg }}>
                        {sale.qty}
                      </td>
                      <td className="px-2 py-2.5 text-right font-bold" style={{ color: Theme.primary }}>
                        {formatCurrency(sale.amount)}
                      </td>
                      <td className="px-2 py-2.5 text-xs" style={{ color: Theme.mutedFg }}>
                        {sale.date}
                      </td>
                      <td className="px-2 py-2.5" style={{ color: Theme.mutedFg }}>
                        {sale.by}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-2 py-6 text-center text-xs" style={{ color: Theme.mutedFg }}>
                      {searchLog ? 'No sales found matching your search' : 'No sales recorded yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}

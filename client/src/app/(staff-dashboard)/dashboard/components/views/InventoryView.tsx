'use client';

import React, { useState } from 'react';
import { Theme } from '../../theme';
import { Card, SecHead, Btn } from '../Primitives';
import { INITIAL_BRANCHES } from '../../data/mockData';
import { useResponsive } from '../../page';

interface InventoryViewProps {
  products: any[];
  setProducts: (products: any[]) => void;
  sellLog: any[];
  setSellLog: (log: any[]) => void;
}

interface BranchStock {
  [branchId: number]: number;
}

export default function InventoryView({
  products,
  setProducts,
  sellLog,
  setSellLog,
}: InventoryViewProps) {
  const { isMobile } = useResponsive();
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [editingProduct, setEditingProduct] = useState<{ id: number; branchId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Modal state for add/edit stock
  const [modalOpen, setModalOpen] = useState(false);
  const [formProductId, setFormProductId] = useState(products[0]?.id.toString() || '1');
  const [formBranchId, setFormBranchId] = useState('1');
  const [formStockValue, setFormStockValue] = useState('');
  const [formMode, setFormMode] = useState<'set' | 'add'>('set');

  // Mock branch stock data (in production, this would come from backend)
  const branchStockMap: Record<number, BranchStock> = {
    1: { 1: 48, 2: 12, 3: 30, 4: 0, 5: 67, 6: 24, 7: 45, 8: 19 },
    2: { 1: 20, 2: 8, 3: 25, 4: 0, 5: 40, 6: 15, 7: 22, 8: 12 },
    3: { 1: 10, 2: 5, 3: 12, 4: 0, 5: 27, 6: 8, 7: 15, 8: 8 },
  };

  const getProductBranchStock = (productId: number, branchId: number) => {
    return branchStockMap[productId]?.[branchId] || 0;
  };

  const getTotalProductStock = (productId: number) => {
    return Object.values(branchStockMap[productId] || {}).reduce((sum, stock) => sum + stock, 0);
  };

  const handleEditStock = (productId: number, branchId: string) => {
    const branchNumId = parseInt(branchId);
    const currentStock = getProductBranchStock(productId, branchNumId);
    setEditingProduct({ id: productId, branchId: branchId as any });
    setEditValue(currentStock.toString());
  };

  const handleSaveStock = () => {
    if (editingProduct) {
      const branchNumId = parseInt(editingProduct.branchId);
      branchStockMap[editingProduct.id][branchNumId] = parseInt(editValue) || 0;
      setEditingProduct(null);
      setEditValue('');
    }
  };

  const handleFormSubmit = () => {
    const productId = parseInt(formProductId);
    const branchId = parseInt(formBranchId);
    const newStock = parseInt(formStockValue);

    if (!isNaN(newStock) && newStock >= 0) {
      if (formMode === 'set') {
        branchStockMap[productId][branchId] = newStock;
      } else {
        branchStockMap[productId][branchId] = (branchStockMap[productId][branchId] || 0) + newStock;
      }
      setFormStockValue('');
      setModalOpen(false);
    }
  };

  const openAddModal = () => {
    setFormProductId(products[0]?.id.toString() || '1');
    setFormBranchId('1');
    setFormStockValue('');
    setFormMode('set');
    setModalOpen(true);
  };

  const filteredProducts = products;
  const activeBranches = INITIAL_BRANCHES.filter((b) => b.active);
  const displayBranches = selectedBranch === 'all' ? activeBranches : activeBranches.filter((b) => b.id === parseInt(selectedBranch));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: Theme.fg }}>Inventory Management</div>
          <div style={{ fontSize: 13, color: Theme.mutedFg, marginTop: 2 }}>
            Track stock levels by branch, add & edit stock
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${Theme.border}`,
              borderRadius: 9,
              fontSize: 13,
              color: Theme.fg,
              background: '#fff',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All Branches</option>
            {INITIAL_BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {!b.active ? '(Inactive)' : ''}
              </option>
            ))}
          </select>
          <Btn onClick={openAddModal}>➕ Add Stock</Btn>
        </div>
      </div>

      {/* Add/Edit Stock Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div onClick={(e: any) => e.stopPropagation()}>
            <Card
              style={{
                maxWidth: 500,
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: Theme.fg }}>Add or Edit Stock</div>
                <div style={{ fontSize: 12, color: Theme.mutedFg, marginTop: 2 }}>Update inventory for a product & branch</div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: Theme.mutedFg,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 14, marginBottom: 16 }}>
              {/* Product Select */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: Theme.mutedFg, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  Select Product
                </label>
                <select
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${Theme.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    color: Theme.fg,
                    background: '#fff',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Select */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: Theme.mutedFg, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  Select Branch
                </label>
                <select
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${Theme.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    color: Theme.fg,
                    background: '#fff',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {INITIAL_BRANCHES.filter((b) => b.active).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
              {/* Mode Toggle */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: Theme.mutedFg, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  Mode
                </label>
                <div style={{ display: 'flex', gap: 4, background: Theme.muted, borderRadius: 8, padding: 3 }}>
                  {(['set', 'add'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setFormMode(mode)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 6,
                        border: 'none',
                        cursor: 'pointer',
                        background: formMode === mode ? '#fff' : 'transparent',
                        color: formMode === mode ? Theme.primary : Theme.mutedFg,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        boxShadow: formMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      }}
                    >
                      {mode === 'set' ? '🔢 Set Stock' : '➕ Add to Stock'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Input */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: Theme.mutedFg, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  {formMode === 'set' ? 'New Stock' : 'Add Quantity'}
                </label>
                <input
                  type="number"
                  value={formStockValue}
                  onChange={(e) => setFormStockValue(e.target.value)}
                  placeholder={formMode === 'set' ? 'e.g., 50' : 'e.g., 10'}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${Theme.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    color: Theme.fg,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Current Stock Display */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: Theme.mutedFg, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  Current Stock
                </label>
                <div
                  style={{
                    padding: '10px 12px',
                    border: `1px solid ${Theme.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    color: Theme.primary,
                    background: Theme.muted,
                  }}
                >
                  {getProductBranchStock(parseInt(formProductId), parseInt(formBranchId))}
                </div>
              </div>
            </div>

            <Btn
              onClick={handleFormSubmit}
              style={{ marginTop: 14, width: '100%' }}
            >
              ✓ {formMode === 'set' ? 'Set Stock' : 'Add to Stock'}
            </Btn>
          </Card>
        </div>
      </div>
      )}

      {/* Branch-wise Stock Table */}
      <Card>
        <SecHead title="📦 Stock Levels by Branch" sub={selectedBranch === 'all' ? 'All active branches' : `${INITIAL_BRANCHES.find((b) => b.id === parseInt(selectedBranch))?.name}`} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: Theme.muted }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, borderBottom: `1px solid ${Theme.border}` }}>Product</th>
                {displayBranches.map((b) => (
                  <th key={b.id} style={{ padding: '12px', textAlign: 'center', fontWeight: 600, borderBottom: `1px solid ${Theme.border}`, fontSize: 12 }}>
                    {b.name.split(' ')[0]}
                  </th>
                ))}
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, borderBottom: `1px solid ${Theme.border}` }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, borderBottom: `1px solid ${Theme.border}` }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${Theme.border}` }}>
                  <td style={{ padding: '12px', fontWeight: 500, maxWidth: 150 }}>
                    <div>{p.name}</div>
                    <div style={{ fontSize: 11, color: Theme.mutedFg, marginTop: 2 }}>{p.sku}</div>
                  </td>
                  {displayBranches.map((b) => {
                    const stock = getProductBranchStock(p.id, b.id);
                    const isEditing = editingProduct?.id === p.id && editingProduct?.branchId === b.id.toString();
                    return (
                      <td key={b.id} style={{ padding: '12px', textAlign: 'center', borderRight: `1px solid ${Theme.border}` }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              style={{
                                width: 50,
                                padding: '4px',
                                border: `1px solid ${Theme.primary}`,
                                borderRadius: 4,
                                fontSize: 12,
                              }}
                              autoFocus
                            />
                            <button
                              onClick={handleSaveStock}
                              style={{
                                padding: '4px 8px',
                                fontSize: 11,
                                background: Theme.success,
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                              }}
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditStock(p.id, b.id.toString())}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 4,
                              border: `1px solid ${Theme.border}`,
                              background: stock > 20 ? '#dcfce7' : stock > 0 ? '#fef3c7' : '#fee2e2',
                              color: stock > 20 ? '#166534' : stock > 0 ? '#92400e' : '#991b1b',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            {stock}
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: Theme.primary }}>
                    {selectedBranch === 'all' ? getTotalProductStock(p.id) : getProductBranchStock(p.id, parseInt(selectedBranch))}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        setFormProductId(p.id.toString());
                        setFormBranchId(selectedBranch === 'all' ? '1' : selectedBranch);
                        setFormMode('set');
                        setFormStockValue('');
                        setModalOpen(true);
                      }}
                      style={{
                        padding: '6px 10px',
                        fontSize: 14,
                        background: Theme.primary,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                      }}
                    >
                      ✎ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Manual Sales */}
      <Card>
        <SecHead title="📋 Recent Manual Sales" sub="Latest walk-in transactions" />
        {sellLog.slice(0, 5).map((log: any) => (
          <div
            key={log.id}
            style={{
              padding: '12px',
              borderBottom: `1px solid ${Theme.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: Theme.fg }}>{log.product}</div>
              <div style={{ fontSize: 12, color: Theme.mutedFg }}>{log.date}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>{log.qty} unit(s)</div>
              <div style={{ fontSize: 12, color: Theme.mutedFg }}>৳{log.amount}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

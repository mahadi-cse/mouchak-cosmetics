import React, { useState, useMemo } from 'react';
import { DESIGN } from './tokens';
import { money, toDateLabel, SectionContainer, EmptyState, LoadingState, ErrorState } from './shared';
import {
  useCustomerReturns,
  useCustomerDashboardOrders,
  useCreateReturnRequest,
  type ReturnReason,
} from '@/modules/customer-dashboard';

const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  DEFECTIVE:            'Defective product',
  WRONG_ITEM:           'Wrong item received',
  COLOR_MISMATCH:       'Color mismatch',
  NOT_AS_DESCRIBED:     'Not as described',
  CUSTOMER_CHANGED_MIND:'Changed my mind',
  DAMAGED_IN_TRANSIT:   'Damaged in transit',
  EXPIRED:              'Expired product',
  QUALITY_ISSUE:        'Quality issue',
  OTHER:                'Other',
};

const RETURN_STATUS_STYLE: Record<string, { background: string; color: string }> = {
  REQUESTED:         { background: '#fff7ed', color: '#c2410c' },
  APPROVED:          { background: '#f0fdf4', color: '#15803d' },
  REJECTED:          { background: '#fef2f2', color: '#b91c1c' },
  RETURNED_RECEIVED: { background: '#eff6ff', color: '#1d4ed8' },
  INSPECTED:         { background: '#fdf4ff', color: '#7e22ce' },
  REFUND_PROCESSED:  { background: '#ecfdf5', color: '#059669' },
  CLOSED:            { background: '#f3f4f6', color: '#6b7280' },
};

export default function ReturnsTab() {
  const [formOpen, setFormOpen]     = useState(false);
  const [orderId, setOrderId]       = useState<number | undefined>();
  const [itemId, setItemId]         = useState<number | undefined>();
  const [reason, setReason]         = useState<ReturnReason>('DEFECTIVE');
  const [qty, setQty]               = useState(1);
  const [notes, setNotes]           = useState('');
  const [notice, setNotice]         = useState<{ type: 'success'|'error'; msg: string } | null>(null);

  const returnsQ         = useCustomerReturns(1);
  const deliveredOrdersQ = useCustomerDashboardOrders({ page: 1, limit: 50, status: 'DELIVERED' });

  const createMutation = useCreateReturnRequest({
    onSuccess: () => {
      setFormOpen(false); setOrderId(undefined); setItemId(undefined);
      setQty(1); setNotes(''); setReason('DEFECTIVE');
      setNotice({ type: 'success', msg: 'Return request submitted successfully.' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to submit return request.';
      setNotice({ type: 'error', msg });
    },
  });

  const selectedOrderItems = useMemo(() => {
    if (!orderId) return [];
    return deliveredOrdersQ.data?.orders.find((o) => o.id === orderId)?.items || [];
  }, [orderId, deliveredOrdersQ.data]);

  const selectedItem = selectedOrderItems.find((i) => i.id === itemId);
  const deliveredOrders = deliveredOrdersQ.data?.orders || [];
  const returns = returnsQ.data?.returns || [];

  const inputCls = 'mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100';
  const inputStyle = { borderColor: DESIGN.border, color: DESIGN.fg, background: '#fff' };

  return (
    <div className="space-y-4">
      {/* Policy strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: '📦', title: 'Easy Returns',  desc: 'Return unused items in original condition within 7 days.' },
          { icon: '🔍', title: 'Inspection',    desc: 'We inspect returns within 2 business days of receipt.' },
          { icon: '💸', title: 'Quick Refunds', desc: 'Refunds processed within 3–5 business days after approval.' },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border p-4"
            style={{ borderColor: DESIGN.border, background: DESIGN.card, boxShadow: '0 2px 8px rgba(233,30,140,0.04)' }}>
            <span className="text-2xl">{c.icon}</span>
            <p className="mt-2 text-sm font-bold" style={{ color: DESIGN.fg }}>{c.title}</p>
            <p className="mt-1 text-xs"           style={{ color: DESIGN.mutedFg }}>{c.desc}</p>
          </div>
        ))}
      </div>

      <SectionContainer>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xl font-bold" style={{ color: DESIGN.fg }}>My Returns</p>
            <p className="text-sm"           style={{ color: DESIGN.mutedFg }}>Track all your return requests and refund status.</p>
          </div>
          <button onClick={() => { setFormOpen(true); setNotice(null); }}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: DESIGN.primary, boxShadow: '0 8px 20px rgba(233,30,140,0.22)' }}>
            + New Return Request
          </button>
        </div>

        {notice && (
          <div className="mt-4 rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ background: notice.type === 'success' ? '#f0fdf4' : '#fef2f2', color: notice.type === 'success' ? '#059669' : '#b91c1c' }}>
            {notice.msg}
          </div>
        )}

        {/* Return form */}
        {formOpen && (
          <div className="mt-4 rounded-2xl border p-4 space-y-4" style={{ borderColor: DESIGN.ring, background: DESIGN.softPink }}>
            <p className="text-sm font-bold" style={{ color: DESIGN.fg }}>New Return Request</p>
            <label className="block text-sm">
              <span style={{ color: DESIGN.mutedFg }}>Select Delivered Order</span>
              {deliveredOrdersQ.isLoading ? (
                <p className="mt-1 text-xs" style={{ color: DESIGN.subtleFg }}>Loading orders…</p>
              ) : deliveredOrders.length === 0 ? (
                <p className="mt-1 text-xs" style={{ color: DESIGN.subtleFg }}>No delivered orders eligible for return.</p>
              ) : (
                <select value={orderId ?? ''}
                  onChange={(e) => { setOrderId(Number(e.target.value) || undefined); setItemId(undefined); }}
                  className={inputCls} style={inputStyle}>
                  <option value="">— Choose an order —</option>
                  {deliveredOrders.map((o) => (
                    <option key={o.id} value={o.id}>{o.orderNumber} · {toDateLabel(o.createdAt)} · {money(o.total)}</option>
                  ))}
                </select>
              )}
            </label>

            {orderId && selectedOrderItems.length > 0 && (
              <label className="block text-sm">
                <span style={{ color: DESIGN.mutedFg }}>Select Item to Return</span>
                <select value={itemId ?? ''}
                  onChange={(e) => {
                    const id = Number(e.target.value) || undefined;
                    setItemId(id);
                    const item = selectedOrderItems.find((i) => i.id === id);
                    if (item) setQty(item.quantity);
                  }}
                  className={inputCls} style={inputStyle}>
                  <option value="">— Choose an item —</option>
                  {selectedOrderItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.productName} (qty: {item.quantity}) · {money(item.totalPrice)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {itemId && selectedItem && (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span style={{ color: DESIGN.mutedFg }}>Quantity to Return</span>
                    <input type="number" min={1} max={selectedItem.quantity} value={qty}
                      onChange={(e) => setQty(Math.max(1, Math.min(selectedItem.quantity, Number(e.target.value))))}
                      className={inputCls} style={inputStyle} />
                  </label>
                  <label className="text-sm">
                    <span style={{ color: DESIGN.mutedFg }}>Return Reason</span>
                    <select value={reason} onChange={(e) => setReason(e.target.value as ReturnReason)}
                      className={inputCls} style={inputStyle}>
                      {(Object.keys(RETURN_REASON_LABELS) as ReturnReason[]).map((r) => (
                        <option key={r} value={r}>{RETURN_REASON_LABELS[r]}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block text-sm">
                  <span style={{ color: DESIGN.mutedFg }}>Additional Notes (optional)</span>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                    placeholder="Describe the issue in detail…"
                    className={inputCls} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
                </label>
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#fff', border: `1px solid ${DESIGN.border}` }}>
                  <p className="font-semibold" style={{ color: DESIGN.mutedFg }}>Estimated Refund</p>
                  <p className="text-lg font-black" style={{ color: DESIGN.primary }}>
                    {money(Number(selectedItem.unitPrice) * qty)}
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button onClick={() => createMutation.mutate({ orderItemId: itemId!, reason, returnedQuantity: qty, notes: notes.trim() || undefined })}
                disabled={!itemId || createMutation.isPending}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: DESIGN.primary, boxShadow: '0 6px 16px rgba(233,30,140,0.22)' }}>
                {createMutation.isPending ? 'Submitting…' : 'Submit Return Request'}
              </button>
              <button onClick={() => { setFormOpen(false); setNotice(null); }}
                className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ borderColor: DESIGN.border, color: DESIGN.mutedFg, background: '#fff' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Returns list */}
        <div className="mt-5 space-y-3">
          {returnsQ.isLoading ? <LoadingState message="Loading your return requests…" />
            : returnsQ.isError ? <ErrorState message="Unable to load return requests." />
            : returns.length === 0 ? <EmptyState message="No return requests yet. Delivered orders are eligible for return within 7 days." />
            : returns.map((ret) => {
              const statusStyle = RETURN_STATUS_STYLE[ret.status] || { background: '#f3f4f6', color: '#6b7280' };
              const img = ret.orderItem.product.images[0];
              return (
                <div key={ret.id} className="rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ borderColor: DESIGN.border, boxShadow: '0 2px 8px rgba(233,30,140,0.04)', background: '#fff' }}>
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl" style={{ background: DESIGN.softPink }}>
                      {img ? <img src={img} alt={ret.orderItem.product.name} className="h-full w-full object-cover" />
                           : <div className="flex h-full items-center justify-center text-lg">📦</div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="truncate text-sm font-semibold" style={{ color: DESIGN.fg }}>{ret.orderItem.product.name}</p>
                          <p className="text-xs" style={{ color: DESIGN.mutedFg }}>Order {ret.orderItem.order.orderNumber} · Qty {ret.returnedQuantity}</p>
                        </div>
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.10em]" style={statusStyle}>
                          {ret.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs">
                        <span style={{ color: DESIGN.mutedFg }}>
                          <span className="font-semibold" style={{ color: DESIGN.fg }}>Reason: </span>{RETURN_REASON_LABELS[ret.reason]}
                        </span>
                        <span style={{ color: DESIGN.mutedFg }}>
                          <span className="font-semibold" style={{ color: DESIGN.fg }}>Refund: </span>
                          <span style={{ color: DESIGN.primary }}>{money(ret.refundAmount)}</span>
                        </span>
                        <span style={{ color: DESIGN.mutedFg }}>Requested on {toDateLabel(ret.createdAt)}</span>
                      </div>
                      {ret.notes && (
                        <p className="mt-1.5 rounded-lg px-3 py-1.5 text-xs" style={{ background: DESIGN.softPink, color: DESIGN.mutedFg }}>
                          {ret.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </SectionContainer>
    </div>
  );
}

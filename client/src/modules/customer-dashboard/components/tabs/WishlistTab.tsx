import React, { useState } from 'react';
import { DESIGN } from '../../tokens';
import { money, SectionContainer, EmptyState, LoadingState } from '../shared';
import { useWishlist } from '@/shared/contexts/WishlistContext';

export default function WishlistTab() {
  const [productId, setProductId] = useState('');
  const [notice, setNotice]       = useState('');

  const { items: wishlist, isLoading, addToWishlist, removeFromWishlist } = useWishlist();

  const handleAdd = async () => {
    const id = Number(productId);
    if (!Number.isInteger(id) || id <= 0) { setNotice('Enter a valid product ID (positive number).'); return; }
    setNotice('');
    try {
      await addToWishlist({ id: String(id), name: '', price: 0, slug: '' });
      setProductId('');
      setNotice('Product added to wishlist.');
    } catch (error) {
      setNotice('Unable to add product. Check product ID and try again.');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeFromWishlist(id);
      setNotice('Wishlist item removed.');
    } catch (error) {
      setNotice('Unable to remove wishlist item right now.');
    }
  };

  if (isLoading) return <LoadingState message="Loading your wishlist..." />;

  const isPositive = notice.includes('added') || notice.includes('removed');

  return (
    <SectionContainer>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xl font-bold" style={{ color: DESIGN.fg }}>Wishlist</p>
          <p className="text-sm" style={{ color: DESIGN.mutedFg }}>Keep your favorite products ready for checkout.</p>
        </div>
        <div className="flex w-full max-w-sm items-center gap-2">
          <input value={productId} onChange={(e) => setProductId(e.target.value)}
            placeholder="Product ID"
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100"
            style={{ borderColor: DESIGN.border, color: DESIGN.fg }} />
          <button onClick={handleAdd}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: DESIGN.primary, boxShadow: '0 8px 20px rgba(233,30,140,0.25)' }}>
            Add
          </button>
        </div>
      </div>

      {notice && (
        <p className="mb-3 text-sm font-semibold" style={{ color: isPositive ? DESIGN.success : '#b91c1c' }}>
          {notice}
        </p>
      )}

      {wishlist.length === 0 ? (
        <EmptyState message="No wishlist items yet. Add a product ID to save items." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {wishlist.map((item) => {
            const image = item.image;
            return (
              <div key={item.id}
                className="rounded-2xl border-[1.5px] bg-white p-4 transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: DESIGN.border, boxShadow: '0 2px 8px rgba(233,30,140,0.04)' }}>
                <div className="mb-3 h-36 overflow-hidden rounded-xl" style={{ background: DESIGN.softPink }}>
                  {image
                    ? <img src={image} alt={item.name} className="h-full w-full object-cover" />
                    : <div className="flex h-full items-center justify-center text-sm" style={{ color: DESIGN.mutedFg }}>No image</div>}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: DESIGN.primary }}>
                  {item.categoryName || 'Beauty'}
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: DESIGN.fg }}>{item.name}</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="font-bold" style={{ color: DESIGN.primary }}>{money(item.price)}</span>
                  {item.compareAtPrice && (
                    <span className="line-through" style={{ color: DESIGN.subtleFg }}>{money(item.compareAtPrice)}</span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs" style={{ color: DESIGN.mutedFg }}>Wishlisted</p>
                  <button onClick={() => handleRemove(item.id)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
                    style={{ borderColor: DESIGN.border, color: DESIGN.primary }}>
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
}

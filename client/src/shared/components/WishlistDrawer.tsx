'use client';

import { useWishlist } from '@/shared/contexts/WishlistContext';
import { X, Trash2, Heart, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function WishlistDrawer() {
  const { items, isOpen, setIsOpen, removeFromWishlist, clearWishlist } = useWishlist();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Heart size={20} className="text-[#e91e8c]" />
            My Wishlist ({items.length})
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded transition"
            aria-label="Close wishlist"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Heart size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Your wishlist is empty</p>
              <p className="text-gray-400 text-sm mt-1">Browse products and tap the heart to save them here</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 pb-4 border-b border-gray-100 last:border-0"
              >
                {/* Image */}
                <Link
                  href={`/product/${item.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingBag size={20} />
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-semibold text-gray-900 truncate block hover:text-[#e91e8c] transition"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-[#e91e8c] font-bold mt-1">৳{item.price.toLocaleString()}</p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="p-1 hover:bg-red-50 text-red-500 rounded transition self-start"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            <Link
              href="/shop"
              onClick={() => setIsOpen(false)}
              className="block w-full bg-[#e91e8c] text-white rounded-lg py-3 text-center font-semibold hover:bg-pink-700 transition"
            >
              Continue Shopping
            </Link>
            <button
              onClick={clearWishlist}
              className="w-full border border-gray-300 text-gray-600 rounded-lg py-3 font-semibold hover:bg-gray-50 transition text-sm"
            >
              Clear Wishlist
            </button>
          </div>
        )}
      </div>
    </>
  );
}

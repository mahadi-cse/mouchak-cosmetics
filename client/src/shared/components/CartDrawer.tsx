'use client';

import { useCart } from '@/shared/contexts/CartContext';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function CartDrawer() {
  const router = useRouter();
  const { items, totalPrice, isOpen, setIsOpen, removeFromCart, updateQuantity } = useCart();

  const handleCheckout = () => {
    setIsOpen(false);
    // Store cart items in sessionStorage for checkout page to access
    sessionStorage.setItem('cartItems', JSON.stringify(items));
    router.push('/cart/checkout');
  };

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
          <h2 className="text-lg font-bold text-gray-900">Shopping Cart</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded transition"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Your cart is empty</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 pb-4 border-b border-gray-100 last:border-0"
              >
                {/* Image */}
                {item.image && (
                  <div className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">৳{item.price}</p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-100 rounded transition"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-medium w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-gray-100 rounded transition"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1 hover:bg-red-50 text-red-600 rounded transition"
                  aria-label="Remove item"
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
            <div className="flex justify-between text-base font-bold">
              <span>Total:</span>
              <span className="text-[#e91e8c]">৳{totalPrice.toLocaleString()}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="block w-full bg-[#e91e8c] text-white rounded-lg py-3 text-center font-semibold hover:bg-pink-700 transition"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full border border-gray-300 text-gray-900 rounded-lg py-3 font-semibold hover:bg-gray-50 transition"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}

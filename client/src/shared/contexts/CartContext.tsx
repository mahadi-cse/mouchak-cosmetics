'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useSession } from 'next-auth/react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug: string;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

/** Return a user-specific key so carts don't bleed between accounts. */
const storageKey = (userId?: string) => (userId ? `cart:${userId}` : 'cart:guest');

function readCart(key: string): CartItem[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(key: string, items: CartItem[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch { /* storage full / private-mode — silently skip */ }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id as string | undefined;

  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Track the previously-seen userId so we can detect login/logout transitions
   * without triggering extra effects.
   */
  const prevUserIdRef = useRef<string | undefined>(undefined);

  // -----------------------------------------------------------------------
  // On mount: load the guest cart immediately (SSR-safe)
  // -----------------------------------------------------------------------
  useEffect(() => {
    const guestItems = readCart('cart:guest');
    setItems(guestItems);
  }, []);

  // -----------------------------------------------------------------------
  // On auth state change: merge guest cart into the user cart (or clear it)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (status === 'loading') return; // not resolved yet

    const prevId = prevUserIdRef.current;
    prevUserIdRef.current = userId;

    if (userId && userId !== prevId) {
      // --- User just logged in ---
      const userCart  = readCart(storageKey(userId));
      const guestCart = readCart('cart:guest');

      // Merge guest items into the user cart (accumulate quantities)
      const merged = [...userCart];
      for (const guestItem of guestCart) {
        const existing = merged.find((i) => i.id === guestItem.id);
        if (existing) {
          existing.quantity += guestItem.quantity;
        } else {
          merged.push(guestItem);
        }
      }

      // Persist merged cart, clear guest cart
      writeCart(storageKey(userId), merged);
      writeCart('cart:guest', []);
      setItems(merged);
    } else if (!userId && prevId) {
      // --- User just logged out ---
      // Persist current items as guest cart, clear state
      writeCart('cart:guest', items);
      const freshGuest = readCart('cart:guest');
      setItems(freshGuest);
    }
  }, [userId, status]); // intentionally excludes `items` to avoid loops

  // -----------------------------------------------------------------------
  // Persist every time items change
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (status === 'loading') return;
    writeCart(storageKey(userId), items);
  }, [items, userId, status]);

  // -----------------------------------------------------------------------
  // Cart operations
  // -----------------------------------------------------------------------

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) => p.id === item.id ? { ...p, quantity: p.quantity + quantity } : p);
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(id); return; }
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, quantity } : item));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

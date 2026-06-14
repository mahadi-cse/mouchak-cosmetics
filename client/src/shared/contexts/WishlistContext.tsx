'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import apiClient from '@/shared/lib/apiClient';
import { isCustomerRole } from '@/shared/constants';

const getRoleFromToken = (token?: string | null): string | null => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.role ?? null;
  } catch {
    return null;
  }
};

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  slug: string;
  categoryName?: string;
  compareAtPrice?: number | null;
}

interface WishlistContextType {
  items: WishlistItem[];
  count: number;
  isLoading: boolean;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isCustomer = session?.accessToken ? isCustomerRole(getRoleFromToken(session.accessToken)) : false;
  const isDbWishlistActive = status === 'authenticated' && isCustomer;

  // Sync wishlist from database or localStorage based on session status
  const fetchDbWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/customer-dashboard/wishlist');
      if (response.data?.success && Array.isArray(response.data?.data)) {
        const dbItems = response.data.data;
        const mapped = dbItems.map((item: any) => ({
          id: String(item.product.id),
          name: item.product.name,
          price: Number(item.product.price),
          image: item.product.images?.[0] || undefined,
          slug: item.product.slug,
          categoryName: item.product.category?.name || undefined,
          compareAtPrice: item.product.compareAtPrice ? Number(item.product.compareAtPrice) : null,
        }));
        setItems(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist from DB:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDbWishlistActive) {
      fetchDbWishlist();
    } else {
      const saved = localStorage.getItem('wishlist');
      if (saved) {
        try {
          setItems(JSON.parse(saved));
        } catch {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    }
  }, [isDbWishlistActive, fetchDbWishlist]);

  // Save wishlist to localStorage only for unauthenticated or non-customer users
  useEffect(() => {
    if (!isDbWishlistActive) {
      localStorage.setItem('wishlist', JSON.stringify(items));
    }
  }, [items, isDbWishlistActive]);

  const count = items.length;

  const addToWishlist = useCallback(
    async (item: WishlistItem) => {
      if (isDbWishlistActive) {
        try {
          await apiClient.post('/customer-dashboard/wishlist', {
            productId: Number(item.id),
          });
          await fetchDbWishlist();
        } catch (error) {
          console.error('Failed to add to DB wishlist:', error);
        }
      } else {
        setItems((prev) => {
          const exists = prev.some((p) => p.id === item.id);
          if (exists) return prev;
          return [...prev, item];
        });
      }
    },
    [isDbWishlistActive, fetchDbWishlist]
  );

  const removeFromWishlist = useCallback(
    async (id: string) => {
      if (isDbWishlistActive) {
        try {
          await apiClient.delete(`/customer-dashboard/wishlist/${id}`);
          await fetchDbWishlist();
        } catch (error) {
          console.error('Failed to remove from DB wishlist:', error);
        }
      } else {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    },
    [isDbWishlistActive, fetchDbWishlist]
  );

  const isInWishlist = useCallback(
    (id: string) => {
      return items.some((item) => item.id === id);
    },
    [items]
  );

  const clearWishlist = useCallback(async () => {
    if (isDbWishlistActive) {
      try {
        await Promise.all(
          items.map((item) => apiClient.delete(`/customer-dashboard/wishlist/${item.id}`))
        );
        await fetchDbWishlist();
      } catch (error) {
        console.error('Failed to clear DB wishlist:', error);
      }
    } else {
      setItems([]);
    }
  }, [isDbWishlistActive, items, fetchDbWishlist]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        count,
        isLoading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}

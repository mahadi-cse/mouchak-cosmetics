'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import apiClient from '@/shared/lib/apiClient';

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
  const { status } = useSession();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    if (status === 'authenticated') {
      fetchDbWishlist();
    } else if (status === 'unauthenticated') {
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
  }, [status, fetchDbWishlist]);

  // Save wishlist to localStorage only for unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      localStorage.setItem('wishlist', JSON.stringify(items));
    }
  }, [items, status]);

  const count = items.length;

  const addToWishlist = useCallback(
    async (item: WishlistItem) => {
      if (status === 'authenticated') {
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
    [status, fetchDbWishlist]
  );

  const removeFromWishlist = useCallback(
    async (id: string) => {
      if (status === 'authenticated') {
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
    [status, fetchDbWishlist]
  );

  const isInWishlist = useCallback(
    (id: string) => {
      return items.some((item) => item.id === id);
    },
    [items]
  );

  const clearWishlist = useCallback(async () => {
    if (status === 'authenticated') {
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
  }, [status, items, fetchDbWishlist]);

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

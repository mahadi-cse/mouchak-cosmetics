import apiClient from "@/shared/lib/apiClient";
import { HomepageStats } from "./queries";
import type { Category, Product } from "@/shared/types";

export type SiteSettings = {
  id: number;
  storeName: string;
  tagline: string;
  primaryColor: string;
  heroHeadline: string;
  heroYear: string;
  heroDescription: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  lastUpdated: string;
};

export type HeroSlider = {
  id: number;
  title: string | null;
  description: string | null;
  imageUrl: string;
  imageAlt: string;
  buttonText: string | null;
  buttonLink: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const homepageAPI = {
  // Site Settings
  getSettings: async (): Promise<SiteSettings> => {
    const response = await apiClient.get<SiteSettings>("/homepage/settings");
    return response.data;
  },

  updateSettings: async (data: Partial<SiteSettings>): Promise<SiteSettings> => {
    const response = await apiClient.put<{ message: string; data: SiteSettings }>("/homepage/settings", data);
    return response.data.data;
  },

  // State method
  getState: async (): Promise<any> => {
    const response = await apiClient.get<any>("/homepage/state");
    return response.data;
  },

  // Stats methods
  getStats: async (): Promise<HomepageStats> => {
    const response = await apiClient.get<HomepageStats>("/homepage/stats");
    return response.data;
  },

  updateStats: async (data: Record<string, unknown>): Promise<{ message: string; data: HomepageStats }> => {
    const response = await apiClient.put<{ message: string; data: HomepageStats }>("/homepage/stats", data);
    return response.data;
  },

  // Payment Method Options
  createPaymentMethod: async (name: string): Promise<any> => {
    const response = await apiClient.post<any>("/homepage/payment-methods", { name });
    return response.data;
  },

  updatePaymentMethod: async (id: number, data: any): Promise<any> => {
    const response = await apiClient.patch<any>(`/homepage/payment-methods/${id}`, data);
    return response.data;
  },

  deletePaymentMethod: async (id: number): Promise<any> => {
    const response = await apiClient.delete<any>(`/homepage/payment-methods/${id}`);
    return response.data;
  },

  // Slider methods
  getSliders: async (): Promise<HeroSlider[]> => {
    const response = await apiClient.get<HeroSlider[]>("/homepage/slider");
    return response.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<any>("/categories");
    return response.data.data as Category[];
  },

  getFeaturedProducts: async (limit: number = 8): Promise<Product[]> => {
    const response = await apiClient.get<any>("/products", {
      params: {
        featured: "true",
        limit: 24, // Fetch a larger pool to shuffle from
        sortBy: "top_selling",
      },
    });

    let featuredProducts = response.data.data as Product[];

    // If not enough featured products, fallback to fetch non-featured top sellers
    if (featuredProducts.length < limit) {
      const fallbackResponse = await apiClient.get<any>("/products", {
        params: { limit: 24, sortBy: "top_selling" },
      });
      const allProducts = fallbackResponse.data.data as Product[];
      const featuredIds = new Set(featuredProducts.map((p) => p.id));
      featuredProducts = [
        ...featuredProducts,
        ...allProducts.filter((p) => !featuredIds.has(p.id)),
      ];
    }

    // Shuffle the fetched pool to make the homepage dynamic
    for (let i = featuredProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [featuredProducts[i], featuredProducts[j]] = [featuredProducts[j], featuredProducts[i]];
    }

    return featuredProducts.slice(0, limit);
  },

  searchProducts: async (query: string, limit: number = 5): Promise<Product[]> => {
    if (!query) return [];
    const response = await apiClient.get<any>("/products", {
      params: {
        search: query,
        limit,
      },
    });
    return response.data.data as Product[];
  },

  getAllSliders: async (): Promise<HeroSlider[]> => {
    const response = await apiClient.get<HeroSlider[]>("/homepage/slider/all");
    return response.data;
  },

  createSlider: async (data: Partial<HeroSlider>): Promise<{ message: string; data: HeroSlider }> => {
    const response = await apiClient.post<{ message: string; data: HeroSlider }>("/homepage/slider", data);
    return response.data;
  },

  updateSlider: async (id: number, data: Partial<HeroSlider>): Promise<{ message: string; data: HeroSlider }> => {
    const response = await apiClient.put<{ message: string; data: HeroSlider }>(`/homepage/slider/${id}`, data);
    return response.data;
  },

  deleteSlider: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/homepage/slider/${id}`);
    return response.data;
  },
};

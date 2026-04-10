import { useQuery, UseQueryResult, useMutation, UseQueryOptions } from "@tanstack/react-query";
import { homepageAPI, HeroSlider, SiteSettings } from "./api";
import type { Category, Product } from "@/shared/types";

export type HomepageStats = {
  id: number;
  totalHappyCustomers: number;
  minFreeDeliveryAmount: number;
  isFreeDeliveryActive: boolean;
  deliveryTimeframe: string;
  currentOfferText: string;
  currentOfferPercentage: number;
  isOfferActive: boolean;
  lastUpdated: string;
};

export const HOMEPAGE_QUERY_KEYS = {
  all: ["homepage"] as const,
  settings: () => [...HOMEPAGE_QUERY_KEYS.all, "settings"] as const,
  stats: () => [...HOMEPAGE_QUERY_KEYS.all, "stats"] as const,
  sliders: () => [...HOMEPAGE_QUERY_KEYS.all, "sliders"] as const,
  slider: (id: number) => [...HOMEPAGE_QUERY_KEYS.sliders(), id] as const,
  categories: () => [...HOMEPAGE_QUERY_KEYS.all, "categories"] as const,
  featuredProducts: (limit: number) => [...HOMEPAGE_QUERY_KEYS.all, "featuredProducts", limit] as const,
};

export const useSiteSettings = (
  options?: UseQueryOptions<SiteSettings, Error>
): UseQueryResult<SiteSettings, Error> => {
  return useQuery<SiteSettings, Error>({
    queryKey: HOMEPAGE_QUERY_KEYS.settings(),
    queryFn: () => homepageAPI.getSettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

export const useHomepageStats = (
  options?: UseQueryOptions<HomepageStats, Error>
): UseQueryResult<HomepageStats, Error> => {
  return useQuery<HomepageStats, Error>({
    queryKey: HOMEPAGE_QUERY_KEYS.stats(),
    queryFn: () => homepageAPI.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    ...options,
  });
};

export const useSliders = (
  options?: UseQueryOptions<HeroSlider[], Error>
): UseQueryResult<HeroSlider[], Error> => {
  return useQuery({
    queryKey: HOMEPAGE_QUERY_KEYS.sliders(),
    queryFn: () => homepageAPI.getSliders(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

export const useHomepageCategories = (
  options?: UseQueryOptions<Category[], Error>
): UseQueryResult<Category[], Error> => {
  return useQuery<Category[], Error>({
    queryKey: HOMEPAGE_QUERY_KEYS.categories(),
    queryFn: () => homepageAPI.getCategories(),
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    ...options,
  });
};

export const useHomepageFeaturedProducts = (
  limit: number = 8,
  options?: UseQueryOptions<Product[], Error>
): UseQueryResult<Product[], Error> => {
  return useQuery<Product[], Error>({
    queryKey: HOMEPAGE_QUERY_KEYS.featuredProducts(limit),
    queryFn: () => homepageAPI.getFeaturedProducts(limit),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    ...options,
  });
};

export const useAllSliders = (
  options?: UseQueryOptions<HeroSlider[], Error>
): UseQueryResult<HeroSlider[], Error> => {
  return useQuery({
    queryKey: [...HOMEPAGE_QUERY_KEYS.sliders(), "all"],
    queryFn: () => homepageAPI.getAllSliders(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useCreateSlider = () => {
  return useMutation({
    mutationFn: (data: Partial<HeroSlider>) => homepageAPI.createSlider(data),
  });
};

export const useUpdateSlider = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<HeroSlider> }) =>
      homepageAPI.updateSlider(id, data),
  });
};

export const useDeleteSlider = () => {
  return useMutation({
    mutationFn: (id: number) => homepageAPI.deleteSlider(id),
  });
};

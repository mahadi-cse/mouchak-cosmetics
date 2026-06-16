import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import {
  Features,
  FeaturedProducts,
  FeaturedProducts,
  Hero,
  Newsletter,
  HomepageLocaleProvider,
  homepageAPI,
  HOMEPAGE_QUERY_KEYS,
} from "@/modules/homepage";
import { promotionsAPI, PROMOTION_KEYS } from "@/modules/promotions";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Setting staleTime to Infinity on the SSR client prevents the
        // hydrated data from being considered stale the instant it lands on
        // the client, which would trigger an immediate background refetch
        // that causes the flash-of-old-data glitch.
        staleTime: Infinity,
      },
    },
  });

  // Prefetch critical homepage data on the server.
  // Use Promise.allSettled so if any single endpoint fails, the page still renders with remaining components.
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: HOMEPAGE_QUERY_KEYS.settings(),
      queryFn: () => homepageAPI.getSettings(),
    }),
    queryClient.prefetchQuery({
      queryKey: HOMEPAGE_QUERY_KEYS.stats(),
      queryFn: () => homepageAPI.getStats(),
    }),
    queryClient.prefetchQuery({
      queryKey: HOMEPAGE_QUERY_KEYS.sliders(),
      queryFn: () => homepageAPI.getSliders(),
    }),
    queryClient.prefetchQuery({
      queryKey: HOMEPAGE_QUERY_KEYS.categories(),
      queryFn: () => homepageAPI.getCategories(),
    }),
    queryClient.prefetchQuery({
      queryKey: HOMEPAGE_QUERY_KEYS.featuredProducts(12),
      queryFn: () => homepageAPI.getFeaturedProducts(12),
    }),
    queryClient.prefetchQuery({
      queryKey: PROMOTION_KEYS.active(),
      queryFn: () => promotionsAPI.getActive(),
    }),
  ]);

  const dehydratedState = dehydrate(queryClient);

  return (
    <HomepageLocaleProvider defaultLocale="en">
      <HydrationBoundary state={dehydratedState}>
        <Hero />
        <Features />
        <FeaturedProducts />
        <Newsletter />
      </HydrationBoundary>
    </HomepageLocaleProvider>
  );


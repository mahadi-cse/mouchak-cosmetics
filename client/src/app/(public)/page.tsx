import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Features } from "@/modules/homepage/components/Features";
import { FeaturedProducts } from "@/modules/homepage/components/FeaturedProducts";
import { Hero } from "@/modules/homepage/components/Hero";
import { Newsletter } from "@/modules/homepage/components/Newsletter";
import { HomepageLocaleProvider } from "@/modules/homepage/locales/HomepageLocaleContext";
import { homepageAPI } from "@/modules/homepage/api";
import { HOMEPAGE_QUERY_KEYS } from "@/modules/homepage/queries";
import { promotionsAPI } from "@/modules/promotions/api";
import { PROMOTION_KEYS } from "@/modules/promotions/queries";

export const revalidate = 60;

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
    // stats() is a dashboard metric (total orders, revenue, etc.) — not required
    // for the public-facing homepage render. Deferring it to client-side fetch
    // reduces the server-side prefetch waterfall by 1 backend API call.
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
}

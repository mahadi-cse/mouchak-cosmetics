import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import {
  HomepageLocaleProvider,
  homepageAPI,
  HOMEPAGE_QUERY_KEYS,
} from '@/modules/homepage';
import { ProductDetailView, productAPI, PRODUCTS_QUERY_KEYS } from '@/modules/products';
import { promotionsAPI, PROMOTION_KEYS } from '@/modules/promotions';
import type { Metadata } from 'next';
import { cache } from 'react';

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

// Cache the product API request so that generateMetadata and the page component share the same request promise.
const getCachedProduct = cache(async (slug: string) => {
  return productAPI.getProductBySlug(slug);
});

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getCachedProduct(slug);
    if (!product) {
      return {
        title: 'Product Not Found | Mouchak Cosmetics',
      };
    }
    
    return {
      title: `${product.name} | Mouchak Cosmetics`,
      description: product.description 
        ? product.description.slice(0, 160) 
        : `Buy ${product.name} online at Mouchak Cosmetics. Premium quality skincare and beauty product.`,
      openGraph: {
        title: `${product.name} | Mouchak Cosmetics`,
        description: product.description ? product.description.slice(0, 160) : `Buy ${product.name} online at Mouchak Cosmetics.`,
        images: product.images?.[0] ? [{ url: product.images[0] }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} | Mouchak Cosmetics`,
        description: product.description ? product.description.slice(0, 160) : `Buy ${product.name} online at Mouchak Cosmetics.`,
        images: product.images?.[0] ? [product.images[0]] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Product | Mouchak Cosmetics',
      description: 'Premium cosmetics and beauty products.',
    };
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Match homepage SSR behavior — hydrated data stays fresh on first paint.
        staleTime: Infinity,
      },
    },
  });

  // Start all critical prefetches in parallel to eliminate the request waterfall.
  // We do not prefetch similar products and reviews on the server side, as they are
  // below-the-fold content and are fetched client-side. This keeps server-side load times minimal.
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: PRODUCTS_QUERY_KEYS.detail(slug),
      queryFn: () => getCachedProduct(slug),
    }),
    queryClient.prefetchQuery({
      queryKey: HOMEPAGE_QUERY_KEYS.settings(),
      queryFn: () => homepageAPI.getSettings(),
    }),
    queryClient.prefetchQuery({
      queryKey: HOMEPAGE_QUERY_KEYS.stats(),
      queryFn: () => homepageAPI.getStats(),
    }),
    queryClient.prefetchQuery({
      queryKey: HOMEPAGE_QUERY_KEYS.categories(),
      queryFn: () => homepageAPI.getCategories(),
    }),
    queryClient.prefetchQuery({
      queryKey: PROMOTION_KEYS.product(slug),
      queryFn: () => promotionsAPI.getForProduct(slug),
    }),
  ]);

  const dehydratedState = dehydrate(queryClient);

  return (
    <HomepageLocaleProvider defaultLocale="en">
      <HydrationBoundary state={dehydratedState}>
        <ProductDetailView />
      </HydrationBoundary>
    </HomepageLocaleProvider>
  );
}


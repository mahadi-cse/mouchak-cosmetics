import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import {
  HomepageLocaleProvider,
  homepageAPI,
  HOMEPAGE_QUERY_KEYS,
} from '@/modules/homepage';
import { ProductDetailView, productAPI, PRODUCTS_QUERY_KEYS } from '@/modules/products';
import { reviewAPI, REVIEW_KEYS } from '@/modules/reviews';
import { promotionsAPI, PROMOTION_KEYS } from '@/modules/promotions';
import type { Product } from '@/shared/types';

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

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

  await queryClient.prefetchQuery({
    queryKey: PRODUCTS_QUERY_KEYS.detail(slug),
    queryFn: () => productAPI.getProductBySlug(slug),
  });

  const product = queryClient.getQueryData<Product>(PRODUCTS_QUERY_KEYS.detail(slug));
  const categorySlug = product?.category?.slug;

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
      queryKey: HOMEPAGE_QUERY_KEYS.categories(),
      queryFn: () => homepageAPI.getCategories(),
    }),
    queryClient.prefetchQuery({
      queryKey: PROMOTION_KEYS.active(),
      queryFn: () => promotionsAPI.getActive(),
    }),
    ...(categorySlug
      ? [
          queryClient.prefetchQuery({
            queryKey: PRODUCTS_QUERY_KEYS.list({ category: categorySlug, limit: 8 }),
            queryFn: () => productAPI.listProducts({ category: categorySlug, limit: 8 }),
          }),
        ]
      : []),
    ...(product?.id
      ? [
          queryClient.prefetchQuery({
            queryKey: REVIEW_KEYS.summary(product.id),
            queryFn: () => reviewAPI.getProductReviews(product.id),
          }),
        ]
      : []),
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

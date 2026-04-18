'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useListCategories } from '@/modules/categories';
import { EmptyState, ErrorMessage, SkeletonGrid } from '@/shared/components';
import { Header, Footer } from '@/modules/homepage';
import { CategoryCard } from '@/modules/homepage/components/CategoryCard';

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  skincare: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=900&q=80',
  makeup: 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=900&q=80',
  haircare: 'https://images.unsplash.com/photo-1527799820374-87f7caad78ef?w=900&q=80',
  fragrance: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=900&q=80',
  default: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&q=80',
};

function normalizeImage(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return trimmed;
}

function getCategoryFallbackImage(slug?: string, name?: string): string {
  const key = (slug || name || '').toLowerCase();
  if (key.includes('skin')) return CATEGORY_FALLBACK_IMAGES.skincare;
  if (key.includes('make')) return CATEGORY_FALLBACK_IMAGES.makeup;
  if (key.includes('hair')) return CATEGORY_FALLBACK_IMAGES.haircare;
  if (key.includes('frag') || key.includes('perfume') || key.includes('scent')) return CATEGORY_FALLBACK_IMAGES.fragrance;
  return CATEGORY_FALLBACK_IMAGES.default;
}

export default function CategoriesPage() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useListCategories();

  const categories = (data || [])
    .filter((category) => category.isActive)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          <SkeletonGrid columns={3} count={6} />
        </main>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          <ErrorMessage
            message={(error as { message?: string })?.message || 'Failed to load categories'}
            onRetry={() => refetch()}
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          <EmptyState
            title="No Categories Found"
            description="Categories are not available right now."
            action={{ label: 'Browse All Products', onClick: () => router.push('/products') }}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 md:py-16 max-w-6xl">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase text-pink-600 tracking-[2.5px]">
              ✦ EXPLORE
            </p>
            <h1 className="m-0 text-3xl md:text-4xl font-black text-zinc-900 tracking-[-0.5px]">
              All Categories
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Choose a category to see category-wise products
            </p>
          </div>

          <Link
            href="/shop"
            className="rounded-full border-1.5 border-pink-600 px-5 py-2 text-sm font-bold text-pink-600 transition-all duration-200 hover:bg-pink-600 hover:text-white tracking-[0.5px]"
          >
            All Products →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-12">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              id={category.slug}
              label={category.name}
              description={category.description || 'Explore collection'}
              count=""
              image={normalizeImage(category.imageUrl) || getCategoryFallbackImage(category.slug, category.name)}
              fallbackImage={getCategoryFallbackImage(category.slug, category.name)}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useListCategories } from '@/modules/categories';
import { EmptyState, ErrorMessage, SkeletonCard } from '@/shared/components';

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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Categories</h1>
            <p className="mt-2 text-sm text-gray-600">Explore products by category</p>
          </div>
          <Link
            href="/products"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            All Products
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message={(error as { message?: string })?.message || 'Failed to load categories'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        title="No Categories Found"
        description="Categories are not available right now."
        action={{ label: 'Browse All Products', onClick: () => router.push('/products') }}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Categories</h1>
          <p className="mt-2 text-sm text-gray-600">Choose a category to see category-wise products</p>
        </div>

        <Link
          href="/products"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          View All Products
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50">
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-5xl font-bold text-gray-300">{category.name.charAt(0)}</span>
              )}
            </div>

            <div className="p-5">
              <h2 className="text-lg font-semibold text-gray-900 transition group-hover:text-blue-700">
                {category.name}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                {category.description || 'Browse all products available in this category.'}
              </p>

              <div className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
                View Category
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

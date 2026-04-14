'use client';

import { useListProducts } from '@/modules/products';
import { SkeletonGrid, ErrorMessage, EmptyState } from '@/shared/components';
import Link from 'next/link';
import { useState } from 'react';

export default function ShopPage() {
  const [params, setParams] = useState({ page: 1, limit: 12 });
  const { data, isLoading, isError, error, refetch } = useListProducts(params);

  if (isLoading) return <SkeletonGrid columns={4} count={12} />;

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message={(error as any)?.message || 'Failed to load products'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No Products Found"
        description="Try adjusting your search or filter criteria"
        action={{ label: 'Clear Filters', onClick: () => setParams({ page: 1, limit: 12 }) }}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shop</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {data.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-square overflow-hidden bg-gray-200">
              <img
                src={product.images?.[0] || '/placeholder.png'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.shortDescription}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-blue-600">৳{product.price}</span>
                <span className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                  View
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
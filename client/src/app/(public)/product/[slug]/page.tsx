'use client';

import { useProductBySlug } from '@/modules/products';
import { SkeletonCard, ErrorMessage, EmptyState, LoadingSpinner } from '@/shared/components';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, isError, error, refetch } = useProductBySlug(slug);

  if (isLoading) return <SkeletonCard />;

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message={(error as any)?.message || 'Failed to load product'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        title="Product Not Found"
        description="The product you're looking for doesn't exist or has been removed"
        action={{ label: 'Back to Shop', onClick: () => window.history.back() }}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <div className="aspect-square overflow-hidden bg-gray-200 rounded-lg mb-4">
            <img
              src={product.images?.[0] || '/placeholder.png'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, idx) => (
                <div key={idx} className="aspect-square bg-gray-200 rounded cursor-pointer hover:opacity-75">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {/* Price */}
          <div className="mb-4">
            {product.compareAtPrice && (
              <span className="text-lg text-gray-500 line-through mr-2">৳{product.compareAtPrice}</span>
            )}
            <span className="text-3xl font-bold text-blue-600">৳{product.price}</span>
          </div>

          {/* Rating and Reviews */}
          <div className="flex items-center mb-6 pb-6 border-b">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
            <span className="ml-2 text-gray-600">(0 reviews)</span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Add to Cart */}
          <div className="flex gap-4 mb-6">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 text-center border-0 focus:outline-none"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100"
              >
                +
              </button>
            </div>
            <button className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Add to Cart
            </button>
          </div>

          {/* Additional Info */}
          <div className="border-t pt-6">
            {product.sku && (
              <p className="text-gray-600 mb-2">
                <strong>SKU:</strong> {product.sku}
              </p>
            )}
            {product.tags && product.tags.length > 0 && (
              <p className="text-gray-600">
                <strong>Tags:</strong> {product.tags.join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
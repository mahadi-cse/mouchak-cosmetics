'use client';

import { useHomepageCategories, useHomepageFeaturedProducts } from "@/modules/homepage";
import { featuredProductsContent } from "./data";
import { ProductCard } from "./ProductCard";

export function FeaturedProducts() {
  const { data: products = [], isLoading, error } = useHomepageFeaturedProducts(8);
  const { data: categories = [] } = useHomepageCategories();

  if (isLoading) {
    return (
      <section className="py-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b-2 border-primary px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 rounded bg-primary" />
                <h2 className="text-lg font-extrabold text-zinc-900">{featuredProductsContent.title}</h2>
              </div>
            </div>
            <div className="grid gap-4 p-4 grid-cols-2 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded bg-zinc-200" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-800">Failed to load featured products. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b-2 border-primary px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 rounded bg-primary" />
              <h2 className="text-lg font-extrabold text-zinc-900">{featuredProductsContent.title}</h2>
              <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold text-primary">{featuredProductsContent.badge}</span>
            </div>
            <a href="/shop" className="text-sm font-semibold text-primary hover:underline">
              {featuredProductsContent.viewAllLink}
            </a>
          </div>

          <div className="grid gap-4 p-4 grid-cols-2 sm:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.slice(0, 4).map((cat) => (
            <a
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="rounded-lg border border-transparent p-4 text-center transition hover:border-zinc-300 hover:shadow-md hover:bg-zinc-50"
            >
              <p className="mb-1 text-xl font-black">{cat.name.charAt(0)}</p>
              <p className="text-sm font-bold text-zinc-700">{cat.name}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

import { products, rangeCategories, featuredProductsContent } from "./data";
import { ProductCard } from "./ProductCard";

export function FeaturedProducts() {
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
            <a href="#" className="text-sm font-semibold text-primary hover:underline">
              {featuredProductsContent.viewAllLink}
            </a>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {rangeCategories.map((cat) => (
            <a
              key={cat.label}
              href="#"
              className={`rounded-lg border border-transparent p-4 text-center transition hover:border-zinc-300 hover:shadow-md ${cat.bg}`}
            >
              <p className="mb-1 text-xl font-black">{cat.tag}</p>
              <p className={`text-sm font-bold ${cat.color}`}>{cat.label}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

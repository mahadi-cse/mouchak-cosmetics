import Image from "next/image";
import { ShoppingCart, Star } from "lucide-react";

import type { Product } from "./data";

export function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <article className="group overflow-hidden rounded-lg border border-zinc-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl">
      <div className="relative h-52 w-full overflow-hidden bg-zinc-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={false}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.badge && (
          <span
            className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[11px] font-bold tracking-wide text-white ${product.badgeColor ?? "bg-primary"}`}
          >
            {product.badge}
          </span>
        )}
        {discount ? (
          <span className="absolute left-2 top-8 rounded bg-orange-600 px-2 py-0.5 text-[11px] font-bold text-white">
            -{discount}%
          </span>
        ) : null}
      </div>

      <div className="space-y-2 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-zinc-900">{product.name}</h3>

        <div className="flex items-center gap-1">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-zinc-300"}
              />
            ))}
          </div>
          <span className="text-[11px] text-zinc-500">({product.reviews})</span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-primary">৳{product.price.toLocaleString()}</span>
          {product.originalPrice ? (
            <span className="text-sm text-zinc-400 line-through">৳{product.originalPrice.toLocaleString()}</span>
          ) : null}
        </div>

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark">
          <ShoppingCart size={14} />
          Add to Cart
        </button>
      </div>
    </article>
  );
}

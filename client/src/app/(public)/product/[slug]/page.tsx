'use client';

import { Suspense } from 'react';
import { ProductDetailView } from '@/modules/products';
import { Header, Footer } from '@/modules/homepage';
import { SkeletonCard } from '@/shared/components';

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex flex-col">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8">
            <SkeletonCard />
          </main>
          <Footer />
        </div>
      }
    >
      <ProductDetailView />
    </Suspense>
  );
}
'use client';

import { Suspense } from 'react';
import { ShopView } from '@/modules/products';
import { SkeletonGrid } from '@/shared/components';
import { Header, Footer } from '@/modules/homepage';

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex flex-col justify-between">
          <Header />
          <main className="flex-1 w-full bg-zinc-50 py-12 md:py-16">
            <div className="mx-auto max-w-6xl px-4">
              <SkeletonGrid columns={4} count={12} />
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <ShopView />
    </Suspense>
  );
}

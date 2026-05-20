'use client';

import { Suspense } from 'react';
import { CheckoutView } from '@/modules/cart';
import { Header } from '@/modules/homepage';
import { SkeletonCard } from '@/shared/components';
import { Footer } from '@/modules/homepage';

export default function CartCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex flex-col">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-12">
            <SkeletonCard />
          </main>
          <Footer />
        </div>
      }
    >
      <CheckoutView />
    </Suspense>
  );
}

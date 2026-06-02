'use client';

import { Suspense } from 'react';
import { ShopView } from '@/modules/products';
import { SkeletonGrid } from '@/shared/components';

export default function ShopPage() {
  return (
    <Suspense fallback={<SkeletonGrid columns={4} count={12} />}>
      <ShopView />
    </Suspense>
  );
}
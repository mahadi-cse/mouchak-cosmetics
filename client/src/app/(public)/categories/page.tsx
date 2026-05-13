'use client';

import { Suspense } from 'react';
import { CategoriesView } from '@/modules/categories';
import { SkeletonGrid } from '@/shared/components';

export default function CategoriesPage() {
  return (
    <Suspense fallback={<SkeletonGrid columns={3} count={6} />}>
      <CategoriesView />
    </Suspense>
  );
}

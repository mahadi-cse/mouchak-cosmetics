import { SkeletonProductDetail } from '@/shared/components';

export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SkeletonProductDetail />
    </div>
  );
}


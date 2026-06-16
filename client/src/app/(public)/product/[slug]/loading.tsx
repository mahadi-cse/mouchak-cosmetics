import { Header, Footer } from '@/modules/homepage';
import { SkeletonProductDetail } from '@/shared/components';

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <SkeletonProductDetail />
      </main>
      <Footer />
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import {
  DashboardShell,
  useBreakpoint,
  ResponsiveContext,
  useDashboardData,
} from '@/modules/dashboard';

function DashboardSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f7fb]">
      <aside className="hidden w-[260px] shrink-0 border-r border-zinc-200 bg-white p-4 md:block">
        <div className="mb-5 h-10 w-36 animate-pulse rounded-lg bg-zinc-100" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-zinc-100" />
          ))}
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="h-14 border-b border-zinc-200 bg-white px-5 py-3">
          <div className="h-7 w-52 animate-pulse rounded-md bg-zinc-100" />
        </header>

        <div className="space-y-4 overflow-auto p-5">
          <div className="h-9 w-56 animate-pulse rounded-md bg-zinc-100" />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-zinc-200 bg-white" />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="h-72 animate-pulse rounded-xl border border-zinc-200 bg-white" />
            <div className="h-72 animate-pulse rounded-xl border border-zinc-200 bg-white" />
          </div>

          <div className="h-52 animate-pulse rounded-xl border border-zinc-200 bg-white" />
        </div>
      </main>
    </div>
  );
}

export default function DashboardPageView() {
  const bp = useBreakpoint();
  const [mounted, setMounted] = useState(false);

  const {
    status,
    time,
    products,
    setProducts,
    sellLog,
    setSellLog,
    orders
  } = useDashboardData();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (status === 'loading' || !mounted) {
    return <DashboardSkeleton />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <ResponsiveContext.Provider value={bp}>
      <DashboardShell
        products={products}
        setProducts={setProducts}
        sellLog={sellLog}
        setSellLog={setSellLog}
        orders={orders}
        time={time}
      />
    </ResponsiveContext.Provider>
  );
}

'use client';

import { useState, useEffect, useContext, createContext } from 'react';
import DashboardLayout from './components/DashboardLayout';
import { useBreakpoint } from './hooks/useBreakpoint';
import { INITIAL_PRODUCTS, INITIAL_LOG } from './data/mockData';

const RCtx = createContext<{ isMobile: boolean; isTablet: boolean }>({ isMobile: false, isTablet: false });

export function useResponsive() {
  return useContext(RCtx);
}

export default function DashboardPage() {
  const bp = useBreakpoint();
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [sellLog, setSellLog] = useState(INITIAL_LOG);
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Prevent hydration mismatch by not rendering until client-side
  if (!mounted) {
    return null;
  }

  return (
    <RCtx.Provider value={bp}>
      <DashboardLayout
        products={products}
        setProducts={setProducts}
        sellLog={sellLog}
        setSellLog={setSellLog}
        time={time}
      />
    </RCtx.Provider>
  );
}
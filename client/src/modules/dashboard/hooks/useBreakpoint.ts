"use client"
import { useState, useEffect } from 'react';

export function useBreakpoint() {
  const [dimensions, setDimensions] = useState<{
    isMobile: boolean;
    isTablet: boolean;
    width: number;
  }>({
    isMobile: false,
    isTablet: false,
    width: 1200,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setDimensions({
        isMobile: width < 768,
        isTablet: width < 1024,
        width,
      });
    };

    // Set initial values on client
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
}

"use client"
import { createContext, useContext } from 'react';

export const ResponsiveContext = createContext<{ isMobile: boolean; isTablet: boolean }>({
  isMobile: false,
  isTablet: false,
});

export function useResponsive() {
  return useContext(ResponsiveContext);
}

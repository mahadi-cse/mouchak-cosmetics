'use client';

import React, { useEffect } from 'react';
import { useSiteSettings } from '@/modules/homepage';

function hexToRgb(hex: string) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const hexFull = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexFull);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function adjustColor(color: string, amount: number) {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const r = Math.max(0, Math.min(255, rgb.r + amount));
  const g = Math.max(0, Math.min(255, rgb.g + amount));
  const b = Math.max(0, Math.min(255, rgb.b + amount));
  
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

export default function ColorThemeProvider() {
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (settings?.primaryColor) {
      const root = document.documentElement;
      const primary = settings.primaryColor;
      
      // Calculate a darker shade for primaryDark (-30 roughly maps to a darker shade)
      const primaryDark = adjustColor(primary, -30);
      
      root.style.setProperty('--primary', primary);
      root.style.setProperty('--primary-dark', primaryDark);
      root.style.setProperty('--ring', primary);
    }
  }, [settings?.primaryColor]);

  return null;
}

'use client';

import React, { useEffect } from 'react';
import { useSiteSettings } from '@/modules/homepage';
import { adjustColor } from '@/shared/utils/theme';

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

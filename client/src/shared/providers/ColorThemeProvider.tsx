'use client';

import React, { useEffect } from 'react';
import { useSiteSettings } from '@/modules/homepage';
import { getThemeColors } from '@/shared/utils/theme';

export default function ColorThemeProvider() {
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (settings?.primaryColor) {
      const root = document.documentElement;
      const primary = settings.primaryColor;
      const colors = getThemeColors(primary);
      
      root.style.setProperty('--primary', colors.primary);
      root.style.setProperty('--primary-dark', colors.primaryDark);
      root.style.setProperty('--primary-light', colors.primaryLight);
      root.style.setProperty('--primary-pale', colors.primaryPale);
      root.style.setProperty('--ring', colors.primary);
    }
  }, [settings?.primaryColor]);

  return null;
}

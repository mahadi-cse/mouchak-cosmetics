export type SiteSettings = {
  id: number;
  storeName: string;
  tagline: string;
  primaryColor: string;
  heroHeadline: string;
  heroYear: string;
  heroDescription: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  lastUpdated: string;
};

export type HeroSlider = {
  id: number;
  title: string | null;
  description: string | null;
  imageUrl: string;
  imageAlt: string;
  buttonText: string | null;
  buttonLink: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Homepage Module - Exports

// Hooks (React Query)
export { 
  useHomepageStats, 
  useSiteSettings, 
  useHomepageCategories,
  useHomepageFeaturedProducts,
  useSliders,
  useAllSliders,
  useCreateSlider,
  useUpdateSlider,
  useDeleteSlider,
  HOMEPAGE_QUERY_KEYS
} from './queries';

// API Services
export { homepageAPI } from './api';
export type { SiteSettings, HeroSlider } from './api';

// Components
export { Header } from './components/Header';
export { Hero } from './components/Hero';
export { Features } from './components/Features';
export { FeaturedProducts } from './components/FeaturedProducts';
export { Newsletter } from './components/Newsletter';
export { Footer } from './components/Footer';
export { ProductCard } from './components/ProductCard';

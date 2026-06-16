export { productAPI } from './api';
export {
  useListProducts,
  useProductBySlug,
  useFeaturedProducts,
  PRODUCTS_QUERY_KEYS,
} from './queries';
export { useCreateProduct, useUpdateProduct, useDeleteProduct } from './mutations';

// Views
export { default as ShopView } from './components/ShopView';
export { default as ProductDetailView } from './components/ProductDetailView';
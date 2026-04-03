import { RequestHandler } from 'express';
import productService from './product.service';
import { ok, paginate } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const listProducts: RequestHandler = asyncHandler(async (req, res) => {
  const { category, search, featured, minPrice, maxPrice, page, limit } = req.query;

  const products = await productService.listProducts({
    category: category as string,
    search: search as string,
    featured: featured === 'true',
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  });

  res.json(
    paginate(
      products.products,
      products.total,
      products.page,
      products.limit
    )
  );
});

export const getProductBySlug: RequestHandler = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const product = await productService.getProductBySlug(slug);
  res.json(ok(product));
});

export const createProduct: RequestHandler = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json(ok(product, 'Product created successfully'));
});

export const updateProduct: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productService.updateProduct(id, req.body);
  res.json(ok(product, 'Product updated successfully'));
});

export const deleteProduct: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await productService.deleteProduct(id);
  res.json(ok(null, 'Product deleted successfully'));
});

export default {
  listProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};

import { RequestHandler } from 'express';
import categoryService from './category.service';
import { ok } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const listCategories: RequestHandler = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories();
  res.json(ok(categories));
});

export const getCategoryBySlug: RequestHandler = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const category = await categoryService.getCategoryBySlug(slug);
  res.json(ok(category));
});

export const createCategory: RequestHandler = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json(ok(category, 'Category created successfully'));
});

export const updateCategory: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await categoryService.updateCategory(id, req.body);
  res.json(ok(category, 'Category updated successfully'));
});

export const deleteCategory: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await categoryService.deleteCategory(id);
  res.json(ok(null, 'Category deleted successfully'));
});

export default {
  listCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};

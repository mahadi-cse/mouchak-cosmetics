import { RequestHandler } from 'express';
import categoryService from './category.service';
import { ok } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AuditLogger } from '../../shared/utils/auditLogger';
import { prisma } from '../../config/database';

export const listCategories: RequestHandler = asyncHandler(async (req, res) => {
  const { branchId, includeInactive } = req.query;
  const categories = await categoryService.listCategories({
    branchId: branchId ? Number(branchId) : undefined,
    includeInactive: includeInactive === 'true',
  });
  res.json(ok(categories));
});

export const getCategoryBySlug: RequestHandler = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const category = await categoryService.getCategoryBySlug(slug);
  res.json(ok(category));
});

export const createCategory: RequestHandler = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);

  await AuditLogger.log({
    req,
    action: 'CREATE',
    entity: 'Category',
    entityId: String(category.id),
    entityLabel: category.name,
    before: null,
    after: category,
  });

  res.status(201).json(ok(category, 'Category created successfully'));
});

export const updateCategory: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const oldCategory = await prisma.category.findUnique({
    where: { id: Number(id) },
  });

  const category = await categoryService.updateCategory(id, req.body);

  if (oldCategory) {
    await AuditLogger.log({
      req,
      action: 'UPDATE',
      entity: 'Category',
      entityId: String(category.id),
      entityLabel: category.name,
      before: oldCategory,
      after: category,
    });
  }

  res.json(ok(category, 'Category updated successfully'));
});

export const deleteCategory: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const oldCategory = await prisma.category.findUnique({
    where: { id: Number(id) },
  });

  await categoryService.deleteCategory(id);

  if (oldCategory) {
    await AuditLogger.log({
      req,
      action: 'DELETE',
      entity: 'Category',
      entityId: String(id),
      entityLabel: oldCategory.name,
      before: oldCategory,
      after: null,
    });
  }

  res.json(ok(null, 'Category deleted successfully'));
});

export const updateCategoryStatus: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const oldCategory = await prisma.category.findUnique({
    where: { id: Number(id) },
  });

  const category = await categoryService.updateCategoryStatus(Number(id), { isActive });

  if (oldCategory) {
    await AuditLogger.log({
      req,
      action: 'UPDATE',
      entity: 'Category',
      entityId: String(category.id),
      entityLabel: category.name,
      before: oldCategory,
      after: category,
    });
  }

  res.json(ok(category, 'Category status updated successfully'));
});

export const bulkImportCategories: RequestHandler = asyncHandler(async (req, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ success: false, error: 'Categories array is required' });
  }

  const result = await categoryService.bulkImportCategories(categories);

  await AuditLogger.log({
    req,
    action: 'CREATE',
    entity: 'Category',
    entityId: 'BULK',
    entityLabel: `Bulk imported ${result.imported} categories`,
    before: null,
    after: result,
  });

  res.json(ok(result, 'Bulk import completed'));
});

export default {
  listCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
  bulkImportCategories,
};

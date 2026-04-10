import { RequestHandler } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ok } from '../../shared/utils/apiResponse';
import { ValidationError } from '../../shared/utils/AppError';
import branchService from './branch.service';
import {
  createBranchSchema,
  toggleBranchStatusSchema,
  updateBranchSchema,
} from './branch.schema';

export const listBranches: RequestHandler = asyncHandler(async (_req, res) => {
  const branches = await branchService.listBranches();
  res.json(ok(branches));
});

export const createBranch: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = createBranchSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid branch payload');
  }
  const branch = await branchService.createBranch(parsed.data);
  res.status(201).json(ok(branch, 'Branch created successfully'));
});

export const updateBranch: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = updateBranchSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid branch payload');
  }
  const branch = await branchService.updateBranch(Number(req.params.id), parsed.data);
  res.json(ok(branch, 'Branch updated successfully'));
});

export const toggleBranchStatus: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = toggleBranchStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid branch status payload');
  }
  const branch = await branchService.setBranchStatus(Number(req.params.id), parsed.data.isActive);
  res.json(ok(branch, `Branch ${parsed.data.isActive ? 'activated' : 'deactivated'} successfully`));
});

export default {
  listBranches,
  createBranch,
  updateBranch,
  toggleBranchStatus,
};

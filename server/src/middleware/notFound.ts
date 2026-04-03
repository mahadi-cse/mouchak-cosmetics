import { RequestHandler } from 'express';
import { fail } from '../shared/utils/apiResponse';

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json(
    fail(`Route not found: ${req.method} ${req.path}`, 'NOT_FOUND')
  );
};

export default notFound;

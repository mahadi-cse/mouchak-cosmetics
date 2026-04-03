export interface PaginationParams {
  skip: number;
  take: number;
}

export interface PaginationQuery {
  page?: number | string;
  limit?: number | string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const parsePagination = (query: PaginationQuery): PaginationParams => {
  let page = DEFAULT_PAGE;
  let limit = DEFAULT_LIMIT;

  if (query.page) {
    const parsedPage = Number(query.page);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      page = parsedPage;
    }
  }

  if (query.limit) {
    const parsedLimit = Number(query.limit);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = Math.min(parsedLimit, MAX_LIMIT);
    }
  }

  const skip = (page - 1) * limit;

  return { skip, take: limit };
};

export const formatPaginationMeta = (
  page: number,
  limit: number,
  total: number
) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

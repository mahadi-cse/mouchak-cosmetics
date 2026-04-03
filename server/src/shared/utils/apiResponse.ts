export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const ok = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  ...(message && { message }),
});

export const paginate = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): ApiResponse<T[]> => ({
  success: true,
  data,
  meta: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});

export const fail = (
  message: string,
  code?: string
): ApiResponse => ({
  success: false,
  message,
  ...(code && { code }),
});

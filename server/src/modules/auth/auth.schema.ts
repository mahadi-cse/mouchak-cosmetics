import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  phone: z.string().trim().max(30).optional(),
  typeId: z.number().int().positive().optional(),
});

export const googleSignInSchema = z.object({
  idToken: z.string().min(10).optional(),
  accessToken: z.string().min(10).optional(),
}).refine((value) => Boolean(value.idToken || value.accessToken), {
  message: 'Either idToken or accessToken is required',
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GoogleSignInInput = z.infer<typeof googleSignInSchema>;

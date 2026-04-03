import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url(),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Keycloak
  KEYCLOAK_REALM_URL: z.string().url(),
  KEYCLOAK_CLIENT_ID: z.string(),
  KEYCLOAK_CLIENT_SECRET: z.string(),
  
  // SSLCommerz
  SSLCOMMERZ_STORE_ID: z.string(),
  SSLCOMMERZ_STORE_PASSWD: z.string(),
  SSLCOMMERZ_IS_LIVE: z.string().transform(v => v === 'true').default('false'),
  SSLCOMMERZ_SUCCESS_URL: z.string().url(),
  SSLCOMMERZ_FAIL_URL: z.string().url(),
  SSLCOMMERZ_CANCEL_URL: z.string().url(),
  SSLCOMMERZ_IPN_URL: z.string().url(),
  
  // File uploads
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),
  
  // Misc
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  TZ: z.string().default('Asia/Dhaka'),
});

export type Environment = z.infer<typeof envSchema>;

let env: Environment | null = null;

export function loadEnv(): Environment {
  if (env) return env;
  
  try {
    env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid environment variables');
  }
}

export function getEnv(): Environment {
  if (!env) {
    loadEnv();
  }
  return env!;
}

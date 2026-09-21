import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z
  .object({
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().default('postgresql://interviewshield:devpassword@localhost:5432/interviewshield'),
    JWT_SECRET: z.string().default('dev-secret-change-in-production'),
    CLIENT_URL: z.string().default('http://localhost:5173'),
    EVIDENCE_STORAGE_PATH: z.string().default('./evidence'),
    RISK_RECOVERY_RATE: z.coerce.number().default(2),
    RISK_INITIAL_SCORE: z.coerce.number().default(100),
    EVIDENCE_RETENTION_DAYS: z.coerce.number().default(90),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production' && data.JWT_SECRET === 'dev-secret-change-in-production') {
        return false;
      }
      return true;
    },
    {
      message: 'JWT_SECRET must be explicitly set and cannot use the development default in production',
      path: ['JWT_SECRET'],
    }
  )
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production' && data.DATABASE_URL.includes('interviewshield:devpassword@localhost')) {
        return false;
      }
      return true;
    },
    {
      message: 'DATABASE_URL must be configured for production database and cannot use localhost default',
      path: ['DATABASE_URL'],
    }
  )
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production' && data.CLIENT_URL.includes('localhost')) {
        return false;
      }
      return true;
    },
    {
      message: 'CLIENT_URL must be configured for production domain and cannot use localhost default',
      path: ['CLIENT_URL'],
    }
  );

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;

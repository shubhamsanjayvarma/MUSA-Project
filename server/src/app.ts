import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pino from 'pino';
import { healthRouter } from './api/routes/health.routes.js';
import { authRouter } from './api/routes/auth.routes.js';
import { interviewRouter } from './api/routes/interview.routes.js';
import { sessionRouter } from './api/routes/session.routes.js';
import { evidenceRouter } from './api/routes/evidence.routes.js';
import { config } from './config.js';

export const logger = pino({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    config.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: { colorize: true },
        }
      : undefined,
});

export const app = express();

// Middleware
const allowedOrigins = new Set([
  config.CLIENT_URL,
  'https://interviewshieldmusa.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server, unit tests)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      logger.warn({ origin }, 'Blocked request by CORS policy');
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/interviews', interviewRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/evidence', evidenceRouter);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  });
});

// Centralized error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    success: false,
    data: null,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
});

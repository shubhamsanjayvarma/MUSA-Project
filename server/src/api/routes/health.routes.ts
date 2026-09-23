import { Router, Request, Response } from 'express';
import { prisma } from '../../db/client.js';
import { config } from '../../config.js';
import fs from 'fs';

export const healthRouter = Router();

// Baseline health check
healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'InterviewShield Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
    error: null,
  });
});

// Tier 1: Liveness probe (process responsiveness)
healthRouter.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

// Tier 2: Readiness probe (database connection check)
healthRouter.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Tier 3: Startup probe (database + evidence storage verification)
healthRouter.get('/startup', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    // Ensure evidence storage directory is accessible
    await fs.promises.mkdir(config.EVIDENCE_STORAGE_PATH, { recursive: true });
    res.status(200).json({
      status: 'started',
      database: 'ready',
      storage: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'startup_failed',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

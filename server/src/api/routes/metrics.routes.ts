import { Router, Request, Response } from 'express';
import { metricsRegistry } from '../../telemetry/metrics.js';

export const metricsRouter = Router();

/**
 * GET /api/metrics
 * Exposes Prometheus metrics in standard plain text format.
 */
metricsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', metricsRegistry.contentType);
    const metrics = await metricsRegistry.metrics();
    res.status(200).send(metrics);
  } catch (error) {
    res.status(500).send((error as Error).message);
  }
});

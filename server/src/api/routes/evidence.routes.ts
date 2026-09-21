import { Router, Response, NextFunction } from 'express';
import { sessionService } from '../../services/session.service.js';
import { requireSessionOrRecruiterAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const evidenceRouter = Router();

evidenceRouter.get(
  '/:id/file',
  requireSessionOrRecruiterAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await sessionService.getEvidenceFile(req.params.id, req.user!);

      if ('code' in result) {
        res.status(result.status).json({
          success: false,
          data: null,
          error: {
            code: result.code,
            message: result.message,
          },
        });
        return;
      }

      res.setHeader('Content-Type', result.mimeType);
      res.sendFile(result.filePath);
    } catch (error) {
      next(error);
    }
  }
);

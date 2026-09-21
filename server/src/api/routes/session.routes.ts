import { Router, Response, NextFunction } from 'express';
import { sessionService } from '../../services/session.service.js';
import { requireSessionOrRecruiterAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const sessionRouter = Router();

sessionRouter.get(
  '/:id',
  requireSessionOrRecruiterAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await sessionService.getSessionById(req.params.id, req.user!);

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

      res.status(result.status).json({
        success: true,
        data: result.data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
);

sessionRouter.patch(
  '/:id',
  requireSessionOrRecruiterAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await sessionService.updateSession(
        req.params.id,
        req.body,
        req.user!
      );

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

      res.status(result.status).json({
        success: true,
        data: result.data,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
);

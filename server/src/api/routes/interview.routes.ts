import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { interviewService } from '../../services/interview.service.js';
import { requireRecruiterAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';

export const interviewRouter = Router();

const createInterviewSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  candidateName: z.string().min(1, 'Candidate name is required').max(255, 'Candidate name too long'),
  candidateEmail: z.string().email('Invalid candidate email'),
  scheduledAt: z.string().datetime({ offset: true }).optional().or(z.string().datetime().optional()),
});

const listInterviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(['pending', 'active', 'completed', 'cancelled']).optional(),
});

const joinInterviewSchema = z.object({
  joinToken: z.string().min(1, 'Join token is required'),
});

// Candidate join endpoint (public, token-based)
interviewRouter.post(
  '/join',
  validateBody(joinInterviewSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { joinToken } = req.body;
      const result = await interviewService.joinInterview(joinToken);

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

// Protected recruiter interview endpoints
interviewRouter.post(
  '/',
  requireRecruiterAuth,
  validateBody(createInterviewSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await interviewService.createInterview(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
);

interviewRouter.get(
  '/',
  requireRecruiterAuth,
  validateQuery(listInterviewsQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, pageSize, status } = req.query as unknown as {
        page: number;
        pageSize: number;
        status?: string;
      };

      const result = await interviewService.listInterviews(req.user!.id, {
        page,
        pageSize,
        status,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        error: null,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }
);

interviewRouter.get(
  '/:id',
  requireRecruiterAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const interview = await interviewService.getInterviewById(req.user!.id, req.params.id);

      if (!interview) {
        res.status(404).json({
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Interview not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: interview,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
);

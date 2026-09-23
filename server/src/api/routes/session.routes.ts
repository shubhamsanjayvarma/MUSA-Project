import { Router, Response, NextFunction } from 'express';
import { sessionService } from '../../services/session.service.js';
import { reportService } from '../../services/report.service.js';
import {
  requireSessionOrRecruiterAuth,
  requireRecruiterAuth,
  AuthenticatedRequest,
} from '../middleware/auth.js';

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

sessionRouter.get(
  '/:id/events',
  requireSessionOrRecruiterAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await sessionService.getEvents(req.params.id, req.user!, req.query);

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
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }
);

sessionRouter.get(
  '/:id/timeline',
  requireSessionOrRecruiterAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await sessionService.getTimeline(req.params.id, req.user!);

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

sessionRouter.get(
  '/:id/risk',
  requireSessionOrRecruiterAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await sessionService.getRisk(req.params.id, req.user!);

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

sessionRouter.get(
  '/:id/risk/history',
  requireSessionOrRecruiterAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await sessionService.getRiskHistory(req.params.id, req.user!);

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

sessionRouter.get(
  '/:id/evidence',
  requireSessionOrRecruiterAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await sessionService.getEvidenceItems(req.params.id, req.user!);

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

sessionRouter.post(
  '/:id/review',
  requireRecruiterAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await sessionService.submitReview(req.params.id, req.body, req.user!);

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

sessionRouter.get(
  '/:id/review',
  requireRecruiterAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await sessionService.getReview(req.params.id, req.user!);

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

sessionRouter.get(
  '/:id/report',
  requireSessionOrRecruiterAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reportData = await reportService.getReportData(req.params.id, req.user!);
      if (!reportData) {
        res.status(404).json({
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Session not found or access denied',
          },
        });
        return;
      }

      const format = req.query.format as string;
      const acceptHeader = req.headers.accept || '';

      if (format === 'pdf' || acceptHeader.includes('application/pdf')) {
        const pdfBuffer = await reportService.generatePdf(reportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="interviewshield-report-${req.params.id}.pdf"`
        );
        res.status(200).send(pdfBuffer);
        return;
      }

      res.status(200).json({
        success: true,
        data: reportData,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
);

sessionRouter.post(
  '/:id/shred',
  requireRecruiterAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await sessionService.cryptoShredSession(req.params.id, req.user!);
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


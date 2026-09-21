import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../../services/auth.service.js';
import { validateBody } from '../middleware/validate.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

authRouter.post(
  '/login',
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      if (!result) {
        res.status(401).json({
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: { message: 'Logged out' },
    error: null,
  });
});

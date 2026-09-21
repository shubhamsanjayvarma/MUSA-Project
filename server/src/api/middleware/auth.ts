import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config.js';

export interface AuthUser {
  id: string;
  email?: string;
  role: 'recruiter' | 'candidate';
  interviewId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const requireRecruiterAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization token',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as {
      sub: string;
      email?: string;
      role?: string;
    };

    if (payload.role !== 'recruiter') {
      res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Access restricted to recruiters',
        },
      });
      return;
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: 'recruiter',
    };

    next();
  } catch (_err) {
    res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
};

export const requireSessionOrRecruiterAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization token',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as {
      sub: string;
      email?: string;
      role?: string;
      interviewId?: string;
    };

    if (payload.role === 'recruiter') {
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: 'recruiter',
      };
    } else if (payload.role === 'candidate') {
      req.user = {
        id: payload.sub, // session ID
        role: 'candidate',
        interviewId: payload.interviewId,
      };
    } else {
      res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Unrecognized user role',
        },
      });
      return;
    }

    next();
  } catch (_err) {
    res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
};

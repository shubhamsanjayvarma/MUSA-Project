import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/client.js';
import { config } from '../config.js';

export interface LoginResult {
  token: string;
  recruiter: {
    id: string;
    email: string;
    name: string;
  };
}

export class AuthService {
  async login(email: string, password: string): Promise<LoginResult | null> {
    const recruiter = await prisma.recruiter.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!recruiter) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, recruiter.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    const token = jwt.sign(
      {
        sub: recruiter.id,
        email: recruiter.email,
        role: 'recruiter',
      },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      recruiter: {
        id: recruiter.id,
        email: recruiter.email,
        name: recruiter.name,
      },
    };
  }
}

export const authService = new AuthService();

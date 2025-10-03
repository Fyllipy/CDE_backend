import { NextFunction, Request, Response } from 'express';
import { verifyJwt } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  const [, token] = header.split(' ');
  if (!token) {
    return res.status(401).json({ message: 'Invalid authorization header format' });
  }

  try {
    const payload = verifyJwt(token);
    req.user = { id: payload.userId };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

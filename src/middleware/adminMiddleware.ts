import { Request, Response, NextFunction } from 'express';
import { getUserById } from '../services/userService';

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = (req as Request & { user?: { id: string } }).user;
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const user = await getUserById(auth.id);
  if (!user?.isAdmin) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}


import { NextFunction, Request, Response } from 'express';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = (error as Error & { status?: number }).status ?? 500;
  const message = status === 500 ? 'Unexpected error' : (error as Error).message;
  if (status === 500) {
    console.error(error);
  }
  res.status(status).json({ message });
}

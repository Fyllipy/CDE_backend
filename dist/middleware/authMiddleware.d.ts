import { NextFunction, Request, Response } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
    };
}
export declare function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;

import { Request, Response, NextFunction } from "express";
export declare function getAuthUser(req: Request): {
    id: string;
} | undefined;
export declare function ensureMember(projectId: string, userId: string): Promise<boolean>;
export declare function ensureProjectMember(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;

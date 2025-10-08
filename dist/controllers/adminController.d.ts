import { Request, Response } from 'express';
export declare function listAllUsers(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function listAllMemberships(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateMembershipRole(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;

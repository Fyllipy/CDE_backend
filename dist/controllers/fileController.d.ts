import { Request, Response } from "express";
export declare function listProjectFiles(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function uploadFile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function downloadRevision(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteFileHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;

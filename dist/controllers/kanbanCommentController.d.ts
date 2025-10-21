import { Request, Response } from "express";
export declare function createCommentHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getCommentsHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateCommentHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteCommentHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;

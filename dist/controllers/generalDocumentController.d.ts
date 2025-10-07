import { Request, Response } from 'express';
export declare function listGeneralDocs(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createGeneralDoc(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteGeneralDoc(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function downloadGeneralDoc(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;

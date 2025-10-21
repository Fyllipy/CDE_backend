import { Request, Response } from "express";
export declare function listCustomFieldsHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createCustomFieldHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateCustomFieldHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteCustomFieldHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function setCardCustomFieldHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;

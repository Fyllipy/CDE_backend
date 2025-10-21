import { Request, Response } from "express";
export declare function createLabelHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getLabelsHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateLabelHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteLabelHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function addLabelToCardHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function removeLabelFromCardHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;

import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { upload } from '../config/upload';
import {
  listGeneralDocs,
  createGeneralDoc,
  deleteGeneralDoc,
  downloadGeneralDoc
} from '../controllers/generalDocumentController';

export const generalDocumentRouter = Router();

generalDocumentRouter.use(requireAuth);

generalDocumentRouter.get('/:projectId/general-docs', listGeneralDocs);
generalDocumentRouter.post('/:projectId/general-docs', upload.single('file'), createGeneralDoc);
generalDocumentRouter.get('/:projectId/general-docs/:documentId/download', downloadGeneralDoc);
generalDocumentRouter.delete('/:projectId/general-docs/:documentId', deleteGeneralDoc);

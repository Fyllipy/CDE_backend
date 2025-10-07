import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { upload } from "../config/upload";
import { listProjectFiles, uploadFile, downloadRevision, deleteFileHandler, deleteRevisionHandler } from "../controllers/fileController";

export const fileRouter = Router();

fileRouter.use(requireAuth);

fileRouter.get("/:projectId/files", listProjectFiles);
fileRouter.post("/:projectId/files/upload", upload.single("file"), uploadFile);
fileRouter.get("/:projectId/files/revisions/:revisionId", downloadRevision);
fileRouter.delete("/:projectId/files/revisions/:revisionId", deleteRevisionHandler);
fileRouter.delete("/:projectId/files/:fileId", deleteFileHandler);

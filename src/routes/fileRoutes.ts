import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { upload } from "../config/upload";
import { listProjectFiles, uploadFile, downloadRevision } from "../controllers/fileController";

export const fileRouter = Router();

fileRouter.use(requireAuth);

fileRouter.get("/:projectId/files", listProjectFiles);
fileRouter.post("/:projectId/files/upload", upload.single("file"), uploadFile);
fileRouter.get("/:projectId/files/revisions/:revisionId", downloadRevision);

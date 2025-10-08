import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { upload } from "../config/upload";
import { listProjectFiles, uploadFile, downloadRevision, deleteFileHandler, deleteRevisionHandler, updateRevisionHandler } from "../controllers/fileController";

export const fileRouter = Router();

fileRouter.use(requireAuth);

fileRouter.get("/:projectId/files", listProjectFiles);
fileRouter.post(
  "/:projectId/files/upload",
  upload.fields([
    { name: "pdfFile", maxCount: 1 },
    { name: "dxfFile", maxCount: 1 },
    { name: "file", maxCount: 1 }
  ]),
  uploadFile
);
fileRouter.get("/:projectId/files/revisions/:revisionId", downloadRevision);
fileRouter.patch("/:projectId/files/revisions/:revisionId", updateRevisionHandler);
fileRouter.delete("/:projectId/files/revisions/:revisionId", deleteRevisionHandler);
fileRouter.delete("/:projectId/files/:fileId", deleteFileHandler);

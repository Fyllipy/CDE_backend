"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileRouter = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const upload_1 = require("../config/upload");
const fileController_1 = require("../controllers/fileController");
exports.fileRouter = (0, express_1.Router)();
exports.fileRouter.use(authMiddleware_1.requireAuth);
exports.fileRouter.get("/:projectId/files", fileController_1.listProjectFiles);
exports.fileRouter.post("/:projectId/files/upload", upload_1.upload.fields([
    { name: "pdfFile", maxCount: 1 },
    { name: "dxfFile", maxCount: 1 },
    { name: "file", maxCount: 1 }
]), fileController_1.uploadFile);
exports.fileRouter.get("/:projectId/files/revisions/:revisionId", fileController_1.downloadRevision);
exports.fileRouter.patch("/:projectId/files/revisions/:revisionId", fileController_1.updateRevisionHandler);
exports.fileRouter.delete("/:projectId/files/revisions/:revisionId", fileController_1.deleteRevisionHandler);
exports.fileRouter.delete("/:projectId/files/:fileId", fileController_1.deleteFileHandler);
//# sourceMappingURL=fileRoutes.js.map
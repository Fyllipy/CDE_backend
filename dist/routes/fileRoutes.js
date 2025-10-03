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
exports.fileRouter.post("/:projectId/files/upload", upload_1.upload.single("file"), fileController_1.uploadFile);
exports.fileRouter.get("/:projectId/files/revisions/:revisionId", fileController_1.downloadRevision);
//# sourceMappingURL=fileRoutes.js.map
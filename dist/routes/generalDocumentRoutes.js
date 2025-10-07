"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalDocumentRouter = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const upload_1 = require("../config/upload");
const generalDocumentController_1 = require("../controllers/generalDocumentController");
exports.generalDocumentRouter = (0, express_1.Router)();
exports.generalDocumentRouter.use(authMiddleware_1.requireAuth);
exports.generalDocumentRouter.get('/:projectId/general-docs', generalDocumentController_1.listGeneralDocs);
exports.generalDocumentRouter.post('/:projectId/general-docs', upload_1.upload.single('file'), generalDocumentController_1.createGeneralDoc);
exports.generalDocumentRouter.get('/:projectId/general-docs/:documentId/download', generalDocumentController_1.downloadGeneralDoc);
exports.generalDocumentRouter.delete('/:projectId/general-docs/:documentId', generalDocumentController_1.deleteGeneralDoc);
//# sourceMappingURL=generalDocumentRoutes.js.map
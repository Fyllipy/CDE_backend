"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProjectFiles = listProjectFiles;
exports.uploadFile = uploadFile;
exports.downloadRevision = downloadRevision;
exports.deleteFileHandler = deleteFileHandler;
const fs_1 = require("fs");
const fileService_1 = require("../services/fileService");
const projectService_1 = require("../services/projectService");
function getAuthUser(req) {
    return req.user;
}
async function listProjectFiles(req, res) {
    var _a;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId) {
        return res.status(400).json({ message: "Project id is required" });
    }
    const membership = await (0, projectService_1.getMembership)(projectId, user.id);
    if (!membership) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const files = await (0, fileService_1.listFiles)(projectId);
    return res.json({ files });
}
async function uploadFile(req, res) {
    var _a;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const file = req.file;
    const { description } = req.body;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId) {
        return res.status(400).json({ message: "Project id is required" });
    }
    if (!file) {
        return res.status(400).json({ message: "File is required" });
    }
    const membership = await (0, projectService_1.getMembership)(projectId, user.id);
    if (!membership) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const pattern = await (0, projectService_1.getNamingStandard)(projectId);
    if (!pattern) {
        return res.status(400).json({ message: "Naming standard not configured" });
    }
    const result = await (0, fileService_1.createOrUpdateFileRevision)({
        projectId,
        fileBuffer: file.buffer,
        originalFilename: file.originalname,
        uploadedBy: user.id,
        namingPattern: pattern,
        description: (description === null || description === void 0 ? void 0 : description.trim()) || undefined
    });
    return res.status(201).json(result);
}
async function downloadRevision(req, res) {
    var _a, _b;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const revisionId = (_b = req.params.revisionId) !== null && _b !== void 0 ? _b : '';
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId || !revisionId) {
        return res.status(400).json({ message: "Identifiers are required" });
    }
    const membership = await (0, projectService_1.getMembership)(projectId, user.id);
    if (!membership) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const revision = await (0, fileService_1.getRevisionById)(revisionId);
    if (!revision) {
        return res.status(404).json({ message: "Revision not found" });
    }
    const fileBuffer = await fs_1.promises.readFile(revision.storagePath);
    res.setHeader("Content-Disposition", 'attachment; filename="' + revision.originalFilename + '"');
    res.send(fileBuffer);
}
async function deleteFileHandler(req, res) {
    var _a, _b, _c;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const fileId = (_b = req.params.fileId) !== null && _b !== void 0 ? _b : '';
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId || !fileId) {
        return res.status(400).json({ message: "Identifiers are required" });
    }
    try {
        await (0, projectService_1.assertManager)(projectId, user.id);
    }
    catch {
        return res.status(403).json({ message: "Forbidden" });
    }
    try {
        await (0, fileService_1.deleteFile)(projectId, fileId);
    }
    catch (err) {
        const status = (_c = err.status) !== null && _c !== void 0 ? _c : 500;
        const message = status === 404 ? 'File not found' : 'Unable to delete file';
        return res.status(status).json({ message });
    }
    return res.status(204).send();
}
//# sourceMappingURL=fileController.js.map
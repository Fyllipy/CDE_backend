"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProjectFiles = listProjectFiles;
exports.uploadFile = uploadFile;
exports.downloadRevision = downloadRevision;
exports.updateRevisionHandler = updateRevisionHandler;
exports.deleteFileHandler = deleteFileHandler;
exports.deleteRevisionHandler = deleteRevisionHandler;
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
function pickFile(map, key) {
    const entry = map === null || map === void 0 ? void 0 : map[key];
    if (!entry || !entry.length) {
        return undefined;
    }
    return entry[0];
}
async function uploadFile(req, res) {
    var _a, _b;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const { description, drawingName } = req.body;
    const files = req.files;
    const pdfFile = pickFile(files, "pdfFile");
    const dxfFile = pickFile(files, "dxfFile");
    let legacy = pickFile(files, "file");
    const single = req.file;
    if (!legacy && single) {
        legacy = single;
    }
    let resolvedPdf = pdfFile;
    let resolvedDxf = dxfFile;
    if (!resolvedPdf && !resolvedDxf && legacy) {
        const ext = (_b = legacy.originalname.split(".").pop()) === null || _b === void 0 ? void 0 : _b.toLowerCase();
        if (ext === "pdf") {
            resolvedPdf = legacy;
        }
        else if (ext === "dxf") {
            resolvedDxf = legacy;
        }
        else {
            return res.status(400).json({ message: "Only PDF or DXF files are supported" });
        }
    }
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId) {
        return res.status(400).json({ message: "Project id is required" });
    }
    if (!resolvedPdf && !resolvedDxf) {
        return res.status(400).json({ message: "At least one file (PDF or DXF) is required" });
    }
    if (resolvedPdf && !resolvedPdf.originalname.toLowerCase().endsWith(".pdf")) {
        return res.status(400).json({ message: "PDF file must have .pdf extension" });
    }
    if (resolvedDxf && !resolvedDxf.originalname.toLowerCase().endsWith(".dxf")) {
        return res.status(400).json({ message: "DXF file must have .dxf extension" });
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
        uploadedBy: user.id,
        namingPattern: pattern,
        description: (description === null || description === void 0 ? void 0 : description.trim()) || undefined,
        drawingName: (drawingName === null || drawingName === void 0 ? void 0 : drawingName.trim()) || undefined,
        pdfFile: resolvedPdf
            ? {
                buffer: resolvedPdf.buffer,
                originalFilename: resolvedPdf.originalname
            }
            : undefined,
        dxfFile: resolvedDxf
            ? {
                buffer: resolvedDxf.buffer,
                originalFilename: resolvedDxf.originalname
            }
            : undefined
    });
    return res.status(201).json(result);
}
async function downloadRevision(req, res) {
    var _a, _b;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const revisionId = (_b = req.params.revisionId) !== null && _b !== void 0 ? _b : '';
    const formatParam = typeof req.query.format === "string" ? req.query.format.toLowerCase() : undefined;
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
    const format = formatParam === "dxf" ? "dxf" : formatParam === "pdf" ? "pdf" : revision.pdfStoragePath ? "pdf" : "dxf";
    if (!format) {
        return res.status(404).json({ message: "Revision file not found" });
    }
    const storagePath = format === "pdf" ? revision.pdfStoragePath : revision.dxfStoragePath;
    const originalFilename = format === "pdf" ? revision.pdfOriginalFilename : revision.dxfOriginalFilename;
    if (!storagePath || !originalFilename) {
        return res.status(404).json({ message: "Requested format not available for this revision" });
    }
    const fileBuffer = await fs_1.promises.readFile(storagePath);
    res.setHeader("Content-Disposition", 'attachment; filename="' + originalFilename + '"');
    if (format === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
    }
    else if (format === "dxf") {
        res.setHeader("Content-Type", "application/dxf");
    }
    res.send(fileBuffer);
}
async function updateRevisionHandler(req, res) {
    var _a, _b;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const revisionId = (_b = req.params.revisionId) !== null && _b !== void 0 ? _b : '';
    const { description, drawingName } = req.body;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!projectId || !revisionId) {
        return res.status(400).json({ message: 'Identifiers are required' });
    }
    // Permitir que qualquer membro edite anotações; manter verificação de participação
    const membership = await (0, projectService_1.getMembership)(projectId, user.id);
    if (!membership) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    await (0, fileService_1.updateRevisionMeta)(projectId, revisionId, {
        description: typeof description === 'string' ? description : undefined,
        drawingName: typeof drawingName === 'string' ? drawingName : undefined
    });
    return res.status(204).send();
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
async function deleteRevisionHandler(req, res) {
    var _a, _b, _c;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const revisionId = (_b = req.params.revisionId) !== null && _b !== void 0 ? _b : '';
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!projectId || !revisionId) {
        return res.status(400).json({ message: 'Identifiers are required' });
    }
    try {
        await (0, projectService_1.assertManager)(projectId, user.id);
    }
    catch {
        return res.status(403).json({ message: 'Forbidden' });
    }
    try {
        await (0, fileService_1.deleteRevision)(projectId, revisionId);
    }
    catch (err) {
        const status = (_c = err.status) !== null && _c !== void 0 ? _c : 500;
        const message = status === 404 ? 'Revision not found' : 'Unable to delete revision';
        return res.status(status).json({ message });
    }
    return res.status(204).send();
}
//# sourceMappingURL=fileController.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGeneralDocs = listGeneralDocs;
exports.createGeneralDoc = createGeneralDoc;
exports.deleteGeneralDoc = deleteGeneralDoc;
exports.downloadGeneralDoc = downloadGeneralDoc;
const fs_1 = require("fs");
const generalDocumentService_1 = require("../services/generalDocumentService");
const projectService_1 = require("../services/projectService");
function getAuthUser(req) {
    return req.user;
}
async function listGeneralDocs(req, res) {
    const user = getAuthUser(req);
    const { projectId } = req.params;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!projectId) {
        return res.status(400).json({ message: 'Project id is required' });
    }
    const membership = await (0, projectService_1.getMembership)(projectId, user.id);
    if (!membership) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const documents = await (0, generalDocumentService_1.listGeneralDocuments)(projectId);
    return res.json({ documents });
}
async function createGeneralDoc(req, res) {
    const user = getAuthUser(req);
    const { projectId } = req.params;
    const file = req.file;
    const { category, description } = req.body;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!projectId) {
        return res.status(400).json({ message: 'Project id is required' });
    }
    if (!file) {
        return res.status(400).json({ message: 'File is required' });
    }
    const membership = await (0, projectService_1.getMembership)(projectId, user.id);
    if (!membership) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const document = await (0, generalDocumentService_1.createGeneralDocument)({
        projectId,
        fileBuffer: file.buffer,
        originalFilename: file.originalname,
        uploadedById: user.id,
        category: category !== null && category !== void 0 ? category : 'others',
        description
    });
    return res.status(201).json({ document });
}
async function deleteGeneralDoc(req, res) {
    var _a;
    const user = getAuthUser(req);
    const { projectId, documentId } = req.params;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!projectId || !documentId) {
        return res.status(400).json({ message: 'Identifiers are required' });
    }
    try {
        await (0, projectService_1.assertManager)(projectId, user.id);
    }
    catch {
        return res.status(403).json({ message: 'Forbidden' });
    }
    try {
        await (0, generalDocumentService_1.deleteGeneralDocument)(projectId, documentId);
    }
    catch (err) {
        const status = (_a = err.status) !== null && _a !== void 0 ? _a : 500;
        const message = status === 404 ? 'Document not found' : 'Unable to delete document';
        return res.status(status).json({ message });
    }
    return res.status(204).send();
}
async function downloadGeneralDoc(req, res) {
    const user = getAuthUser(req);
    const { projectId, documentId } = req.params;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!projectId || !documentId) {
        return res.status(400).json({ message: 'Identifiers are required' });
    }
    const membership = await (0, projectService_1.getMembership)(projectId, user.id);
    if (!membership) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const document = await (0, generalDocumentService_1.getGeneralDocument)(projectId, documentId);
    if (!document) {
        return res.status(404).json({ message: 'Document not found' });
    }
    const fileBuffer = await fs_1.promises.readFile(document.storagePath);
    res.setHeader('Content-Disposition', 'attachment; filename="' + document.originalFilename + '"');
    res.send(fileBuffer);
}
//# sourceMappingURL=generalDocumentController.js.map
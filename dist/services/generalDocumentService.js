"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGeneralDocument = createGeneralDocument;
exports.listGeneralDocuments = listGeneralDocuments;
exports.getGeneralDocument = getGeneralDocument;
exports.deleteGeneralDocument = deleteGeneralDocument;
const fs_1 = require("fs");
const path_1 = require("path");
const pool_1 = require("../db/pool");
const env_1 = require("../config/env");
const CATEGORIES = ['photos', 'documents', 'received', 'others'];
function assertCategory(value) {
    if (CATEGORIES.includes(value)) {
        return value;
    }
    return 'others';
}
async function ensureGeneralDir() {
    await fs_1.promises.mkdir(env_1.env.generalUploadDir, { recursive: true });
}
function buildStoragePath(projectId, docId, originalName) {
    const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    return (0, path_1.join)(env_1.env.generalUploadDir, projectId, docId + '_' + safeName);
}
async function createGeneralDocument(options) {
    var _a;
    const category = assertCategory(options.category);
    await ensureGeneralDir();
    const insert = await pool_1.pool.query('INSERT INTO "GeneralDocument" ("projectId", category, "originalFilename", "storagePath", description, "uploadedById") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, "projectId", category, "originalFilename", "storagePath", description, "uploadedById", "createdAt", "updatedAt"', [options.projectId, category, options.originalFilename, '', (_a = options.description) !== null && _a !== void 0 ? _a : null, options.uploadedById]);
    const document = insert.rows[0];
    if (!document) {
        throw new Error('Unable to create general document');
    }
    const storagePath = buildStoragePath(options.projectId, document.id, options.originalFilename);
    await fs_1.promises.mkdir((0, path_1.join)(env_1.env.generalUploadDir, options.projectId), { recursive: true });
    await fs_1.promises.writeFile(storagePath, options.fileBuffer);
    const update = await pool_1.pool.query('UPDATE "GeneralDocument" SET "storagePath" = $2, "updatedAt" = NOW() WHERE id = $1 RETURNING id, "projectId", category, "originalFilename", "storagePath", description, "uploadedById", "createdAt", "updatedAt"', [document.id, storagePath]);
    const updated = update.rows[0];
    if (!updated) {
        throw new Error('Unable to finalize general document');
    }
    return updated;
}
async function listGeneralDocuments(projectId) {
    const result = await pool_1.pool.query('SELECT id, "projectId", category, "originalFilename", "storagePath", description, "uploadedById", "createdAt", "updatedAt" FROM "GeneralDocument" WHERE "projectId" = $1 ORDER BY "createdAt" DESC', [projectId]);
    const grouped = {
        photos: [],
        documents: [],
        received: [],
        others: []
    };
    for (const doc of result.rows) {
        const category = assertCategory(doc.category);
        grouped[category].push(doc);
    }
    return grouped;
}
async function getGeneralDocument(projectId, documentId) {
    var _a;
    const result = await pool_1.pool.query('SELECT id, "projectId", category, "originalFilename", "storagePath", description, "uploadedById", "createdAt", "updatedAt" FROM "GeneralDocument" WHERE id = $1 AND "projectId" = $2', [documentId, projectId]);
    return (_a = result.rows[0]) !== null && _a !== void 0 ? _a : null;
}
async function deleteGeneralDocument(projectId, documentId) {
    const document = await getGeneralDocument(projectId, documentId);
    if (!document) {
        throw Object.assign(new Error('Document not found'), { status: 404 });
    }
    await pool_1.pool.query('DELETE FROM "GeneralDocument" WHERE id = $1 AND "projectId" = $2', [documentId, projectId]);
    try {
        await fs_1.promises.unlink(document.storagePath);
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
}
//# sourceMappingURL=generalDocumentService.js.map
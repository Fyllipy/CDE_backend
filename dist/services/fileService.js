"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureUploadDir = ensureUploadDir;
exports.buildStoragePath = buildStoragePath;
exports.validateAgainstNamingStandard = validateAgainstNamingStandard;
exports.createOrUpdateFileRevision = createOrUpdateFileRevision;
exports.listFiles = listFiles;
exports.getRevisionById = getRevisionById;
const fs_1 = require("fs");
const path_1 = require("path");
const pool_1 = require("../db/pool");
const env_1 = require("../config/env");
function ensureUploadDir() {
    return fs_1.promises.mkdir(env_1.env.uploadDir, { recursive: true });
}
function getRevisionLabel(index) {
    var _a;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const letter = (_a = alphabet[index]) !== null && _a !== void 0 ? _a : "X" + index.toString();
    return "rev" + letter;
}
function deriveBaseName(raw) {
    var _a;
    const revisionPattern = /(.*)[-_]rev([A-Za-z]+)$/i;
    const match = revisionPattern.exec(raw);
    if (match) {
        return (_a = match[1]) !== null && _a !== void 0 ? _a : raw;
    }
    return raw;
}
function buildStoragePath(projectId, fileId, revisionLabel, extension) {
    return (0, path_1.join)(env_1.env.uploadDir, projectId, fileId, revisionLabel + "." + extension);
}
async function validateAgainstNamingStandard(baseName, pattern) {
    var _a, _b;
    const tokens = pattern.split("-");
    const values = baseName.split("-");
    if (tokens.length !== values.length) {
        throw Object.assign(new Error("Nome de arquivo n�o segue o padr�o"), { status: 400 });
    }
    for (let i = 0; i < tokens.length; i += 1) {
        const token = (_a = tokens[i]) !== null && _a !== void 0 ? _a : "";
        const value = (_b = values[i]) !== null && _b !== void 0 ? _b : "";
        if (!token || !value) {
            throw Object.assign(new Error("Segmento vazio na nomenclatura"), { status: 400 });
        }
        const isPlaceholder = token.startsWith("{") && token.endsWith("}");
        if (!isPlaceholder && token !== value) {
            throw Object.assign(new Error('Segmento "' + value + '" n�o corresponde a "' + token + '"'), { status: 400 });
        }
    }
}
function splitNameAndExtension(original) {
    var _a;
    const segments = original.split('.');
    if (segments.length <= 1) {
        return { baseName: original, extension: 'dat' };
    }
    const extension = (_a = segments.pop()) !== null && _a !== void 0 ? _a : 'dat';
    const baseName = segments.join('.') || original;
    return { baseName, extension };
}
async function createOrUpdateFileRevision(options) {
    return (0, pool_1.withTransaction)(async (client) => {
        var _a, _b, _c, _d, _e;
        await ensureUploadDir();
        const nameInfo = splitNameAndExtension((_a = options.overrideBaseName) !== null && _a !== void 0 ? _a : options.originalFilename);
        const baseName = deriveBaseName(nameInfo.baseName);
        await validateAgainstNamingStandard(baseName, options.namingPattern);
        const fileResult = await client.query('SELECT id, "projectId", "baseName", extension, "currentRevisionId", "createdAt", "updatedAt" FROM "File" WHERE "projectId" = $1 AND "baseName" = $2', [options.projectId, baseName]);
        let file = (_b = fileResult.rows[0]) !== null && _b !== void 0 ? _b : null;
        let revisionIndex = 0;
        if (!file) {
            const inserted = await client.query('INSERT INTO "File" ("projectId", "baseName", extension) VALUES ($1, $2, $3) RETURNING id, "projectId", "baseName", extension, "currentRevisionId", "createdAt", "updatedAt"', [options.projectId, baseName, nameInfo.extension]);
            file = (_c = inserted.rows[0]) !== null && _c !== void 0 ? _c : null;
        }
        else {
            const countResult = await client.query('SELECT COUNT(*)::text as total FROM "FileRevision" WHERE "fileId" = $1', [file.id]);
            revisionIndex = Number((_e = (_d = countResult.rows[0]) === null || _d === void 0 ? void 0 : _d.total) !== null && _e !== void 0 ? _e : "0");
        }
        if (!file) {
            throw new Error('Unable to persist file metadata');
        }
        const revisionLabel = getRevisionLabel(revisionIndex);
        const storagePath = buildStoragePath(options.projectId, file.id, revisionLabel, nameInfo.extension);
        await fs_1.promises.mkdir((0, path_1.join)(env_1.env.uploadDir, options.projectId, file.id), { recursive: true });
        await fs_1.promises.writeFile(storagePath, options.fileBuffer);
        const revisionInsert = await client.query('INSERT INTO "FileRevision" ("fileId", "revisionIndex", "revisionLabel", "uploadedById", "storagePath", "originalFilename") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, "fileId", "revisionIndex", "revisionLabel", "uploadedById", "storagePath", "originalFilename", "createdAt"', [file.id, revisionIndex, revisionLabel, options.uploadedBy, storagePath, options.originalFilename]);
        const insertedRevision = revisionInsert.rows[0];
        if (!insertedRevision) {
            throw new Error('Unable to persist file revision');
        }
        const revision = {
            ...insertedRevision,
            uploadedByName: undefined,
            uploadedByEmail: undefined
        };
        const updated = await client.query('UPDATE "File" SET "currentRevisionId" = $2, "updatedAt" = NOW() WHERE id = $1 RETURNING id, "projectId", "baseName", extension, "currentRevisionId", "createdAt", "updatedAt"', [file.id, revision.id]);
        const updatedFile = updated.rows[0];
        if (!updatedFile) {
            throw new Error('Unable to update file revision pointer');
        }
        return { file: updatedFile, revision };
    });
}
async function listFiles(projectId) {
    var _a;
    const filesResult = await pool_1.pool.query('SELECT id, "projectId", "baseName", extension, "currentRevisionId", "createdAt", "updatedAt" FROM "File" WHERE "projectId" = $1 ORDER BY "updatedAt" DESC', [projectId]);
    if (!filesResult.rowCount) {
        return [];
    }
    const fileIds = filesResult.rows.map((item) => item.id);
    const revisionsResult = await pool_1.pool.query('SELECT fr.id, fr."fileId", fr."revisionIndex", fr."revisionLabel", fr."uploadedById", fr."storagePath", fr."originalFilename", fr."createdAt", u.name as "uploadedByName", u.email as "uploadedByEmail" FROM "FileRevision" fr LEFT JOIN "User" u ON u.id = fr."uploadedById" WHERE fr."fileId" = ANY($1::uuid[]) ORDER BY fr."revisionIndex" DESC', [fileIds]);
    const revisionsByFile = new Map();
    for (const revision of revisionsResult.rows) {
        const existing = (_a = revisionsByFile.get(revision.fileId)) !== null && _a !== void 0 ? _a : [];
        existing.push(revision);
        revisionsByFile.set(revision.fileId, existing);
    }
    return filesResult.rows.map((item) => {
        var _a;
        return ({
            ...item,
            revisions: (_a = revisionsByFile.get(item.id)) !== null && _a !== void 0 ? _a : []
        });
    });
}
async function getRevisionById(id) {
    const result = await pool_1.pool.query('SELECT fr.id, fr."fileId", fr."revisionIndex", fr."revisionLabel", fr."uploadedById", fr."storagePath", fr."originalFilename", fr."createdAt", u.name as "uploadedByName", u.email as "uploadedByEmail" FROM "FileRevision" fr LEFT JOIN "User" u ON u.id = fr."uploadedById" WHERE fr.id = $1', [id]);
    return result.rows[0];
}
//# sourceMappingURL=fileService.js.map
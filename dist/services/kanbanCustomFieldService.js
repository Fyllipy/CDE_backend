"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomFieldDef = createCustomFieldDef;
exports.getCustomFieldDefsByProject = getCustomFieldDefsByProject;
exports.updateCustomFieldDef = updateCustomFieldDef;
exports.deleteCustomFieldDef = deleteCustomFieldDef;
exports.upsertCardCustomFieldValue = upsertCardCustomFieldValue;
exports.getCustomFieldValuesForCard = getCustomFieldValuesForCard;
const pool_1 = require("../db/pool");
async function createCustomFieldDef(projectId, name, type, options = null, required = false) {
    const result = await pool_1.pool.query('INSERT INTO "KanbanCustomFieldDef" ("projectId", name, type, options, required) VALUES ($1, $2, $3, $4, $5) RETURNING id, "projectId", name, type, options, required, "createdAt", "updatedAt"', [projectId, name, type, options, required]);
    const field = result.rows[0];
    if (!field) {
        throw new Error("Unable to create custom field");
    }
    return field;
}
async function getCustomFieldDefsByProject(projectId) {
    const result = await pool_1.pool.query('SELECT id, "projectId", name, type, options, required, "createdAt", "updatedAt" FROM "KanbanCustomFieldDef" WHERE "projectId" = $1 ORDER BY "createdAt" ASC', [projectId]);
    return result.rows;
}
async function updateCustomFieldDef(fieldId, updates) {
    var _a;
    const result = await pool_1.pool.query('UPDATE "KanbanCustomFieldDef" SET name = COALESCE($2, name), type = COALESCE($3, type), options = $4, required = COALESCE($5, required), "updatedAt" = NOW() WHERE id = $1 RETURNING id, "projectId", name, type, options, required, "createdAt", "updatedAt"', [fieldId, updates.name, updates.type, (_a = updates.options) !== null && _a !== void 0 ? _a : null, updates.required]);
    return result.rows[0];
}
async function deleteCustomFieldDef(fieldId) {
    await pool_1.pool.query('DELETE FROM "KanbanCustomFieldDef" WHERE id = $1', [fieldId]);
}
async function upsertCardCustomFieldValue(cardId, fieldId, value) {
    const result = await pool_1.pool.query('INSERT INTO "KanbanCardCustomField" ("cardId", "fieldId", value) VALUES ($1, $2, $3) ON CONFLICT ("cardId", "fieldId") DO UPDATE SET value = $3, "updatedAt" = NOW() RETURNING "cardId", "fieldId", value, "updatedAt"', [cardId, fieldId, value]);
    const row = result.rows[0];
    if (!row) {
        throw new Error("Unable to persist custom field value");
    }
    return row;
}
async function getCustomFieldValuesForCard(cardId) {
    const result = await pool_1.pool.query(`SELECT d.id,
            d."projectId",
            d.name,
            d.type,
            d.options,
            d.required,
            d."createdAt",
            d."updatedAt",
            c.value
       FROM "KanbanCustomFieldDef" d
       LEFT JOIN "KanbanCardCustomField" c ON c."fieldId" = d.id AND c."cardId" = $1
       WHERE d."projectId" = (SELECT "projectId" FROM "KanbanCard" WHERE id = $1)
       ORDER BY d."createdAt" ASC`, [cardId]);
    return result.rows.map((row) => {
        var _a;
        return ({
            id: row.id,
            projectId: row.projectId,
            name: row.name,
            type: row.type,
            options: row.options,
            required: row.required,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            value: (_a = row.value) !== null && _a !== void 0 ? _a : null,
        });
    });
}
//# sourceMappingURL=kanbanCustomFieldService.js.map
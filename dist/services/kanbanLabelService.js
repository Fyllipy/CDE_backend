"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLabel = createLabel;
exports.getLabelsByProjectId = getLabelsByProjectId;
exports.updateLabel = updateLabel;
exports.deleteLabel = deleteLabel;
exports.addLabelToCard = addLabelToCard;
exports.removeLabelFromCard = removeLabelFromCard;
exports.getLabelsByCardId = getLabelsByCardId;
const pool_1 = require("../db/pool");
async function createLabel(projectId, name, color) {
    const result = await pool_1.pool.query('INSERT INTO "KanbanLabel" ("projectId", name, color) VALUES ($1, $2, $3) RETURNING *', [projectId, name, color]);
    const label = result.rows[0];
    if (!label) {
        throw new Error("Unable to create label");
    }
    return label;
}
async function getLabelsByProjectId(projectId) {
    const result = await pool_1.pool.query('SELECT * FROM "KanbanLabel" WHERE "projectId" = $1 ORDER BY "createdAt" ASC', [projectId]);
    return result.rows;
}
async function updateLabel(labelId, updates) {
    const result = await pool_1.pool.query('UPDATE "KanbanLabel" SET name = COALESCE($2, name), color = COALESCE($3, color), "updatedAt" = NOW() WHERE id = $1 RETURNING *', [labelId, updates.name, updates.color]);
    const label = result.rows[0];
    if (!label) {
        throw new Error("Label not found or unable to update");
    }
    return label;
}
async function deleteLabel(labelId) {
    await pool_1.pool.query('DELETE FROM "KanbanLabel" WHERE id = $1', [labelId]);
}
async function addLabelToCard(cardId, labelId) {
    await pool_1.pool.query('INSERT INTO "KanbanCardLabel" ("cardId", "labelId") VALUES ($1, $2) ON CONFLICT DO NOTHING', [cardId, labelId]);
}
async function removeLabelFromCard(cardId, labelId) {
    await pool_1.pool.query('DELETE FROM "KanbanCardLabel" WHERE "cardId" = $1 AND "labelId" = $2', [cardId, labelId]);
}
async function getLabelsByCardId(cardId) {
    const result = await pool_1.pool.query('SELECT l.* FROM "KanbanLabel" l JOIN "KanbanCardLabel" cl ON l.id = cl."labelId" WHERE cl."cardId" = $1', [cardId]);
    return result.rows;
}
//# sourceMappingURL=kanbanLabelService.js.map
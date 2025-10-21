"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAssigneeToCard = addAssigneeToCard;
exports.removeAssigneeFromCard = removeAssigneeFromCard;
exports.getAssigneesByCardId = getAssigneesByCardId;
const pool_1 = require("../db/pool");
async function addAssigneeToCard(cardId, userId) {
    await pool_1.pool.query('INSERT INTO "KanbanCardAssignee" ("cardId", "userId") VALUES ($1, $2) ON CONFLICT DO NOTHING', [cardId, userId]);
}
async function removeAssigneeFromCard(cardId, userId) {
    await pool_1.pool.query('DELETE FROM "KanbanCardAssignee" WHERE "cardId" = $1 AND "userId" = $2', [cardId, userId]);
}
async function getAssigneesByCardId(cardId) {
    const result = await pool_1.pool.query('SELECT u.id, u.name, u.email FROM "User" u JOIN "KanbanCardAssignee" ca ON u.id = ca."userId" WHERE ca."cardId" = $1', [cardId]);
    return result.rows;
}
//# sourceMappingURL=kanbanAssigneeService.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActivity = createActivity;
exports.getActivityByCardId = getActivityByCardId;
const pool_1 = require("../db/pool");
async function createActivity(cardId, actorId, type, data) {
    const result = await pool_1.pool.query('INSERT INTO "KanbanActivity" ("cardId", "actorId", type, data) VALUES ($1, $2, $3, $4) RETURNING *', [cardId, actorId, type, data]);
    const activity = result.rows[0];
    if (!activity) {
        throw new Error("Unable to create activity");
    }
    return activity;
}
async function getActivityByCardId(cardId) {
    const result = await pool_1.pool.query('SELECT * FROM "KanbanActivity" WHERE "cardId" = $1 ORDER BY "createdAt" DESC', [cardId]);
    return result.rows;
}
//# sourceMappingURL=kanbanActivityService.js.map
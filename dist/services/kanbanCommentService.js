"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComment = createComment;
exports.getCommentsByCardId = getCommentsByCardId;
exports.updateComment = updateComment;
exports.deleteComment = deleteComment;
const pool_1 = require("../db/pool");
async function createComment(cardId, authorId, body) {
    const result = await pool_1.pool.query('INSERT INTO "KanbanComment" ("cardId", "authorId", body) VALUES ($1, $2, $3) RETURNING *', [cardId, authorId, body]);
    const comment = result.rows[0];
    if (!comment) {
        throw new Error("Unable to create comment");
    }
    return comment;
}
async function getCommentsByCardId(cardId) {
    const result = await pool_1.pool.query('SELECT * FROM "KanbanComment" WHERE "cardId" = $1 ORDER BY "createdAt" ASC', [cardId]);
    return result.rows;
}
async function updateComment(commentId, body) {
    const result = await pool_1.pool.query('UPDATE "KanbanComment" SET body = $2, "updatedAt" = NOW() WHERE id = $1 RETURNING *', [commentId, body]);
    const comment = result.rows[0];
    if (!comment) {
        throw new Error("Comment not found or unable to update");
    }
    return comment;
}
async function deleteComment(commentId) {
    await pool_1.pool.query('DELETE FROM "KanbanComment" WHERE id = $1', [commentId]);
}
//# sourceMappingURL=kanbanCommentService.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBoard = listBoard;
exports.createColumn = createColumn;
exports.updateColumn = updateColumn;
exports.deleteColumn = deleteColumn;
exports.createCard = createCard;
exports.updateCard = updateCard;
exports.deleteCard = deleteCard;
exports.moveCard = moveCard;
exports.reorderColumns = reorderColumns;
exports.reorderCards = reorderCards;
const pool_1 = require("../db/pool");
const DEFAULT_COLUMN_COLOR = "#2563eb";
async function listBoard(projectId) {
    var _a;
    const columnsResult = await pool_1.pool.query('SELECT id, "projectId", name, position, color, "createdAt", "updatedAt" FROM "KanbanColumn" WHERE "projectId" = $1 ORDER BY position ASC', [projectId]);
    const cardsResult = await pool_1.pool.query('SELECT id, "columnId", "projectId", title, description, color, position, "createdAt", "updatedAt" FROM "KanbanCard" WHERE "projectId" = $1 ORDER BY position ASC', [projectId]);
    const cardsByColumn = new Map();
    for (const card of cardsResult.rows) {
        const list = (_a = cardsByColumn.get(card.columnId)) !== null && _a !== void 0 ? _a : [];
        list.push(card);
        cardsByColumn.set(card.columnId, list);
    }
    return columnsResult.rows.map((column) => {
        var _a;
        return ({
            ...column,
            cards: (_a = cardsByColumn.get(column.id)) !== null && _a !== void 0 ? _a : []
        });
    });
}
async function createColumn(projectId, name, color) {
    var _a, _b;
    const positionResult = await pool_1.pool.query('SELECT MAX(position) as max FROM "KanbanColumn" WHERE "projectId" = $1', [projectId]);
    const nextPosition = ((_b = (_a = positionResult.rows[0]) === null || _a === void 0 ? void 0 : _a.max) !== null && _b !== void 0 ? _b : -1) + 1;
    const result = await pool_1.pool.query('INSERT INTO "KanbanColumn" ("projectId", name, position, color) VALUES ($1, $2, $3, $4) RETURNING id, "projectId", name, position, color, "createdAt", "updatedAt"', [projectId, name, nextPosition, color !== null && color !== void 0 ? color : DEFAULT_COLUMN_COLOR]);
    const column = result.rows[0];
    if (!column) {
        throw new Error('Unable to create column');
    }
    return column;
}
async function updateColumn(columnId, data) {
    var _a, _b;
    const result = await pool_1.pool.query('UPDATE "KanbanColumn" SET name = COALESCE($2, name), color = COALESCE($3, color), "updatedAt" = NOW() WHERE id = $1 RETURNING id, "projectId", name, position, color, "createdAt", "updatedAt"', [columnId, (_a = data.name) !== null && _a !== void 0 ? _a : null, (_b = data.color) !== null && _b !== void 0 ? _b : null]);
    return result.rows[0];
}
async function deleteColumn(columnId) {
    await pool_1.pool.query('DELETE FROM "KanbanColumn" WHERE id = $1', [columnId]);
}
async function createCard(columnId, projectId, title, description, color) {
    var _a, _b;
    const positionResult = await pool_1.pool.query('SELECT MAX(position) as max FROM "KanbanCard" WHERE "columnId" = $1', [columnId]);
    const nextPosition = ((_b = (_a = positionResult.rows[0]) === null || _a === void 0 ? void 0 : _a.max) !== null && _b !== void 0 ? _b : -1) + 1;
    const result = await pool_1.pool.query('INSERT INTO "KanbanCard" ("columnId", "projectId", title, description, color, position) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, "columnId", "projectId", title, description, color, position, "createdAt", "updatedAt"', [columnId, projectId, title, description, color !== null && color !== void 0 ? color : null, nextPosition]);
    const card = result.rows[0];
    if (!card) {
        throw new Error('Unable to create card');
    }
    return card;
}
async function updateCard(cardId, fields) {
    var _a, _b, _c;
    const result = await pool_1.pool.query('UPDATE "KanbanCard" SET title = COALESCE($2, title), description = $3, color = COALESCE($4, color), "updatedAt" = NOW() WHERE id = $1 RETURNING id, "columnId", "projectId", title, description, color, position, "createdAt", "updatedAt"', [cardId, (_a = fields.title) !== null && _a !== void 0 ? _a : null, (_b = fields.description) !== null && _b !== void 0 ? _b : null, (_c = fields.color) !== null && _c !== void 0 ? _c : null]);
    return result.rows[0];
}
async function deleteCard(cardId) {
    await pool_1.pool.query('DELETE FROM "KanbanCard" WHERE id = $1', [cardId]);
}
async function moveCard(cardId, toColumnId, newPosition) {
    await pool_1.pool.query('UPDATE "KanbanCard" SET "columnId" = $2, position = $3, "updatedAt" = NOW() WHERE id = $1', [cardId, toColumnId, newPosition]);
}
async function reorderColumns(projectId, orderedIds) {
    var _a;
    await pool_1.pool.query('BEGIN');
    try {
        for (let index = 0; index < orderedIds.length; index += 1) {
            const columnId = (_a = orderedIds[index]) !== null && _a !== void 0 ? _a : '';
            if (!columnId) {
                continue;
            }
            await pool_1.pool.query('UPDATE "KanbanColumn" SET position = $2, "updatedAt" = NOW() WHERE id = $1 AND "projectId" = $3', [columnId, index, projectId]);
        }
        await pool_1.pool.query('COMMIT');
    }
    catch (error) {
        await pool_1.pool.query('ROLLBACK');
        throw error;
    }
}
async function reorderCards(columnId, orderedIds) {
    var _a;
    await pool_1.pool.query('BEGIN');
    try {
        for (let index = 0; index < orderedIds.length; index += 1) {
            const cardId = (_a = orderedIds[index]) !== null && _a !== void 0 ? _a : '';
            if (!cardId) {
                continue;
            }
            await pool_1.pool.query('UPDATE "KanbanCard" SET position = $2, "updatedAt" = NOW() WHERE id = $1 AND "columnId" = $3', [cardId, index, columnId]);
        }
        await pool_1.pool.query('COMMIT');
    }
    catch (error) {
        await pool_1.pool.query('ROLLBACK');
        throw error;
    }
}
//# sourceMappingURL=kanbanService.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBoard = listBoard;
exports.getCardDetails = getCardDetails;
exports.getSubtasks = getSubtasks;
exports.createColumn = createColumn;
exports.updateColumn = updateColumn;
exports.deleteColumn = deleteColumn;
exports.createCard = createCard;
exports.updateCard = updateCard;
exports.getCard = getCard;
exports.deleteCard = deleteCard;
exports.archiveCard = archiveCard;
exports.restoreCard = restoreCard;
exports.moveCard = moveCard;
exports.archiveColumn = archiveColumn;
exports.restoreColumn = restoreColumn;
exports.bulkArchiveCards = bulkArchiveCards;
exports.bulkRestoreCards = bulkRestoreCards;
exports.bulkMoveCards = bulkMoveCards;
exports.bulkAssignCards = bulkAssignCards;
exports.bulkLabelCards = bulkLabelCards;
exports.promoteChecklistItemToSubtask = promoteChecklistItemToSubtask;
exports.listArchivedColumns = listArchivedColumns;
exports.listArchivedCards = listArchivedCards;
exports.reorderColumns = reorderColumns;
exports.reorderCards = reorderCards;
const pool_1 = require("../db/pool");
const kanbanChecklistService_1 = require("./kanbanChecklistService");
const kanbanCustomFieldService_1 = require("./kanbanCustomFieldService");
const DEFAULT_COLUMN_COLOR = "#2563eb";
async function listBoard(projectId) {
    var _a;
    const columnsResult = await pool_1.pool.query('SELECT id, "projectId", name, position, color, "wipLimit", "archivedAt", "createdAt", "updatedAt" FROM "KanbanColumn" WHERE "projectId" = $1 AND "archivedAt" IS NULL ORDER BY position ASC', [projectId]);
    const cardsResult = await pool_1.pool.query('SELECT id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt", priority, "startDate", "dueDate", "completedAt", "archivedAt", "parentId" FROM "KanbanCard" WHERE "projectId" = $1 AND "archivedAt" IS NULL ORDER BY position ASC', [projectId]);
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
            cards: (_a = cardsByColumn.get(column.id)) !== null && _a !== void 0 ? _a : [],
        });
    });
}
async function getCardDetails(cardId) {
    const cardResult = await pool_1.pool.query('SELECT * FROM "KanbanCard" WHERE id = $1', [cardId]);
    const card = cardResult.rows[0];
    if (!card)
        return null;
    const [labels, assignees, comments, activity, checklists, customFields, subtasks] = await Promise.all([
        (0, kanbanLabelService_1.getLabelsByCardId)(cardId),
        (0, kanbanAssigneeService_1.getAssigneesByCardId)(cardId),
        (0, kanbanCommentService_1.getCommentsByCardId)(cardId),
        (0, kanbanActivityService_1.getActivityByCardId)(cardId),
        (0, kanbanChecklistService_1.getChecklistsByCardId)(cardId),
        (0, kanbanCustomFieldService_1.getCustomFieldValuesForCard)(cardId),
        getSubtasks(cardId),
    ]);
    return { ...card, labels, assignees, comments, activity, checklists, customFields, subtasks };
}
async function getSubtasks(cardId) {
    const result = await pool_1.pool.query('SELECT id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt", priority, "startDate", "dueDate", "completedAt", "archivedAt", "parentId" FROM "KanbanCard" WHERE "parentId" = $1 AND "archivedAt" IS NULL ORDER BY position ASC', [cardId]);
    return result.rows;
}
async function createColumn(projectId, name, color) {
    var _a, _b;
    const positionResult = await pool_1.pool.query('SELECT MAX(position) as max FROM "KanbanColumn" WHERE "projectId" = $1', [projectId]);
    const nextPosition = ((_b = (_a = positionResult.rows[0]) === null || _a === void 0 ? void 0 : _a.max) !== null && _b !== void 0 ? _b : -1) + 1;
    const result = await pool_1.pool.query('INSERT INTO "KanbanColumn" ("projectId", name, position, color) VALUES ($1, $2, $3, $4) RETURNING id, "projectId", name, position, color, "wipLimit", "archivedAt", "createdAt", "updatedAt"', [projectId, name, nextPosition, color !== null && color !== void 0 ? color : DEFAULT_COLUMN_COLOR]);
    const column = result.rows[0];
    if (!column) {
        throw new Error("Unable to create column");
    }
    return column;
}
async function updateColumn(columnId, data) {
    const result = await pool_1.pool.query('UPDATE "KanbanColumn" SET name = COALESCE($2, name), color = COALESCE($3, color), "wipLimit" = $4, "archivedAt" = $5, "updatedAt" = NOW() WHERE id = $1 RETURNING id, "projectId", name, position, color, "wipLimit", "archivedAt", "createdAt", "updatedAt"', [columnId, data.name, data.color, data.wipLimit, data.archivedAt]);
    return result.rows[0];
}
async function deleteColumn(columnId) {
    await pool_1.pool.query('DELETE FROM "KanbanColumn" WHERE id = $1', [columnId]);
}
async function createCard(columnId, projectId, title, description, parentId = null) {
    var _a, _b, _c, _d, _e, _f;
    // Enforce WIP limit for the target column, if any
    const colRes = await pool_1.pool.query('SELECT "wipLimit" FROM "KanbanColumn" WHERE id = $1', [columnId]);
    const wipLimit = (_b = (_a = colRes.rows[0]) === null || _a === void 0 ? void 0 : _a.wipLimit) !== null && _b !== void 0 ? _b : null;
    if (wipLimit !== null) {
        const countRes = await pool_1.pool.query('SELECT COUNT(*)::int as cnt FROM "KanbanCard" WHERE "columnId" = $1', [columnId]);
        const cnt = (_d = (_c = countRes.rows[0]) === null || _c === void 0 ? void 0 : _c.cnt) !== null && _d !== void 0 ? _d : 0;
        if (cnt >= wipLimit) {
            const err = new Error('WIP_LIMIT_EXCEEDED');
            throw err;
        }
    }
    const positionResult = await pool_1.pool.query('SELECT MAX(position) as max FROM "KanbanCard" WHERE "columnId" = $1', [columnId]);
    const nextPosition = ((_f = (_e = positionResult.rows[0]) === null || _e === void 0 ? void 0 : _e.max) !== null && _f !== void 0 ? _f : -1) + 1;
    const result = await pool_1.pool.query('INSERT INTO "KanbanCard" ("columnId", "projectId", title, description, position, "parentId") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt", priority, "startDate", "dueDate", "completedAt", "archivedAt", "parentId"', [columnId, projectId, title, description, nextPosition, parentId]);
    const card = result.rows[0];
    if (!card) {
        throw new Error('Unable to create card');
    }
    return card;
}
async function updateCard(cardId, fields) {
    var _a, _b;
    const result = await pool_1.pool.query('UPDATE "KanbanCard" SET title = COALESCE($2, title), description = $3, priority = $4, "startDate" = $5, "dueDate" = $6, "completedAt" = $7, "archivedAt" = $8, "parentId" = $9, "updatedAt" = NOW() WHERE id = $1 RETURNING id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt", priority, "startDate", "dueDate", "completedAt", "archivedAt", "parentId"', [
        cardId,
        fields.title,
        fields.description,
        fields.priority,
        fields.startDate,
        fields.dueDate,
        fields.completedAt,
        (_a = fields.archivedAt) !== null && _a !== void 0 ? _a : null,
        (_b = fields.parentId) !== null && _b !== void 0 ? _b : null,
    ]);
    return result.rows[0];
}
const kanbanAssigneeService_1 = require("./kanbanAssigneeService");
const kanbanCommentService_1 = require("./kanbanCommentService");
const kanbanLabelService_1 = require("./kanbanLabelService");
const kanbanActivityService_1 = require("./kanbanActivityService");
async function getCard(cardId) {
    const cardResult = await pool_1.pool.query('SELECT * FROM "KanbanCard" WHERE id = $1', [cardId]);
    const card = cardResult.rows[0];
    if (!card) {
        return null;
    }
    const [labels, assignees, comments, activity, checklists, customFields, subtasks] = await Promise.all([
        (0, kanbanLabelService_1.getLabelsByCardId)(cardId),
        (0, kanbanAssigneeService_1.getAssigneesByCardId)(cardId),
        (0, kanbanCommentService_1.getCommentsByCardId)(cardId),
        (0, kanbanActivityService_1.getActivityByCardId)(cardId),
        (0, kanbanChecklistService_1.getChecklistsByCardId)(cardId),
        (0, kanbanCustomFieldService_1.getCustomFieldValuesForCard)(cardId),
        getSubtasks(cardId),
    ]);
    return { ...card, labels, assignees, comments, activity, checklists, customFields, subtasks };
}
async function deleteCard(cardId) {
    await pool_1.pool.query('DELETE FROM "KanbanCard" WHERE id = $1', [cardId]);
}
async function archiveCard(cardId) {
    await (0, pool_1.withTransaction)(async (client) => {
        const cardResult = await client.query('SELECT "columnId", position FROM "KanbanCard" WHERE id = $1 FOR UPDATE', [cardId]);
        const card = cardResult.rows[0];
        if (!card) {
            throw new Error('Card not found');
        }
        await client.query('UPDATE "KanbanCard" SET "archivedAt" = NOW(), "updatedAt" = NOW() WHERE id = $1', [cardId]);
        await client.query('UPDATE "KanbanCard" SET position = position - 1, "updatedAt" = NOW() WHERE "columnId" = $1 AND position > $2 AND "archivedAt" IS NULL', [card.columnId, card.position]);
    });
}
async function restoreCard(cardId) {
    await (0, pool_1.withTransaction)(async (client) => {
        var _a, _b;
        const cardResult = await client.query('SELECT "columnId" FROM "KanbanCard" WHERE id = $1 FOR UPDATE', [cardId]);
        const card = cardResult.rows[0];
        if (!card) {
            throw new Error('Card not found');
        }
        const positionResult = await client.query('SELECT MAX(position) AS max FROM "KanbanCard" WHERE "columnId" = $1 AND "archivedAt" IS NULL', [card.columnId]);
        const nextPosition = ((_b = (_a = positionResult.rows[0]) === null || _a === void 0 ? void 0 : _a.max) !== null && _b !== void 0 ? _b : -1) + 1;
        await client.query('UPDATE "KanbanCard" SET "archivedAt" = NULL, position = $2, "updatedAt" = NOW() WHERE id = $1', [cardId, nextPosition]);
    });
}
async function moveCard(cardId, toColumnId, newPosition) {
    // Use transaction helper to ensure proper client usage
    return (0, pool_1.withTransaction)(async (client) => {
        var _a, _b, _c, _d;
        const cardResult = await client.query('SELECT "columnId", position FROM "KanbanCard" WHERE id = $1 FOR UPDATE', [cardId]);
        const card = cardResult.rows[0];
        if (!card) {
            throw new Error('Card not found');
        }
        const { columnId: fromColumnId, position: oldPosition } = card;
        if (fromColumnId === toColumnId && oldPosition === newPosition) {
            return;
        }
        // Enforce WIP limit on destination column
        const colRes = await client.query('SELECT "wipLimit" FROM "KanbanColumn" WHERE id = $1 FOR UPDATE', [toColumnId]);
        const wipLimit = (_b = (_a = colRes.rows[0]) === null || _a === void 0 ? void 0 : _a.wipLimit) !== null && _b !== void 0 ? _b : null;
        if (wipLimit !== null) {
            const countRes = await client.query('SELECT COUNT(*)::int as cnt FROM "KanbanCard" WHERE "columnId" = $1', [toColumnId]);
            const cnt = (_d = (_c = countRes.rows[0]) === null || _c === void 0 ? void 0 : _c.cnt) !== null && _d !== void 0 ? _d : 0;
            // if moving within same column, subtract one from count because the card is currently counted in dest
            const effectiveCount = toColumnId === fromColumnId ? cnt : cnt;
            if (toColumnId !== fromColumnId && effectiveCount >= wipLimit) {
                const err = new Error('WIP_LIMIT_EXCEEDED');
                throw err;
            }
        }
        // 1. "Remove" card from the old column by shifting subsequent cards up
        await client.query('UPDATE "KanbanCard" SET position = position - 1, "updatedAt" = NOW() WHERE "columnId" = $1 AND position > $2', [fromColumnId, oldPosition]);
        // 2. "Insert" card into the new column by shifting subsequent cards down
        await client.query('UPDATE "KanbanCard" SET position = position + 1, "updatedAt" = NOW() WHERE "columnId" = $1 AND position >= $2', [toColumnId, newPosition]);
        // 3. Finally, move the card to its new column and position
        await client.query('UPDATE "KanbanCard" SET "columnId" = $1, position = $2, "updatedAt" = NOW() WHERE id = $3', [toColumnId, newPosition, cardId]);
    });
}
async function archiveColumn(columnId) {
    await (0, pool_1.withTransaction)(async (client) => {
        await client.query('UPDATE "KanbanColumn" SET "archivedAt" = NOW(), "updatedAt" = NOW() WHERE id = $1', [columnId]);
        await client.query('UPDATE "KanbanCard" SET "archivedAt" = NOW(), "updatedAt" = NOW() WHERE "columnId" = $1 AND "archivedAt" IS NULL', [columnId]);
    });
}
async function restoreColumn(columnId) {
    await (0, pool_1.withTransaction)(async (client) => {
        var _a, _b;
        const columnResult = await client.query('SELECT "projectId" FROM "KanbanColumn" WHERE id = $1 FOR UPDATE', [columnId]);
        const column = columnResult.rows[0];
        if (!column) {
            throw new Error('Column not found');
        }
        const positionResult = await client.query('SELECT MAX(position) AS max FROM "KanbanColumn" WHERE "projectId" = $1 AND "archivedAt" IS NULL', [column.projectId]);
        const nextPosition = ((_b = (_a = positionResult.rows[0]) === null || _a === void 0 ? void 0 : _a.max) !== null && _b !== void 0 ? _b : -1) + 1;
        await client.query('UPDATE "KanbanColumn" SET "archivedAt" = NULL, position = $2, "updatedAt" = NOW() WHERE id = $1', [columnId, nextPosition]);
        await client.query('UPDATE "KanbanCard" SET "archivedAt" = NULL, "updatedAt" = NOW() WHERE "columnId" = $1', [columnId]);
    });
}
async function bulkArchiveCards(cardIds) {
    for (const cardId of cardIds) {
        if (!cardId) {
            continue;
        }
        await archiveCard(cardId);
    }
}
async function bulkRestoreCards(cardIds) {
    for (const cardId of cardIds) {
        if (!cardId) {
            continue;
        }
        await restoreCard(cardId);
    }
}
async function bulkMoveCards(cardIds, toColumnId) {
    await (0, pool_1.withTransaction)(async (client) => {
        var _a, _b, _c, _d, _e, _f;
        const wipResult = await client.query('SELECT "wipLimit" FROM "KanbanColumn" WHERE id = $1 FOR UPDATE', [toColumnId]);
        const wipLimit = (_b = (_a = wipResult.rows[0]) === null || _a === void 0 ? void 0 : _a.wipLimit) !== null && _b !== void 0 ? _b : null;
        const existingCountResult = await client.query('SELECT COUNT(*)::int AS cnt FROM "KanbanCard" WHERE "columnId" = $1 AND "archivedAt" IS NULL', [toColumnId]);
        const existingCount = (_d = (_c = existingCountResult.rows[0]) === null || _c === void 0 ? void 0 : _c.cnt) !== null && _d !== void 0 ? _d : 0;
        if (wipLimit !== null && existingCount + cardIds.length > wipLimit) {
            throw new Error('WIP_LIMIT_EXCEEDED');
        }
        const positionResult = await client.query('SELECT MAX(position) AS max FROM "KanbanCard" WHERE "columnId" = $1 AND "archivedAt" IS NULL', [toColumnId]);
        let nextPosition = ((_f = (_e = positionResult.rows[0]) === null || _e === void 0 ? void 0 : _e.max) !== null && _f !== void 0 ? _f : -1) + 1;
        for (const cardId of cardIds) {
            if (!cardId) {
                continue;
            }
            const cardResult = await client.query('SELECT "columnId", position FROM "KanbanCard" WHERE id = $1 FOR UPDATE', [cardId]);
            const card = cardResult.rows[0];
            if (!card) {
                continue;
            }
            await client.query('UPDATE "KanbanCard" SET position = position - 1, "updatedAt" = NOW() WHERE "columnId" = $1 AND position > $2 AND "archivedAt" IS NULL', [card.columnId, card.position]);
            await client.query('UPDATE "KanbanCard" SET "columnId" = $1, position = $2, "updatedAt" = NOW() WHERE id = $3', [toColumnId, nextPosition, cardId]);
            nextPosition += 1;
        }
    });
}
async function bulkAssignCards(cardIds, userId, action) {
    for (const cardId of cardIds) {
        if (!cardId) {
            continue;
        }
        if (action === "add") {
            await (0, kanbanAssigneeService_1.addAssigneeToCard)(cardId, userId);
        }
        else {
            await (0, kanbanAssigneeService_1.removeAssigneeFromCard)(cardId, userId);
        }
    }
}
async function bulkLabelCards(cardIds, labelId, action) {
    for (const cardId of cardIds) {
        if (!cardId) {
            continue;
        }
        if (action === "attach") {
            await (0, kanbanLabelService_1.addLabelToCard)(cardId, labelId);
        }
        else {
            await (0, kanbanLabelService_1.removeLabelFromCard)(cardId, labelId);
        }
    }
}
async function promoteChecklistItemToSubtask(itemId) {
    return (0, pool_1.withTransaction)(async (client) => {
        var _a, _b, _c, _d, _e, _f;
        const itemResult = await client.query(`SELECT i."checklistId",
              c."cardId",
              card."columnId",
              card."projectId",
              i.title,
              i.position
         FROM "KanbanChecklistItem" i
         JOIN "KanbanChecklist" c ON c.id = i."checklistId"
         JOIN "KanbanCard" card ON card.id = c."cardId"
        WHERE i.id = $1
        FOR UPDATE`, [itemId]);
        const item = itemResult.rows[0];
        if (!item) {
            throw new Error('Checklist item not found');
        }
        const colRes = await client.query('SELECT "wipLimit" FROM "KanbanColumn" WHERE id = $1 FOR UPDATE', [item.columnId]);
        const wipLimit = (_b = (_a = colRes.rows[0]) === null || _a === void 0 ? void 0 : _a.wipLimit) !== null && _b !== void 0 ? _b : null;
        if (wipLimit !== null) {
            const countRes = await client.query('SELECT COUNT(*)::int AS cnt FROM "KanbanCard" WHERE "columnId" = $1 AND "archivedAt" IS NULL', [item.columnId]);
            if (((_d = (_c = countRes.rows[0]) === null || _c === void 0 ? void 0 : _c.cnt) !== null && _d !== void 0 ? _d : 0) >= wipLimit) {
                throw new Error('WIP_LIMIT_EXCEEDED');
            }
        }
        const positionResult = await client.query('SELECT MAX(position) AS max FROM "KanbanCard" WHERE "columnId" = $1 AND "archivedAt" IS NULL', [item.columnId]);
        const nextPosition = ((_f = (_e = positionResult.rows[0]) === null || _e === void 0 ? void 0 : _e.max) !== null && _f !== void 0 ? _f : -1) + 1;
        const cardResult = await client.query('INSERT INTO "KanbanCard" ("columnId", "projectId", title, description, position, "parentId") VALUES ($1, $2, $3, NULL, $4, $5) RETURNING id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt", priority, "startDate", "dueDate", "completedAt", "archivedAt", "parentId"', [item.columnId, item.projectId, item.title, nextPosition, item.cardId]);
        const newCard = cardResult.rows[0];
        if (!newCard) {
            throw new Error('Unable to create subtask card');
        }
        await client.query('DELETE FROM "KanbanChecklistItem" WHERE id = $1', [itemId]);
        await client.query('UPDATE "KanbanChecklistItem" SET position = position - 1, "updatedAt" = NOW() WHERE "checklistId" = $1 AND position > $2', [item.checklistId, item.position]);
        return newCard;
    });
}
async function listArchivedColumns(projectId) {
    const result = await pool_1.pool.query('SELECT id, "projectId", name, position, color, "wipLimit", "archivedAt", "createdAt", "updatedAt" FROM "KanbanColumn" WHERE "projectId" = $1 AND "archivedAt" IS NOT NULL ORDER BY "updatedAt" DESC', [projectId]);
    return result.rows;
}
async function listArchivedCards(projectId) {
    const result = await pool_1.pool.query('SELECT id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt", priority, "startDate", "dueDate", "completedAt", "archivedAt", "parentId" FROM "KanbanCard" WHERE "projectId" = $1 AND "archivedAt" IS NOT NULL ORDER BY "updatedAt" DESC', [projectId]);
    return result.rows;
}
async function reorderColumns(projectId, orderedIds) {
    return (0, pool_1.withTransaction)(async (client) => {
        var _a;
        for (let index = 0; index < orderedIds.length; index += 1) {
            const columnId = (_a = orderedIds[index]) !== null && _a !== void 0 ? _a : '';
            if (!columnId)
                continue;
            await client.query('UPDATE "KanbanColumn" SET position = $2, "updatedAt" = NOW() WHERE id = $1 AND "projectId" = $3', [columnId, index, projectId]);
        }
    });
}
async function reorderCards(columnId, orderedIds) {
    return (0, pool_1.withTransaction)(async (client) => {
        var _a;
        for (let index = 0; index < orderedIds.length; index += 1) {
            const cardId = (_a = orderedIds[index]) !== null && _a !== void 0 ? _a : '';
            if (!cardId)
                continue;
            await client.query('UPDATE "KanbanCard" SET position = $2, "updatedAt" = NOW() WHERE id = $1 AND "columnId" = $3', [cardId, index, columnId]);
        }
    });
}
//# sourceMappingURL=kanbanService.js.map
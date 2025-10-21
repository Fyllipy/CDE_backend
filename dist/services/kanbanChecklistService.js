"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChecklistsByCardId = getChecklistsByCardId;
exports.createChecklist = createChecklist;
exports.updateChecklist = updateChecklist;
exports.deleteChecklist = deleteChecklist;
exports.reorderChecklists = reorderChecklists;
exports.createChecklistItem = createChecklistItem;
exports.updateChecklistItem = updateChecklistItem;
exports.deleteChecklistItem = deleteChecklistItem;
exports.reorderChecklistItems = reorderChecklistItems;
const pool_1 = require("../db/pool");
async function getChecklistsByCardId(cardId) {
    var _a;
    const [checklistsResult, itemsResult] = await Promise.all([
        pool_1.pool.query('SELECT id, "cardId", title, position, "createdAt", "updatedAt" FROM "KanbanChecklist" WHERE "cardId" = $1 ORDER BY position ASC', [cardId]),
        pool_1.pool.query('SELECT id, "checklistId", title, position, "doneAt", "assigneeId", "dueDate", "createdAt", "updatedAt" FROM "KanbanChecklistItem" WHERE "checklistId" IN (SELECT id FROM "KanbanChecklist" WHERE "cardId" = $1) ORDER BY position ASC', [cardId]),
    ]);
    const itemsByChecklist = new Map();
    for (const item of itemsResult.rows) {
        const list = (_a = itemsByChecklist.get(item.checklistId)) !== null && _a !== void 0 ? _a : [];
        list.push(item);
        itemsByChecklist.set(item.checklistId, list);
    }
    return checklistsResult.rows.map((checklist) => {
        var _a;
        return ({
            ...checklist,
            items: (_a = itemsByChecklist.get(checklist.id)) !== null && _a !== void 0 ? _a : [],
        });
    });
}
async function createChecklist(cardId, title) {
    return (0, pool_1.withTransaction)(async (client) => {
        var _a, _b;
        const positionResult = await client.query('SELECT MAX(position) AS max FROM "KanbanChecklist" WHERE "cardId" = $1', [cardId]);
        const nextPosition = ((_b = (_a = positionResult.rows[0]) === null || _a === void 0 ? void 0 : _a.max) !== null && _b !== void 0 ? _b : -1) + 1;
        const result = await client.query('INSERT INTO "KanbanChecklist" ("cardId", title, position) VALUES ($1, $2, $3) RETURNING id, "cardId", title, position, "createdAt", "updatedAt"', [cardId, title, nextPosition]);
        const checklist = result.rows[0];
        if (!checklist) {
            throw new Error("Unable to create checklist");
        }
        return checklist;
    });
}
async function updateChecklist(checklistId, updates) {
    const result = await pool_1.pool.query('UPDATE "KanbanChecklist" SET title = COALESCE($2, title), "updatedAt" = NOW() WHERE id = $1 RETURNING id, "cardId", title, position, "createdAt", "updatedAt"', [checklistId, updates.title]);
    return result.rows[0];
}
async function deleteChecklist(checklistId) {
    await pool_1.pool.query('DELETE FROM "KanbanChecklist" WHERE id = $1', [checklistId]);
}
async function reorderChecklists(cardId, orderedIds) {
    await (0, pool_1.withTransaction)(async (client) => {
        for (let index = 0; index < orderedIds.length; index += 1) {
            const checklistId = orderedIds[index];
            if (!checklistId) {
                continue;
            }
            await client.query('UPDATE "KanbanChecklist" SET position = $2, "updatedAt" = NOW() WHERE id = $1 AND "cardId" = $3', [checklistId, index, cardId]);
        }
    });
}
async function createChecklistItem(checklistId, title) {
    return (0, pool_1.withTransaction)(async (client) => {
        var _a, _b;
        const positionResult = await client.query('SELECT MAX(position) AS max FROM "KanbanChecklistItem" WHERE "checklistId" = $1', [checklistId]);
        const nextPosition = ((_b = (_a = positionResult.rows[0]) === null || _a === void 0 ? void 0 : _a.max) !== null && _b !== void 0 ? _b : -1) + 1;
        const result = await client.query('INSERT INTO "KanbanChecklistItem" ("checklistId", title, position) VALUES ($1, $2, $3) RETURNING id, "checklistId", title, position, "doneAt", "assigneeId", "dueDate", "createdAt", "updatedAt"', [checklistId, title, nextPosition]);
        const item = result.rows[0];
        if (!item) {
            throw new Error("Unable to create checklist item");
        }
        return item;
    });
}
async function updateChecklistItem(itemId, updates) {
    var _a, _b, _c;
    const result = await pool_1.pool.query('UPDATE "KanbanChecklistItem" SET title = COALESCE($2, title), "doneAt" = $3, "assigneeId" = $4, "dueDate" = $5, "updatedAt" = NOW() WHERE id = $1 RETURNING id, "checklistId", title, position, "doneAt", "assigneeId", "dueDate", "createdAt", "updatedAt"', [itemId, updates.title, (_a = updates.doneAt) !== null && _a !== void 0 ? _a : null, (_b = updates.assigneeId) !== null && _b !== void 0 ? _b : null, (_c = updates.dueDate) !== null && _c !== void 0 ? _c : null]);
    return result.rows[0];
}
async function deleteChecklistItem(itemId) {
    await pool_1.pool.query('DELETE FROM "KanbanChecklistItem" WHERE id = $1', [itemId]);
}
async function reorderChecklistItems(checklistId, orderedIds) {
    await (0, pool_1.withTransaction)(async (client) => {
        for (let index = 0; index < orderedIds.length; index += 1) {
            const itemId = orderedIds[index];
            if (!itemId) {
                continue;
            }
            await client.query('UPDATE "KanbanChecklistItem" SET position = $2, "updatedAt" = NOW() WHERE id = $1 AND "checklistId" = $3', [itemId, index, checklistId]);
        }
    });
}
//# sourceMappingURL=kanbanChecklistService.js.map
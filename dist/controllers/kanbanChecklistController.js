"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChecklistHandler = createChecklistHandler;
exports.updateChecklistHandler = updateChecklistHandler;
exports.deleteChecklistHandler = deleteChecklistHandler;
exports.reorderChecklistsHandler = reorderChecklistsHandler;
exports.createChecklistItemHandler = createChecklistItemHandler;
exports.updateChecklistItemHandler = updateChecklistItemHandler;
exports.deleteChecklistItemHandler = deleteChecklistItemHandler;
exports.reorderChecklistItemsHandler = reorderChecklistItemsHandler;
exports.promoteChecklistItemHandler = promoteChecklistItemHandler;
const pool_1 = require("../db/pool");
const kanbanChecklistService_1 = require("../services/kanbanChecklistService");
const kanbanService_1 = require("../services/kanbanService");
async function getCardProject(cardId) {
    var _a, _b;
    const result = await pool_1.pool.query('SELECT "projectId" FROM "KanbanCard" WHERE id = $1', [cardId]);
    return (_b = (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.projectId) !== null && _b !== void 0 ? _b : null;
}
async function getChecklistContext(checklistId) {
    const result = await pool_1.pool.query(`SELECT c."cardId" AS "cardId", card."projectId" AS "projectId"
       FROM "KanbanChecklist" c
       JOIN "KanbanCard" card ON card.id = c."cardId"
      WHERE c.id = $1`, [checklistId]);
    const row = result.rows[0];
    return row ? { cardId: row.cardId, projectId: row.projectId } : null;
}
async function getChecklistItemContext(itemId) {
    const result = await pool_1.pool.query(`SELECT i."checklistId" AS "checklistId",
            c."cardId" AS "cardId",
            card."projectId" AS "projectId"
       FROM "KanbanChecklistItem" i
       JOIN "KanbanChecklist" c ON c.id = i."checklistId"
       JOIN "KanbanCard" card ON card.id = c."cardId"
      WHERE i.id = $1`, [itemId]);
    const row = result.rows[0];
    return row ? { checklistId: row.checklistId, cardId: row.cardId, projectId: row.projectId } : null;
}
async function createChecklistHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const cardId = (_b = req.params.cardId) !== null && _b !== void 0 ? _b : "";
    const { title } = req.body;
    if (!(title === null || title === void 0 ? void 0 : title.trim())) {
        return res.status(400).json({ message: "Checklist title is required" });
    }
    const cardProject = await getCardProject(cardId);
    if (!cardProject || cardProject !== projectId) {
        return res.status(404).json({ message: "Card not found" });
    }
    try {
        const checklist = await (0, kanbanChecklistService_1.createChecklist)(cardId, title.trim());
        return res.status(201).json({ checklist });
    }
    catch (error) {
        return res.status(500).json({ message: "Error creating checklist" });
    }
}
async function updateChecklistHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const checklistId = (_b = req.params.checklistId) !== null && _b !== void 0 ? _b : "";
    const { title } = req.body;
    const context = await getChecklistContext(checklistId);
    if (!context || context.projectId !== projectId) {
        return res.status(404).json({ message: "Checklist not found" });
    }
    if (!(title === null || title === void 0 ? void 0 : title.trim())) {
        return res.status(400).json({ message: "Nothing to update" });
    }
    try {
        const checklist = await (0, kanbanChecklistService_1.updateChecklist)(checklistId, { title: title.trim() });
        return res.json({ checklist });
    }
    catch (error) {
        return res.status(500).json({ message: "Error updating checklist" });
    }
}
async function deleteChecklistHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const checklistId = (_b = req.params.checklistId) !== null && _b !== void 0 ? _b : "";
    const context = await getChecklistContext(checklistId);
    if (!context || context.projectId !== projectId) {
        return res.status(404).json({ message: "Checklist not found" });
    }
    try {
        await (0, kanbanChecklistService_1.deleteChecklist)(checklistId);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error deleting checklist" });
    }
}
async function reorderChecklistsHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const cardId = (_b = req.params.cardId) !== null && _b !== void 0 ? _b : "";
    const { orderedIds } = req.body;
    const cardProject = await getCardProject(cardId);
    if (!cardProject || cardProject !== projectId) {
        return res.status(404).json({ message: "Card not found" });
    }
    try {
        await (0, kanbanChecklistService_1.reorderChecklists)(cardId, orderedIds);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error reordering checklists" });
    }
}
async function createChecklistItemHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const checklistId = (_b = req.params.checklistId) !== null && _b !== void 0 ? _b : "";
    const { title } = req.body;
    const context = await getChecklistContext(checklistId);
    if (!context || context.projectId !== projectId) {
        return res.status(404).json({ message: "Checklist not found" });
    }
    if (!(title === null || title === void 0 ? void 0 : title.trim())) {
        return res.status(400).json({ message: "Checklist item title is required" });
    }
    try {
        const item = await (0, kanbanChecklistService_1.createChecklistItem)(checklistId, title.trim());
        return res.status(201).json({ item });
    }
    catch (error) {
        return res.status(500).json({ message: "Error creating checklist item" });
    }
}
async function updateChecklistItemHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const itemId = (_b = req.params.itemId) !== null && _b !== void 0 ? _b : "";
    const { title, doneAt, assigneeId, dueDate } = req.body;
    const context = await getChecklistItemContext(itemId);
    if (!context || context.projectId !== projectId) {
        return res.status(404).json({ message: "Checklist item not found" });
    }
    if (title !== undefined && !title.trim()) {
        return res.status(400).json({ message: "Title cannot be empty" });
    }
    try {
        const item = await (0, kanbanChecklistService_1.updateChecklistItem)(itemId, {
            title: title === null || title === void 0 ? void 0 : title.trim(),
            doneAt: doneAt !== null && doneAt !== void 0 ? doneAt : null,
            assigneeId: assigneeId !== null && assigneeId !== void 0 ? assigneeId : null,
            dueDate: dueDate !== null && dueDate !== void 0 ? dueDate : null,
        });
        return res.json({ item });
    }
    catch (error) {
        return res.status(500).json({ message: "Error updating checklist item" });
    }
}
async function deleteChecklistItemHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const itemId = (_b = req.params.itemId) !== null && _b !== void 0 ? _b : "";
    const context = await getChecklistItemContext(itemId);
    if (!context || context.projectId !== projectId) {
        return res.status(404).json({ message: "Checklist item not found" });
    }
    try {
        await (0, kanbanChecklistService_1.deleteChecklistItem)(itemId);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error deleting checklist item" });
    }
}
async function reorderChecklistItemsHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const checklistId = (_b = req.params.checklistId) !== null && _b !== void 0 ? _b : "";
    const { orderedIds } = req.body;
    const context = await getChecklistContext(checklistId);
    if (!context || context.projectId !== projectId) {
        return res.status(404).json({ message: "Checklist not found" });
    }
    try {
        await (0, kanbanChecklistService_1.reorderChecklistItems)(checklistId, orderedIds);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error reordering checklist items" });
    }
}
async function promoteChecklistItemHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const itemId = (_b = req.params.itemId) !== null && _b !== void 0 ? _b : "";
    const context = await getChecklistItemContext(itemId);
    if (!context || context.projectId !== projectId) {
        return res.status(404).json({ message: "Checklist item not found" });
    }
    try {
        const card = await (0, kanbanService_1.promoteChecklistItemToSubtask)(itemId);
        return res.status(201).json({ card });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'WIP_LIMIT_EXCEEDED') {
            return res.status(409).json({ message: "Destination column is at WIP limit" });
        }
        return res.status(500).json({ message: "Error promoting checklist item" });
    }
}
//# sourceMappingURL=kanbanChecklistController.js.map
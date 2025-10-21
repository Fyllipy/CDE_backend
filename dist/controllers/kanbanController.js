"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoard = getBoard;
exports.createColumnHandler = createColumnHandler;
exports.updateColumnHandler = updateColumnHandler;
exports.deleteColumnHandler = deleteColumnHandler;
exports.createCardHandler = createCardHandler;
exports.updateCardHandler = updateCardHandler;
exports.deleteCardHandler = deleteCardHandler;
exports.moveCardHandler = moveCardHandler;
exports.reorderColumnsHandler = reorderColumnsHandler;
exports.reorderCardsHandler = reorderCardsHandler;
exports.getCardHandler = getCardHandler;
exports.archiveCardHandler = archiveCardHandler;
exports.restoreCardHandler = restoreCardHandler;
exports.archiveColumnHandler = archiveColumnHandler;
exports.restoreColumnHandler = restoreColumnHandler;
exports.bulkArchiveCardsHandler = bulkArchiveCardsHandler;
exports.bulkRestoreCardsHandler = bulkRestoreCardsHandler;
exports.bulkMoveCardsHandler = bulkMoveCardsHandler;
exports.bulkAssignCardsHandler = bulkAssignCardsHandler;
exports.bulkLabelCardsHandler = bulkLabelCardsHandler;
const pool_1 = require("../db/pool");
const kanbanService_1 = require("../services/kanbanService");
function isManager(req) {
    var _a, _b;
    const role = (_b = (_a = req.projectMembership) === null || _a === void 0 ? void 0 : _a.role) === null || _b === void 0 ? void 0 : _b.trim().toUpperCase();
    return role === "MANAGER";
}
async function cardBelongsToProject(cardId, projectId) {
    var _a, _b;
    if (!cardId || !projectId) {
        return false;
    }
    const result = await pool_1.pool.query('SELECT "projectId" FROM "KanbanCard" WHERE id = $1', [cardId]);
    return ((_b = (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.projectId) !== null && _b !== void 0 ? _b : null) === projectId;
}
async function columnBelongsToProject(columnId, projectId) {
    var _a, _b;
    if (!columnId || !projectId) {
        return false;
    }
    const result = await pool_1.pool.query('SELECT "projectId" FROM "KanbanColumn" WHERE id = $1', [columnId]);
    return ((_b = (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.projectId) !== null && _b !== void 0 ? _b : null) === projectId;
}
async function labelBelongsToProject(labelId, projectId) {
    var _a, _b;
    if (!labelId || !projectId) {
        return false;
    }
    const result = await pool_1.pool.query('SELECT "projectId" FROM "KanbanLabel" WHERE id = $1', [labelId]);
    return ((_b = (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.projectId) !== null && _b !== void 0 ? _b : null) === projectId;
}
async function userBelongsToProject(userId, projectId) {
    var _a;
    if (!userId || !projectId) {
        return false;
    }
    const result = await pool_1.pool.query('SELECT EXISTS(SELECT 1 FROM "ProjectMembership" WHERE "projectId" = $1 AND "userId" = $2) AS exists', [projectId, userId]);
    return Boolean((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.exists);
}
async function getBoard(req, res) {
    var _a;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const { getLabelsByProjectId } = require('../services/kanbanLabelService');
    const [board, labels, archivedColumns, archivedCards] = await Promise.all([
        (0, kanbanService_1.listBoard)(projectId),
        getLabelsByProjectId(projectId),
        (0, kanbanService_1.listArchivedColumns)(projectId),
        (0, kanbanService_1.listArchivedCards)(projectId),
    ]);
    return res.json({ board, labels, archivedColumns, archivedCards });
}
// export async function getCardHandler(req: Request, res: Response) {
//   const cardId = req.params.cardId ?? "";
//   const card = await getCard(cardId);
//   if (!card) {
//     return res.status(404).json({ message: "Card not found" });
//   }
//   if (card.projectId !== req.params.projectId) {
//     return res.status(403).json({ message: "Forbidden: Card does not belong to this project" });
//   }
//   return res.json({ card });
// }
async function createColumnHandler(req, res) {
    var _a;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const { name, color } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Column name is required" });
    }
    const column = await (0, kanbanService_1.createColumn)(projectId, name, color);
    return res.status(201).json({ column });
}
async function updateColumnHandler(req, res) {
    var _a;
    const columnId = (_a = req.params.columnId) !== null && _a !== void 0 ? _a : "";
    const { name, color, wipLimit, archivedAt } = req.body;
    if (!name && !color && wipLimit === undefined && archivedAt === undefined) {
        return res.status(400).json({ message: "Nothing to update" });
    }
    const column = await (0, kanbanService_1.updateColumn)(columnId, {
        name,
        color,
        wipLimit,
        archivedAt,
    });
    return res.json({ column });
}
async function deleteColumnHandler(req, res) {
    var _a;
    const columnId = (_a = req.params.columnId) !== null && _a !== void 0 ? _a : "";
    await (0, kanbanService_1.deleteColumn)(columnId);
    return res.status(204).send();
}
async function createCardHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const columnId = (_b = req.params.columnId) !== null && _b !== void 0 ? _b : "";
    const { title, description } = req.body;
    if (!title) {
        return res.status(400).json({ message: "Title is required" });
    }
    const card = await (0, kanbanService_1.createCard)(columnId, projectId, title, description !== null && description !== void 0 ? description : null);
    return res.status(201).json({ card });
}
async function updateCardHandler(req, res) {
    var _a;
    const cardId = (_a = req.params.cardId) !== null && _a !== void 0 ? _a : "";
    const { title, description, priority, startDate, dueDate, completedAt } = req.body;
    const card = await (0, kanbanService_1.updateCard)(cardId, {
        title,
        description: description !== null && description !== void 0 ? description : null,
        priority,
        startDate,
        dueDate,
        completedAt,
    });
    return res.json({ card });
}
async function deleteCardHandler(req, res) {
    var _a;
    const cardId = (_a = req.params.cardId) !== null && _a !== void 0 ? _a : "";
    await (0, kanbanService_1.deleteCard)(cardId);
    return res.status(204).send();
}
async function moveCardHandler(req, res) {
    var _a;
    const cardId = (_a = req.params.cardId) !== null && _a !== void 0 ? _a : "";
    const { toColumnId, position } = req.body;
    await (0, kanbanService_1.moveCard)(cardId, toColumnId, position);
    return res.status(204).send();
}
async function reorderColumnsHandler(req, res) {
    var _a;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const { orderedIds } = req.body;
    await (0, kanbanService_1.reorderColumns)(projectId, orderedIds);
    return res.status(204).send();
}
async function reorderCardsHandler(req, res) {
    var _a;
    const columnId = (_a = req.params.columnId) !== null && _a !== void 0 ? _a : "";
    const { orderedIds } = req.body;
    await (0, kanbanService_1.reorderCards)(columnId, orderedIds);
    return res.status(204).send();
}
async function getCardHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const cardId = (_b = req.params.cardId) !== null && _b !== void 0 ? _b : "";
    if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
    }
    if (!cardId) {
        return res.status(400).json({ message: "Card ID is required" });
    }
    try {
        const card = await (0, kanbanService_1.getCardDetails)(cardId);
        if (!card) {
            return res.status(404).json({ message: "Card not found" });
        }
        if (card.projectId !== projectId) {
            return res.status(403).json({ message: "Card does not belong to this project" });
        }
        return res.json({ card });
    }
    catch (error) {
        console.error('Error in getCardHandler:', error);
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
async function archiveCardHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const cardId = (_b = req.params.cardId) !== null && _b !== void 0 ? _b : "";
    if (!await cardBelongsToProject(cardId, projectId)) {
        return res.status(404).json({ message: "Card not found" });
    }
    try {
        await (0, kanbanService_1.archiveCard)(cardId);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error archiving card" });
    }
}
async function restoreCardHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const cardId = (_b = req.params.cardId) !== null && _b !== void 0 ? _b : "";
    if (!await cardBelongsToProject(cardId, projectId)) {
        return res.status(404).json({ message: "Card not found" });
    }
    try {
        await (0, kanbanService_1.restoreCard)(cardId);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error restoring card" });
    }
}
async function archiveColumnHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const columnId = (_b = req.params.columnId) !== null && _b !== void 0 ? _b : "";
    const authReq = req;
    if (!isManager(authReq)) {
        return res.status(403).json({ message: "Only project managers can archive columns" });
    }
    if (!await columnBelongsToProject(columnId, projectId)) {
        return res.status(404).json({ message: "Column not found" });
    }
    try {
        await (0, kanbanService_1.archiveColumn)(columnId);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error archiving column" });
    }
}
async function restoreColumnHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const columnId = (_b = req.params.columnId) !== null && _b !== void 0 ? _b : "";
    const authReq = req;
    if (!isManager(authReq)) {
        return res.status(403).json({ message: "Only project managers can restore columns" });
    }
    if (!await columnBelongsToProject(columnId, projectId)) {
        return res.status(404).json({ message: "Column not found" });
    }
    try {
        await (0, kanbanService_1.restoreColumn)(columnId);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error restoring column" });
    }
}
async function bulkArchiveCardsHandler(req, res) {
    var _a;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const { cardIds } = req.body;
    const authReq = req;
    if (!Array.isArray(cardIds) || cardIds.length === 0) {
        return res.status(400).json({ message: "cardIds is required" });
    }
    if (!isManager(authReq)) {
        return res.status(403).json({ message: "Only project managers can run bulk actions" });
    }
    const cardsResult = await pool_1.pool.query('SELECT id FROM "KanbanCard" WHERE id = ANY($1::uuid[]) AND "projectId" = $2', [cardIds, projectId]);
    if (cardsResult.rows.length !== cardIds.length) {
        return res.status(404).json({ message: "One or more cards not found" });
    }
    try {
        await (0, kanbanService_1.bulkArchiveCards)(cardIds);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error archiving cards" });
    }
}
async function bulkRestoreCardsHandler(req, res) {
    var _a;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const { cardIds } = req.body;
    const authReq = req;
    if (!Array.isArray(cardIds) || cardIds.length === 0) {
        return res.status(400).json({ message: "cardIds is required" });
    }
    if (!isManager(authReq)) {
        return res.status(403).json({ message: "Only project managers can run bulk actions" });
    }
    const cardsResult = await pool_1.pool.query('SELECT id FROM "KanbanCard" WHERE id = ANY($1::uuid[]) AND "projectId" = $2', [cardIds, projectId]);
    if (cardsResult.rows.length !== cardIds.length) {
        return res.status(404).json({ message: "One or more cards not found" });
    }
    try {
        await (0, kanbanService_1.bulkRestoreCards)(cardIds);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error restoring cards" });
    }
}
async function bulkMoveCardsHandler(req, res) {
    var _a;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const { cardIds, toColumnId } = req.body;
    const authReq = req;
    if (!Array.isArray(cardIds) || cardIds.length === 0 || !toColumnId) {
        return res.status(400).json({ message: "cardIds and toColumnId are required" });
    }
    if (!isManager(authReq)) {
        return res.status(403).json({ message: "Only project managers can run bulk actions" });
    }
    const cardsResult = await pool_1.pool.query('SELECT id FROM "KanbanCard" WHERE id = ANY($1::uuid[]) AND "projectId" = $2', [cardIds, projectId]);
    if (cardsResult.rows.length !== cardIds.length) {
        return res.status(404).json({ message: "One or more cards not found" });
    }
    if (!await columnBelongsToProject(toColumnId, projectId)) {
        return res.status(404).json({ message: "Target column not found" });
    }
    try {
        await (0, kanbanService_1.bulkMoveCards)(cardIds, toColumnId);
        return res.status(204).send();
    }
    catch (error) {
        if (error instanceof Error && error.message === 'WIP_LIMIT_EXCEEDED') {
            return res.status(409).json({ message: "Destination column is at WIP limit" });
        }
        return res.status(500).json({ message: "Error moving cards" });
    }
}
async function bulkAssignCardsHandler(req, res) {
    var _a;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const { cardIds, userId, action } = req.body;
    const authReq = req;
    if (!Array.isArray(cardIds) || cardIds.length === 0 || !userId || !action) {
        return res.status(400).json({ message: "cardIds, userId and action are required" });
    }
    if (!isManager(authReq)) {
        return res.status(403).json({ message: "Only project managers can run bulk actions" });
    }
    if (!await userBelongsToProject(userId, projectId)) {
        return res.status(404).json({ message: "User not part of project" });
    }
    const cardsResult = await pool_1.pool.query('SELECT id FROM "KanbanCard" WHERE id = ANY($1::uuid[]) AND "projectId" = $2', [cardIds, projectId]);
    if (cardsResult.rows.length !== cardIds.length) {
        return res.status(404).json({ message: "One or more cards not found" });
    }
    try {
        await (0, kanbanService_1.bulkAssignCards)(cardIds, userId, action);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error assigning cards" });
    }
}
async function bulkLabelCardsHandler(req, res) {
    var _a;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const { cardIds, labelId, action } = req.body;
    const authReq = req;
    if (!Array.isArray(cardIds) || cardIds.length === 0 || !labelId || !action) {
        return res.status(400).json({ message: "cardIds, labelId and action are required" });
    }
    if (!isManager(authReq)) {
        return res.status(403).json({ message: "Only project managers can run bulk actions" });
    }
    if (!await labelBelongsToProject(labelId, projectId)) {
        return res.status(404).json({ message: "Label not found" });
    }
    const cardsResult = await pool_1.pool.query('SELECT id FROM "KanbanCard" WHERE id = ANY($1::uuid[]) AND "projectId" = $2', [cardIds, projectId]);
    if (cardsResult.rows.length !== cardIds.length) {
        return res.status(404).json({ message: "One or more cards not found" });
    }
    try {
        await (0, kanbanService_1.bulkLabelCards)(cardIds, labelId, action);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error updating card labels" });
    }
}
//# sourceMappingURL=kanbanController.js.map
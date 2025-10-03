"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoard = getBoard;
exports.createColumnHandler = createColumnHandler;
exports.renameColumnHandler = renameColumnHandler;
exports.deleteColumnHandler = deleteColumnHandler;
exports.createCardHandler = createCardHandler;
exports.updateCardHandler = updateCardHandler;
exports.deleteCardHandler = deleteCardHandler;
exports.moveCardHandler = moveCardHandler;
exports.reorderColumnsHandler = reorderColumnsHandler;
exports.reorderCardsHandler = reorderCardsHandler;
const kanbanService_1 = require("../services/kanbanService");
const projectService_1 = require("../services/projectService");
function getAuthUser(req) {
    return req.user;
}
async function ensureMember(projectId, userId) {
    const membership = await (0, projectService_1.getMembership)(projectId, userId);
    return Boolean(membership);
}
async function getBoard(req, res) {
    var _a;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId) {
        return res.status(400).json({ message: "Project id is required" });
    }
    const isMember = await ensureMember(projectId, user.id);
    if (!isMember) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const board = await (0, kanbanService_1.listBoard)(projectId);
    return res.json({ board });
}
async function createColumnHandler(req, res) {
    var _a;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const { name, color } = req.body;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId) {
        return res.status(400).json({ message: "Project id is required" });
    }
    const isMember = await ensureMember(projectId, user.id);
    if (!isMember) {
        return res.status(403).json({ message: "Forbidden" });
    }
    if (!name) {
        return res.status(400).json({ message: "Column name is required" });
    }
    const column = await (0, kanbanService_1.createColumn)(projectId, name, color);
    return res.status(201).json({ column });
}
async function renameColumnHandler(req, res) {
    var _a, _b;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const columnId = (_b = req.params.columnId) !== null && _b !== void 0 ? _b : '';
    const { name, color } = req.body;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId || !columnId) {
        return res.status(400).json({ message: "Identifiers are required" });
    }
    if (!name && !color) {
        return res.status(400).json({ message: "Nothing to update" });
    }
    const isMember = await ensureMember(projectId, user.id);
    if (!isMember) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const column = await (0, kanbanService_1.updateColumn)(columnId, { name, color });
    return res.json({ column });
}
async function deleteColumnHandler(req, res) {
    var _a, _b;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const columnId = (_b = req.params.columnId) !== null && _b !== void 0 ? _b : '';
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId || !columnId) {
        return res.status(400).json({ message: "Identifiers are required" });
    }
    const isMember = await ensureMember(projectId, user.id);
    if (!isMember) {
        return res.status(403).json({ message: "Forbidden" });
    }
    await (0, kanbanService_1.deleteColumn)(columnId);
    return res.status(204).send();
}
async function createCardHandler(req, res) {
    var _a, _b;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const columnId = (_b = req.params.columnId) !== null && _b !== void 0 ? _b : '';
    const { title, description, color } = req.body;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId || !columnId) {
        return res.status(400).json({ message: "Identifiers are required" });
    }
    const isMember = await ensureMember(projectId, user.id);
    if (!isMember) {
        return res.status(403).json({ message: "Forbidden" });
    }
    if (!title) {
        return res.status(400).json({ message: "Title is required" });
    }
    const card = await (0, kanbanService_1.createCard)(columnId, projectId, title, description !== null && description !== void 0 ? description : null, color !== null && color !== void 0 ? color : null);
    return res.status(201).json({ card });
}
async function updateCardHandler(req, res) {
    var _a, _b;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const cardId = (_b = req.params.cardId) !== null && _b !== void 0 ? _b : '';
    const { title, description, color } = req.body;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId || !cardId) {
        return res.status(400).json({ message: "Identifiers are required" });
    }
    const isMember = await ensureMember(projectId, user.id);
    if (!isMember) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const card = await (0, kanbanService_1.updateCard)(cardId, { title, description: description !== null && description !== void 0 ? description : null, color: color !== null && color !== void 0 ? color : null });
    return res.json({ card });
}
async function deleteCardHandler(req, res) {
    var _a, _b;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const cardId = (_b = req.params.cardId) !== null && _b !== void 0 ? _b : '';
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId || !cardId) {
        return res.status(400).json({ message: "Identifiers are required" });
    }
    const isMember = await ensureMember(projectId, user.id);
    if (!isMember) {
        return res.status(403).json({ message: "Forbidden" });
    }
    await (0, kanbanService_1.deleteCard)(cardId);
    return res.status(204).send();
}
async function moveCardHandler(req, res) {
    var _a, _b;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const cardId = (_b = req.params.cardId) !== null && _b !== void 0 ? _b : '';
    const { toColumnId, position } = req.body;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId || !cardId || !toColumnId) {
        return res.status(400).json({ message: "Identifiers are required" });
    }
    const isMember = await ensureMember(projectId, user.id);
    if (!isMember) {
        return res.status(403).json({ message: "Forbidden" });
    }
    await (0, kanbanService_1.moveCard)(cardId, toColumnId, position);
    return res.status(204).send();
}
async function reorderColumnsHandler(req, res) {
    var _a;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const { orderedIds } = req.body;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId) {
        return res.status(400).json({ message: "Project id is required" });
    }
    const isMember = await ensureMember(projectId, user.id);
    if (!isMember) {
        return res.status(403).json({ message: "Forbidden" });
    }
    await (0, kanbanService_1.reorderColumns)(projectId, orderedIds);
    return res.status(204).send();
}
async function reorderCardsHandler(req, res) {
    var _a, _b;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const columnId = (_b = req.params.columnId) !== null && _b !== void 0 ? _b : '';
    const { orderedIds } = req.body;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId || !columnId) {
        return res.status(400).json({ message: "Identifiers are required" });
    }
    const isMember = await ensureMember(projectId, user.id);
    if (!isMember) {
        return res.status(403).json({ message: "Forbidden" });
    }
    await (0, kanbanService_1.reorderCards)(columnId, orderedIds);
    return res.status(204).send();
}
//# sourceMappingURL=kanbanController.js.map
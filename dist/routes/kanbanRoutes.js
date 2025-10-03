"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kanbanRouter = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const kanbanController_1 = require("../controllers/kanbanController");
exports.kanbanRouter = (0, express_1.Router)();
exports.kanbanRouter.use(authMiddleware_1.requireAuth);
exports.kanbanRouter.get("/:projectId/kanban", kanbanController_1.getBoard);
exports.kanbanRouter.post("/:projectId/kanban/columns", kanbanController_1.createColumnHandler);
exports.kanbanRouter.put("/:projectId/kanban/columns/:columnId", kanbanController_1.renameColumnHandler);
exports.kanbanRouter.delete("/:projectId/kanban/columns/:columnId", kanbanController_1.deleteColumnHandler);
exports.kanbanRouter.post("/:projectId/kanban/columns/:columnId/cards", kanbanController_1.createCardHandler);
exports.kanbanRouter.put("/:projectId/kanban/cards/:cardId", kanbanController_1.updateCardHandler);
exports.kanbanRouter.delete("/:projectId/kanban/cards/:cardId", kanbanController_1.deleteCardHandler);
exports.kanbanRouter.post("/:projectId/kanban/cards/:cardId/move", kanbanController_1.moveCardHandler);
exports.kanbanRouter.post("/:projectId/kanban/columns/reorder", kanbanController_1.reorderColumnsHandler);
exports.kanbanRouter.post("/:projectId/kanban/columns/:columnId/reorder-cards", kanbanController_1.reorderCardsHandler);
//# sourceMappingURL=kanbanRoutes.js.map
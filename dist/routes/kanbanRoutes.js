"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kanbanRouter = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const kanbanController_1 = require("../controllers/kanbanController");
const kanbanAssigneeController_1 = require("../controllers/kanbanAssigneeController");
const kanbanLabelController_1 = require("../controllers/kanbanLabelController");
const kanbanCommentController_1 = require("../controllers/kanbanCommentController");
const kanbanActivityController_1 = require("../controllers/kanbanActivityController");
const kanbanChecklistController_1 = require("../controllers/kanbanChecklistController");
const kanbanCustomFieldController_1 = require("../controllers/kanbanCustomFieldController");
const authUtils_1 = require("../middleware/authUtils");
exports.kanbanRouter = (0, express_1.Router)({ mergeParams: true });
// CRÍTICO: Adiciona os middlewares na ordem correta
exports.kanbanRouter.use(authMiddleware_1.requireAuth);
exports.kanbanRouter.use(authUtils_1.ensureProjectMember); // ✅ ADICIONE ESTA LINHA
// Board and Column routes
exports.kanbanRouter.get("/", kanbanController_1.getBoard);
exports.kanbanRouter.post("/columns", kanbanController_1.createColumnHandler);
exports.kanbanRouter.put("/columns/:columnId", kanbanController_1.updateColumnHandler);
exports.kanbanRouter.delete("/columns/:columnId", kanbanController_1.deleteColumnHandler);
exports.kanbanRouter.post("/columns/reorder", kanbanController_1.reorderColumnsHandler);
exports.kanbanRouter.post("/columns/:columnId/archive", kanbanController_1.archiveColumnHandler);
exports.kanbanRouter.post("/columns/:columnId/restore", kanbanController_1.restoreColumnHandler);
// Card routes
exports.kanbanRouter.post("/columns/:columnId/cards", kanbanController_1.createCardHandler);
exports.kanbanRouter.put("/cards/:cardId", kanbanController_1.updateCardHandler);
exports.kanbanRouter.get("/cards/:cardId", kanbanController_1.getCardHandler);
exports.kanbanRouter.delete("/cards/:cardId", kanbanController_1.deleteCardHandler);
exports.kanbanRouter.post("/cards/:cardId/move", kanbanController_1.moveCardHandler);
exports.kanbanRouter.post("/columns/:columnId/reorder-cards", kanbanController_1.reorderCardsHandler);
exports.kanbanRouter.post("/cards/:cardId/archive", kanbanController_1.archiveCardHandler);
exports.kanbanRouter.post("/cards/:cardId/restore", kanbanController_1.restoreCardHandler);
// Checklist routes
exports.kanbanRouter.post("/cards/:cardId/checklists", kanbanChecklistController_1.createChecklistHandler);
exports.kanbanRouter.post("/cards/:cardId/checklists/reorder", kanbanChecklistController_1.reorderChecklistsHandler);
exports.kanbanRouter.put("/checklists/:checklistId", kanbanChecklistController_1.updateChecklistHandler);
exports.kanbanRouter.delete("/checklists/:checklistId", kanbanChecklistController_1.deleteChecklistHandler);
exports.kanbanRouter.post("/checklists/:checklistId/items", kanbanChecklistController_1.createChecklistItemHandler);
exports.kanbanRouter.post("/checklists/:checklistId/reorder", kanbanChecklistController_1.reorderChecklistItemsHandler);
exports.kanbanRouter.put("/checklist-items/:itemId", kanbanChecklistController_1.updateChecklistItemHandler);
exports.kanbanRouter.delete("/checklist-items/:itemId", kanbanChecklistController_1.deleteChecklistItemHandler);
exports.kanbanRouter.post("/checklist-items/:itemId/promote", kanbanChecklistController_1.promoteChecklistItemHandler);
// Bulk routes
exports.kanbanRouter.post("/cards/bulk/archive", kanbanController_1.bulkArchiveCardsHandler);
exports.kanbanRouter.post("/cards/bulk/restore", kanbanController_1.bulkRestoreCardsHandler);
exports.kanbanRouter.post("/cards/bulk/move", kanbanController_1.bulkMoveCardsHandler);
exports.kanbanRouter.post("/cards/bulk/assign", kanbanController_1.bulkAssignCardsHandler);
exports.kanbanRouter.post("/cards/bulk/labels", kanbanController_1.bulkLabelCardsHandler);
// Label routes
exports.kanbanRouter.get("/labels", kanbanLabelController_1.getLabelsHandler);
exports.kanbanRouter.post("/labels", kanbanLabelController_1.createLabelHandler);
exports.kanbanRouter.put("/labels/:labelId", kanbanLabelController_1.updateLabelHandler);
exports.kanbanRouter.delete("/labels/:labelId", kanbanLabelController_1.deleteLabelHandler);
exports.kanbanRouter.post("/cards/:cardId/labels", kanbanLabelController_1.addLabelToCardHandler);
exports.kanbanRouter.delete("/cards/:cardId/labels/:labelId", kanbanLabelController_1.removeLabelFromCardHandler);
// Assignee routes
exports.kanbanRouter.post("/cards/:cardId/assignees", kanbanAssigneeController_1.addAssigneeHandler);
exports.kanbanRouter.delete("/cards/:cardId/assignees/:userId", kanbanAssigneeController_1.removeAssigneeHandler);
// Comment routes
exports.kanbanRouter.get("/cards/:cardId/comments", kanbanCommentController_1.getCommentsHandler);
exports.kanbanRouter.post("/cards/:cardId/comments", kanbanCommentController_1.createCommentHandler);
exports.kanbanRouter.delete("/comments/:commentId", kanbanCommentController_1.deleteCommentHandler);
exports.kanbanRouter.put("/comments/:commentId", kanbanCommentController_1.updateCommentHandler);
// Activity routes
exports.kanbanRouter.get("/cards/:cardId/activity", kanbanActivityController_1.getActivityHandler);
// Custom field routes
exports.kanbanRouter.get("/custom-fields", kanbanCustomFieldController_1.listCustomFieldsHandler);
exports.kanbanRouter.post("/custom-fields", kanbanCustomFieldController_1.createCustomFieldHandler);
exports.kanbanRouter.put("/custom-fields/:fieldId", kanbanCustomFieldController_1.updateCustomFieldHandler);
exports.kanbanRouter.delete("/custom-fields/:fieldId", kanbanCustomFieldController_1.deleteCustomFieldHandler);
exports.kanbanRouter.put("/cards/:cardId/custom-fields/:fieldId", kanbanCustomFieldController_1.setCardCustomFieldHandler);
//# sourceMappingURL=kanbanRoutes.js.map
import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  getBoard,
  createColumnHandler,
  updateColumnHandler,
  deleteColumnHandler,
  createCardHandler,
  updateCardHandler,
  getCardHandler, // ✅ ADICIONE ESTA IMPORTAÇÃO
  deleteCardHandler,
  moveCardHandler,
  reorderColumnsHandler,
  reorderCardsHandler,
  archiveCardHandler,
  restoreCardHandler,
  archiveColumnHandler,
  restoreColumnHandler,
  bulkArchiveCardsHandler,
  bulkRestoreCardsHandler,
  bulkMoveCardsHandler,
  bulkAssignCardsHandler,
  bulkLabelCardsHandler,
} from "../controllers/kanbanController";
import {
  addAssigneeHandler,
  removeAssigneeHandler,
} from "../controllers/kanbanAssigneeController";
import {
  addLabelToCardHandler,
  createLabelHandler,
  deleteLabelHandler,
  getLabelsHandler,
  removeLabelFromCardHandler,
  updateLabelHandler,
} from "../controllers/kanbanLabelController";
import {
  createCommentHandler,
  deleteCommentHandler,
  getCommentsHandler,
  updateCommentHandler,
} from "../controllers/kanbanCommentController";
import { getActivityHandler } from "../controllers/kanbanActivityController";
import {
  createChecklistHandler,
  updateChecklistHandler,
  deleteChecklistHandler,
  reorderChecklistsHandler,
  createChecklistItemHandler,
  updateChecklistItemHandler,
  deleteChecklistItemHandler,
  reorderChecklistItemsHandler,
  promoteChecklistItemHandler,
} from "../controllers/kanbanChecklistController";
import {
  listCustomFieldsHandler,
  createCustomFieldHandler,
  updateCustomFieldHandler,
  deleteCustomFieldHandler,
  setCardCustomFieldHandler,
} from "../controllers/kanbanCustomFieldController";

import { ensureProjectMember } from "../middleware/authUtils";

export const kanbanRouter = Router({ mergeParams: true });

// CRÍTICO: Adiciona os middlewares na ordem correta
kanbanRouter.use(requireAuth);
kanbanRouter.use(ensureProjectMember); // ✅ ADICIONE ESTA LINHA

// Board and Column routes
kanbanRouter.get("/", getBoard);
kanbanRouter.post("/columns", createColumnHandler);
kanbanRouter.put("/columns/:columnId", updateColumnHandler);
kanbanRouter.delete("/columns/:columnId", deleteColumnHandler);
kanbanRouter.post("/columns/reorder", reorderColumnsHandler);
kanbanRouter.post("/columns/:columnId/archive", archiveColumnHandler);
kanbanRouter.post("/columns/:columnId/restore", restoreColumnHandler);

// Card routes
kanbanRouter.post("/columns/:columnId/cards", createCardHandler);
kanbanRouter.put("/cards/:cardId", updateCardHandler);
kanbanRouter.get("/cards/:cardId", getCardHandler);
kanbanRouter.delete("/cards/:cardId", deleteCardHandler);
kanbanRouter.post("/cards/:cardId/move", moveCardHandler);
kanbanRouter.post("/columns/:columnId/reorder-cards", reorderCardsHandler);
kanbanRouter.post("/cards/:cardId/archive", archiveCardHandler);
kanbanRouter.post("/cards/:cardId/restore", restoreCardHandler);

// Checklist routes
kanbanRouter.post("/cards/:cardId/checklists", createChecklistHandler);
kanbanRouter.post("/cards/:cardId/checklists/reorder", reorderChecklistsHandler);
kanbanRouter.put("/checklists/:checklistId", updateChecklistHandler);
kanbanRouter.delete("/checklists/:checklistId", deleteChecklistHandler);
kanbanRouter.post("/checklists/:checklistId/items", createChecklistItemHandler);
kanbanRouter.post("/checklists/:checklistId/reorder", reorderChecklistItemsHandler);
kanbanRouter.put("/checklist-items/:itemId", updateChecklistItemHandler);
kanbanRouter.delete("/checklist-items/:itemId", deleteChecklistItemHandler);
kanbanRouter.post("/checklist-items/:itemId/promote", promoteChecklistItemHandler);

// Bulk routes
kanbanRouter.post("/cards/bulk/archive", bulkArchiveCardsHandler);
kanbanRouter.post("/cards/bulk/restore", bulkRestoreCardsHandler);
kanbanRouter.post("/cards/bulk/move", bulkMoveCardsHandler);
kanbanRouter.post("/cards/bulk/assign", bulkAssignCardsHandler);
kanbanRouter.post("/cards/bulk/labels", bulkLabelCardsHandler);

// Label routes
kanbanRouter.get("/labels", getLabelsHandler);
kanbanRouter.post("/labels", createLabelHandler);
kanbanRouter.put("/labels/:labelId", updateLabelHandler);
kanbanRouter.delete("/labels/:labelId", deleteLabelHandler);
kanbanRouter.post("/cards/:cardId/labels", addLabelToCardHandler);
kanbanRouter.delete("/cards/:cardId/labels/:labelId", removeLabelFromCardHandler);

// Assignee routes
kanbanRouter.post("/cards/:cardId/assignees", addAssigneeHandler);
kanbanRouter.delete("/cards/:cardId/assignees/:userId", removeAssigneeHandler);

// Comment routes
kanbanRouter.get("/cards/:cardId/comments", getCommentsHandler);
kanbanRouter.post("/cards/:cardId/comments", createCommentHandler);
kanbanRouter.delete("/comments/:commentId", deleteCommentHandler);
kanbanRouter.put("/comments/:commentId", updateCommentHandler);

// Activity routes
kanbanRouter.get("/cards/:cardId/activity", getActivityHandler);

// Custom field routes
kanbanRouter.get("/custom-fields", listCustomFieldsHandler);
kanbanRouter.post("/custom-fields", createCustomFieldHandler);
kanbanRouter.put("/custom-fields/:fieldId", updateCustomFieldHandler);
kanbanRouter.delete("/custom-fields/:fieldId", deleteCustomFieldHandler);
kanbanRouter.put("/cards/:cardId/custom-fields/:fieldId", setCardCustomFieldHandler);
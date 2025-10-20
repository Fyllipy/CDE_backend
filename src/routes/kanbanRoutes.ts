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

// Card routes
kanbanRouter.post("/columns/:columnId/cards", createCardHandler);
kanbanRouter.put("/cards/:cardId", updateCardHandler);
kanbanRouter.get("/cards/:cardId", getCardHandler);
kanbanRouter.delete("/cards/:cardId", deleteCardHandler);
kanbanRouter.post("/cards/:cardId/move", moveCardHandler);
kanbanRouter.post("/columns/:columnId/reorder-cards", reorderCardsHandler);

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
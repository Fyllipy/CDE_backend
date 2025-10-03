import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  getBoard,
  createColumnHandler,
  renameColumnHandler,
  deleteColumnHandler,
  createCardHandler,
  updateCardHandler,
  deleteCardHandler,
  moveCardHandler,
  reorderColumnsHandler,
  reorderCardsHandler
} from "../controllers/kanbanController";

export const kanbanRouter = Router();

kanbanRouter.use(requireAuth);

kanbanRouter.get("/:projectId/kanban", getBoard);
kanbanRouter.post("/:projectId/kanban/columns", createColumnHandler);
kanbanRouter.put("/:projectId/kanban/columns/:columnId", renameColumnHandler);
kanbanRouter.delete("/:projectId/kanban/columns/:columnId", deleteColumnHandler);
kanbanRouter.post("/:projectId/kanban/columns/:columnId/cards", createCardHandler);
kanbanRouter.put("/:projectId/kanban/cards/:cardId", updateCardHandler);
kanbanRouter.delete("/:projectId/kanban/cards/:cardId", deleteCardHandler);
kanbanRouter.post("/:projectId/kanban/cards/:cardId/move", moveCardHandler);
kanbanRouter.post("/:projectId/kanban/columns/reorder", reorderColumnsHandler);
kanbanRouter.post("/:projectId/kanban/columns/:columnId/reorder-cards", reorderCardsHandler);

import { Request, Response } from "express";
import { pool } from "../db/pool";
import {
  listBoard,
  createColumn,
  updateColumn,
  deleteColumn,
  createCard,
  updateCard,
  deleteCard,
  moveCard,
  reorderColumns,
  reorderCards,
  getCardDetails,
  archiveCard,
  restoreCard,
  archiveColumn,
  restoreColumn,
  bulkArchiveCards,
  bulkRestoreCards,
  bulkMoveCards,
  bulkAssignCards,
  bulkLabelCards,
  listArchivedColumns,
  listArchivedCards,
} from "../services/kanbanService";

type AuthenticatedRequest = Request & {
  projectMembership?: { role: string; userId: string };
  user?: { id: string };
};

function isManager(req: AuthenticatedRequest): boolean {
  const role = req.projectMembership?.role?.trim().toUpperCase();
  return role === "MANAGER";
}

async function cardBelongsToProject(cardId: string, projectId: string): Promise<boolean> {
  if (!cardId || !projectId) {
    return false;
  }
  const result = await pool.query<{ projectId: string }>(
    'SELECT "projectId" FROM "KanbanCard" WHERE id = $1',
    [cardId]
  );
  return (result.rows[0]?.projectId ?? null) === projectId;
}

async function columnBelongsToProject(columnId: string, projectId: string): Promise<boolean> {
  if (!columnId || !projectId) {
    return false;
  }
  const result = await pool.query<{ projectId: string }>(
    'SELECT "projectId" FROM "KanbanColumn" WHERE id = $1',
    [columnId]
  );
  return (result.rows[0]?.projectId ?? null) === projectId;
}

async function labelBelongsToProject(labelId: string, projectId: string): Promise<boolean> {
  if (!labelId || !projectId) {
    return false;
  }
  const result = await pool.query<{ projectId: string }>(
    'SELECT "projectId" FROM "KanbanLabel" WHERE id = $1',
    [labelId]
  );
  return (result.rows[0]?.projectId ?? null) === projectId;
}

async function userBelongsToProject(userId: string, projectId: string): Promise<boolean> {
  if (!userId || !projectId) {
    return false;
  }
  const result = await pool.query<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM "ProjectMembership" WHERE "projectId" = $1 AND "userId" = $2) AS exists',
    [projectId, userId]
  );
  return Boolean(result.rows[0]?.exists);
}

export async function getBoard(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const { getLabelsByProjectId } = require('../services/kanbanLabelService');

  const [board, labels, archivedColumns, archivedCards] = await Promise.all([
    listBoard(projectId),
    getLabelsByProjectId(projectId),
    listArchivedColumns(projectId),
    listArchivedCards(projectId),
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

export async function createColumnHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const { name, color } = req.body as { name: string; color?: string };

  if (!name) {
    return res.status(400).json({ message: "Column name is required" });
  }

  const column = await createColumn(projectId, name, color);
  return res.status(201).json({ column });
}

export async function updateColumnHandler(req: Request, res: Response) {
  const columnId = req.params.columnId ?? "";
  const { name, color, wipLimit, archivedAt } = req.body as {
    name?: string;
    color?: string;
    wipLimit?: number | null;
    archivedAt?: string | null;
  };

  if (!name && !color && wipLimit === undefined && archivedAt === undefined) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  const column = await updateColumn(columnId, {
    name,
    color,
    wipLimit,
    archivedAt,
  });
  return res.json({ column });
}

export async function deleteColumnHandler(req: Request, res: Response) {
  const columnId = req.params.columnId ?? "";
  await deleteColumn(columnId);
  return res.status(204).send();
}

export async function createCardHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const columnId = req.params.columnId ?? "";
  const { title, description } = req.body as { title: string; description?: string };

  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }

  const card = await createCard(columnId, projectId, title, description ?? null);
  return res.status(201).json({ card });
}

export async function updateCardHandler(req: Request, res: Response) {
  const cardId = req.params.cardId ?? "";
  const { title, description, priority, startDate, dueDate, completedAt } = req.body as {
    title?: string;
    description?: string | null;
    priority?: string | null;
    startDate?: string | null;
    dueDate?: string | null;
    completedAt?: string | null;
  };

  const card = await updateCard(cardId, {
    title,
    description: description ?? null,
    priority,
    startDate,
    dueDate,
    completedAt,
  });
  return res.json({ card });
}

export async function deleteCardHandler(req: Request, res: Response) {
  const cardId = req.params.cardId ?? "";
  await deleteCard(cardId);
  return res.status(204).send();
}

export async function moveCardHandler(req: Request, res: Response) {
  const cardId = req.params.cardId ?? "";
  const { toColumnId, position } = req.body as { toColumnId: string; position: number };

  await moveCard(cardId, toColumnId, position);
  return res.status(204).send();
}

export async function reorderColumnsHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const { orderedIds } = req.body as { orderedIds: string[] };
  await reorderColumns(projectId, orderedIds);
  return res.status(204).send();
}

export async function reorderCardsHandler(req: Request, res: Response) {
  const columnId = req.params.columnId ?? "";
  const { orderedIds } = req.body as { orderedIds: string[] };
  await reorderCards(columnId, orderedIds);
  return res.status(204).send();
}

export async function getCardHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const cardId = req.params.cardId ?? "";

  if (!projectId) {
    return res.status(400).json({ message: "Project ID is required" });
  }

  if (!cardId) {
    return res.status(400).json({ message: "Card ID is required" });
  }

  try {
    const card = await getCardDetails(cardId);

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    if (card.projectId !== projectId) {
      return res.status(403).json({ message: "Card does not belong to this project" });
    }

    return res.json({ card });
  } catch (error) {
    console.error('Error in getCardHandler:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function archiveCardHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const cardId = req.params.cardId ?? "";

  if (!await cardBelongsToProject(cardId, projectId)) {
    return res.status(404).json({ message: "Card not found" });
  }

  try {
    await archiveCard(cardId);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error archiving card" });
  }
}

export async function restoreCardHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const cardId = req.params.cardId ?? "";

  if (!await cardBelongsToProject(cardId, projectId)) {
    return res.status(404).json({ message: "Card not found" });
  }

  try {
    await restoreCard(cardId);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error restoring card" });
  }
}

export async function archiveColumnHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const columnId = req.params.columnId ?? "";
  const authReq = req as AuthenticatedRequest;

  if (!isManager(authReq)) {
    return res.status(403).json({ message: "Only project managers can archive columns" });
  }

  if (!await columnBelongsToProject(columnId, projectId)) {
    return res.status(404).json({ message: "Column not found" });
  }

  try {
    await archiveColumn(columnId);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error archiving column" });
  }
}

export async function restoreColumnHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const columnId = req.params.columnId ?? "";
  const authReq = req as AuthenticatedRequest;

  if (!isManager(authReq)) {
    return res.status(403).json({ message: "Only project managers can restore columns" });
  }

  if (!await columnBelongsToProject(columnId, projectId)) {
    return res.status(404).json({ message: "Column not found" });
  }

  try {
    await restoreColumn(columnId);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error restoring column" });
  }
}

export async function bulkArchiveCardsHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const { cardIds } = req.body as { cardIds: string[] };
  const authReq = req as AuthenticatedRequest;

  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    return res.status(400).json({ message: "cardIds is required" });
  }

  if (!isManager(authReq)) {
    return res.status(403).json({ message: "Only project managers can run bulk actions" });
  }

  const cardsResult = await pool.query<{ id: string }>(
    'SELECT id FROM "KanbanCard" WHERE id = ANY($1::uuid[]) AND "projectId" = $2',
    [cardIds, projectId]
  );
  if (cardsResult.rows.length !== cardIds.length) {
    return res.status(404).json({ message: "One or more cards not found" });
  }

  try {
    await bulkArchiveCards(cardIds);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error archiving cards" });
  }
}

export async function bulkRestoreCardsHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const { cardIds } = req.body as { cardIds: string[] };
  const authReq = req as AuthenticatedRequest;

  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    return res.status(400).json({ message: "cardIds is required" });
  }

  if (!isManager(authReq)) {
    return res.status(403).json({ message: "Only project managers can run bulk actions" });
  }

  const cardsResult = await pool.query<{ id: string }>(
    'SELECT id FROM "KanbanCard" WHERE id = ANY($1::uuid[]) AND "projectId" = $2',
    [cardIds, projectId]
  );
  if (cardsResult.rows.length !== cardIds.length) {
    return res.status(404).json({ message: "One or more cards not found" });
  }

  try {
    await bulkRestoreCards(cardIds);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error restoring cards" });
  }
}

export async function bulkMoveCardsHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const { cardIds, toColumnId } = req.body as { cardIds: string[]; toColumnId: string };
  const authReq = req as AuthenticatedRequest;

  if (!Array.isArray(cardIds) || cardIds.length === 0 || !toColumnId) {
    return res.status(400).json({ message: "cardIds and toColumnId are required" });
  }

  if (!isManager(authReq)) {
    return res.status(403).json({ message: "Only project managers can run bulk actions" });
  }

  const cardsResult = await pool.query<{ id: string }>(
    'SELECT id FROM "KanbanCard" WHERE id = ANY($1::uuid[]) AND "projectId" = $2',
    [cardIds, projectId]
  );
  if (cardsResult.rows.length !== cardIds.length) {
    return res.status(404).json({ message: "One or more cards not found" });
  }

  if (!await columnBelongsToProject(toColumnId, projectId)) {
    return res.status(404).json({ message: "Target column not found" });
  }

  try {
    await bulkMoveCards(cardIds, toColumnId);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'WIP_LIMIT_EXCEEDED') {
      return res.status(409).json({ message: "Destination column is at WIP limit" });
    }
    return res.status(500).json({ message: "Error moving cards" });
  }
}

export async function bulkAssignCardsHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const { cardIds, userId, action } = req.body as { cardIds: string[]; userId: string; action: "add" | "remove" };
  const authReq = req as AuthenticatedRequest;

  if (!Array.isArray(cardIds) || cardIds.length === 0 || !userId || !action) {
    return res.status(400).json({ message: "cardIds, userId and action are required" });
  }

  if (!isManager(authReq)) {
    return res.status(403).json({ message: "Only project managers can run bulk actions" });
  }

  if (!await userBelongsToProject(userId, projectId)) {
    return res.status(404).json({ message: "User not part of project" });
  }

  const cardsResult = await pool.query<{ id: string }>(
    'SELECT id FROM "KanbanCard" WHERE id = ANY($1::uuid[]) AND "projectId" = $2',
    [cardIds, projectId]
  );
  if (cardsResult.rows.length !== cardIds.length) {
    return res.status(404).json({ message: "One or more cards not found" });
  }

  try {
    await bulkAssignCards(cardIds, userId, action);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error assigning cards" });
  }
}

export async function bulkLabelCardsHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const { cardIds, labelId, action } = req.body as { cardIds: string[]; labelId: string; action: "attach" | "detach" };
  const authReq = req as AuthenticatedRequest;

  if (!Array.isArray(cardIds) || cardIds.length === 0 || !labelId || !action) {
    return res.status(400).json({ message: "cardIds, labelId and action are required" });
  }

  if (!isManager(authReq)) {
    return res.status(403).json({ message: "Only project managers can run bulk actions" });
  }

  if (!await labelBelongsToProject(labelId, projectId)) {
    return res.status(404).json({ message: "Label not found" });
  }

  const cardsResult = await pool.query<{ id: string }>(
    'SELECT id FROM "KanbanCard" WHERE id = ANY($1::uuid[]) AND "projectId" = $2',
    [cardIds, projectId]
  );
  if (cardsResult.rows.length !== cardIds.length) {
    return res.status(404).json({ message: "One or more cards not found" });
  }

  try {
    await bulkLabelCards(cardIds, labelId, action);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error updating card labels" });
  }
}
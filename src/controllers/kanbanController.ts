import { Request, Response } from "express";
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
} from "../services/kanbanService";

export async function getBoard(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const board = await listBoard(projectId);
  // also return labels for the project
  const { getLabelsByProjectId } = require('../services/kanbanLabelService');
  const labels = await getLabelsByProjectId(projectId);
  return res.json({ board, labels });
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
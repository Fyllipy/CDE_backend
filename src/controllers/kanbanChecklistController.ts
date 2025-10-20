import { Request, Response } from "express";
import { pool } from "../db/pool";
import {
  createChecklist,
  createChecklistItem,
  deleteChecklist,
  deleteChecklistItem,
  reorderChecklistItems,
  reorderChecklists,
  updateChecklist,
  updateChecklistItem,
} from "../services/kanbanChecklistService";
import { promoteChecklistItemToSubtask } from "../services/kanbanService";

async function getCardProject(cardId: string): Promise<string | null> {
  const result = await pool.query<{ projectId: string }>(
    'SELECT "projectId" FROM "KanbanCard" WHERE id = $1',
    [cardId]
  );
  return result.rows[0]?.projectId ?? null;
}

async function getChecklistContext(checklistId: string): Promise<{ cardId: string; projectId: string } | null> {
  const result = await pool.query<{ cardId: string; projectId: string }>(
    `SELECT c."cardId" AS "cardId", card."projectId" AS "projectId"
       FROM "KanbanChecklist" c
       JOIN "KanbanCard" card ON card.id = c."cardId"
      WHERE c.id = $1`,
    [checklistId]
  );
  const row = result.rows[0];
  return row ? { cardId: row.cardId, projectId: row.projectId } : null;
}

async function getChecklistItemContext(itemId: string): Promise<{ checklistId: string; cardId: string; projectId: string } | null> {
  const result = await pool.query<{ checklistId: string; cardId: string; projectId: string }>(
    `SELECT i."checklistId" AS "checklistId",
            c."cardId" AS "cardId",
            card."projectId" AS "projectId"
       FROM "KanbanChecklistItem" i
       JOIN "KanbanChecklist" c ON c.id = i."checklistId"
       JOIN "KanbanCard" card ON card.id = c."cardId"
      WHERE i.id = $1`,
    [itemId]
  );
  const row = result.rows[0];
  return row ? { checklistId: row.checklistId, cardId: row.cardId, projectId: row.projectId } : null;
}

export async function createChecklistHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const cardId = req.params.cardId ?? "";
  const { title } = req.body as { title: string };

  if (!title?.trim()) {
    return res.status(400).json({ message: "Checklist title is required" });
  }

  const cardProject = await getCardProject(cardId);
  if (!cardProject || cardProject !== projectId) {
    return res.status(404).json({ message: "Card not found" });
  }

  try {
    const checklist = await createChecklist(cardId, title.trim());
    return res.status(201).json({ checklist });
  } catch (error) {
    return res.status(500).json({ message: "Error creating checklist" });
  }
}

export async function updateChecklistHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const checklistId = req.params.checklistId ?? "";
  const { title } = req.body as { title?: string };

  const context = await getChecklistContext(checklistId);
  if (!context || context.projectId !== projectId) {
    return res.status(404).json({ message: "Checklist not found" });
  }

  if (!title?.trim()) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  try {
    const checklist = await updateChecklist(checklistId, { title: title.trim() });
    return res.json({ checklist });
  } catch (error) {
    return res.status(500).json({ message: "Error updating checklist" });
  }
}

export async function deleteChecklistHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const checklistId = req.params.checklistId ?? "";

  const context = await getChecklistContext(checklistId);
  if (!context || context.projectId !== projectId) {
    return res.status(404).json({ message: "Checklist not found" });
  }

  try {
    await deleteChecklist(checklistId);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error deleting checklist" });
  }
}

export async function reorderChecklistsHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const cardId = req.params.cardId ?? "";
  const { orderedIds } = req.body as { orderedIds: string[] };

  const cardProject = await getCardProject(cardId);
  if (!cardProject || cardProject !== projectId) {
    return res.status(404).json({ message: "Card not found" });
  }

  try {
    await reorderChecklists(cardId, orderedIds);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error reordering checklists" });
  }
}

export async function createChecklistItemHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const checklistId = req.params.checklistId ?? "";
  const { title } = req.body as { title: string };

  const context = await getChecklistContext(checklistId);
  if (!context || context.projectId !== projectId) {
    return res.status(404).json({ message: "Checklist not found" });
  }

  if (!title?.trim()) {
    return res.status(400).json({ message: "Checklist item title is required" });
  }

  try {
    const item = await createChecklistItem(checklistId, title.trim());
    return res.status(201).json({ item });
  } catch (error) {
    return res.status(500).json({ message: "Error creating checklist item" });
  }
}

export async function updateChecklistItemHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const itemId = req.params.itemId ?? "";
  const { title, doneAt, assigneeId, dueDate } = req.body as {
    title?: string;
    doneAt?: string | null;
    assigneeId?: string | null;
    dueDate?: string | null;
  };

  const context = await getChecklistItemContext(itemId);
  if (!context || context.projectId !== projectId) {
    return res.status(404).json({ message: "Checklist item not found" });
  }

  if (title !== undefined && !title.trim()) {
    return res.status(400).json({ message: "Title cannot be empty" });
  }

  try {
    const item = await updateChecklistItem(itemId, {
      title: title?.trim(),
      doneAt: doneAt ?? null,
      assigneeId: assigneeId ?? null,
      dueDate: dueDate ?? null,
    });
    return res.json({ item });
  } catch (error) {
    return res.status(500).json({ message: "Error updating checklist item" });
  }
}

export async function deleteChecklistItemHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const itemId = req.params.itemId ?? "";

  const context = await getChecklistItemContext(itemId);
  if (!context || context.projectId !== projectId) {
    return res.status(404).json({ message: "Checklist item not found" });
  }

  try {
    await deleteChecklistItem(itemId);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error deleting checklist item" });
  }
}

export async function reorderChecklistItemsHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const checklistId = req.params.checklistId ?? "";
  const { orderedIds } = req.body as { orderedIds: string[] };

  const context = await getChecklistContext(checklistId);
  if (!context || context.projectId !== projectId) {
    return res.status(404).json({ message: "Checklist not found" });
  }

  try {
    await reorderChecklistItems(checklistId, orderedIds);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error reordering checklist items" });
  }
}

export async function promoteChecklistItemHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const itemId = req.params.itemId ?? "";

  const context = await getChecklistItemContext(itemId);
  if (!context || context.projectId !== projectId) {
    return res.status(404).json({ message: "Checklist item not found" });
  }

  try {
    const card = await promoteChecklistItemToSubtask(itemId);
    return res.status(201).json({ card });
  } catch (error) {
    if (error instanceof Error && error.message === 'WIP_LIMIT_EXCEEDED') {
      return res.status(409).json({ message: "Destination column is at WIP limit" });
    }
    return res.status(500).json({ message: "Error promoting checklist item" });
  }
}

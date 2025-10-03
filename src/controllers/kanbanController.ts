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
  reorderCards
} from "../services/kanbanService";
import { getMembership } from "../services/projectService";

function getAuthUser(req: Request): { id: string } | undefined {
  return (req as Request & { user?: { id: string } }).user;
}

async function ensureMember(projectId: string, userId: string): Promise<boolean> {
  const membership = await getMembership(projectId, userId);
  return Boolean(membership);
}

export async function getBoard(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';

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

  const board = await listBoard(projectId);
  return res.json({ board });
}

export async function createColumnHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const { name, color } = req.body as { name: string; color?: string };

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

  const column = await createColumn(projectId, name, color);
  return res.status(201).json({ column });
}

export async function renameColumnHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const columnId = req.params.columnId ?? '';
  const { name, color } = req.body as { name?: string; color?: string };

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

  const column = await updateColumn(columnId, { name, color });
  return res.json({ column });
}

export async function deleteColumnHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const columnId = req.params.columnId ?? '';

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

  await deleteColumn(columnId);
  return res.status(204).send();
}

export async function createCardHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const columnId = req.params.columnId ?? '';
  const { title, description, color } = req.body as { title: string; description?: string; color?: string | null };

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

  const card = await createCard(columnId, projectId, title, description ?? null, color ?? null);
  return res.status(201).json({ card });
}

export async function updateCardHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const cardId = req.params.cardId ?? '';
  const { title, description, color } = req.body as { title?: string; description?: string | null; color?: string | null };

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

  const card = await updateCard(cardId, { title, description: description ?? null, color: color ?? null });
  return res.json({ card });
}

export async function deleteCardHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const cardId = req.params.cardId ?? '';

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

  await deleteCard(cardId);
  return res.status(204).send();
}

export async function moveCardHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const cardId = req.params.cardId ?? '';
  const { toColumnId, position } = req.body as { toColumnId: string; position: number };

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

  await moveCard(cardId, toColumnId, position);
  return res.status(204).send();
}

export async function reorderColumnsHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const { orderedIds } = req.body as { orderedIds: string[] };

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

  await reorderColumns(projectId, orderedIds);
  return res.status(204).send();
}

export async function reorderCardsHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const columnId = req.params.columnId ?? '';
  const { orderedIds } = req.body as { orderedIds: string[] };

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

  await reorderCards(columnId, orderedIds);
  return res.status(204).send();
}

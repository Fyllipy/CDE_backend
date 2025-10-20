import { Request, Response } from "express";
import { pool } from "../db/pool";
import {
  KanbanCustomFieldType,
  createCustomFieldDef,
  deleteCustomFieldDef,
  getCustomFieldDefsByProject,
  updateCustomFieldDef,
  upsertCardCustomFieldValue,
} from "../services/kanbanCustomFieldService";
import { getMembership } from "../services/projectService";

const ALLOWED_TYPES: KanbanCustomFieldType[] = ["TEXT", "NUMBER", "DATE", "LIST", "BOOLEAN"];

type AuthenticatedRequest = Request & {
  projectMembership?: { role: string; userId: string };
  user?: { id: string };
};

function isManager(membership?: { role: string }): boolean {
  const role = membership?.role?.trim().toUpperCase();
  return role === "MANAGER";
}

async function ensureFieldBelongsToProject(fieldId: string, projectId: string): Promise<boolean> {
  const result = await pool.query<{ projectId: string }>(
    'SELECT "projectId" FROM "KanbanCustomFieldDef" WHERE id = $1',
    [fieldId]
  );
  return (result.rows[0]?.projectId ?? null) === projectId;
}

async function ensureCardBelongsToProject(cardId: string, projectId: string): Promise<boolean> {
  const result = await pool.query<{ projectId: string }>(
    'SELECT "projectId" FROM "KanbanCard" WHERE id = $1',
    [cardId]
  );
  return (result.rows[0]?.projectId ?? null) === projectId;
}

export async function listCustomFieldsHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  try {
    const fields = await getCustomFieldDefsByProject(projectId);
    return res.json({ fields });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching custom fields" });
  }
}

export async function createCustomFieldHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const { name, type, options, required } = req.body as {
    name: string;
    type: KanbanCustomFieldType;
    options?: any;
    required?: boolean;
  };

  let membership = (req as AuthenticatedRequest).projectMembership;
  if (!membership) {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (userId) {
      membership = await getMembership(projectId, userId);
    }
  }

  if (!isManager(membership)) {
    return res.status(403).json({ message: "Only project managers can manage custom fields" });
  }

  if (!name?.trim() || !type) {
    return res.status(400).json({ message: "Name and type are required" });
  }

  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ message: "Invalid custom field type" });
  }

  try {
    const field = await createCustomFieldDef(projectId, name.trim(), type, options ?? null, Boolean(required));
    return res.status(201).json({ field });
  } catch (error) {
    return res.status(500).json({ message: "Error creating custom field" });
  }
}

export async function updateCustomFieldHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const fieldId = req.params.fieldId ?? "";
  const { name, type, options, required } = req.body as {
    name?: string;
    type?: KanbanCustomFieldType;
    options?: any;
    required?: boolean;
  };

  let membership = (req as AuthenticatedRequest).projectMembership;
  if (!membership) {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (userId) {
      membership = await getMembership(projectId, userId);
    }
  }

  if (!isManager(membership)) {
    return res.status(403).json({ message: "Only project managers can manage custom fields" });
  }

  const belongs = await ensureFieldBelongsToProject(fieldId, projectId);
  if (!belongs) {
    return res.status(404).json({ message: "Custom field not found" });
  }

  if (!name && !type && options === undefined && required === undefined) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  if (type && !ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ message: "Invalid custom field type" });
  }

  try {
    const field = await updateCustomFieldDef(fieldId, {
      name: name?.trim(),
      type,
      options: options ?? null,
      required,
    });
    return res.json({ field });
  } catch (error) {
    return res.status(500).json({ message: "Error updating custom field" });
  }
}

export async function deleteCustomFieldHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const fieldId = req.params.fieldId ?? "";

  let membership = (req as AuthenticatedRequest).projectMembership;
  if (!membership) {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (userId) {
      membership = await getMembership(projectId, userId);
    }
  }

  if (!isManager(membership)) {
    return res.status(403).json({ message: "Only project managers can manage custom fields" });
  }

  const belongs = await ensureFieldBelongsToProject(fieldId, projectId);
  if (!belongs) {
    return res.status(404).json({ message: "Custom field not found" });
  }

  try {
    await deleteCustomFieldDef(fieldId);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error deleting custom field" });
  }
}

function normalizeValue(type: KanbanCustomFieldType, value: any): any {
  if (value === null || value === undefined) {
    return null;
  }

  switch (type) {
    case "TEXT":
      return String(value);
    case "NUMBER":
      if (Number.isNaN(Number(value))) {
        throw new Error("INVALID_NUMBER");
      }
      return Number(value);
    case "DATE":
      if (!value) {
        return null;
      }
      const asDate = new Date(value);
      if (Number.isNaN(asDate.getTime())) {
        throw new Error("INVALID_DATE");
      }
      return asDate.toISOString();
    case "BOOLEAN":
      if (typeof value === "boolean") {
        return value;
      }
      if (value === "true" || value === 1) {
        return true;
      }
      if (value === "false" || value === 0) {
        return false;
      }
      throw new Error("INVALID_BOOLEAN");
    case "LIST":
      if (Array.isArray(value)) {
        return value;
      }
      return [value];
    default:
      return value;
  }
}

export async function setCardCustomFieldHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const cardId = req.params.cardId ?? "";
  const fieldId = req.params.fieldId ?? "";
  const { value } = req.body as { value: any };

  const [cardBelongs, fieldRow] = await Promise.all([
    ensureCardBelongsToProject(cardId, projectId),
    pool.query<{
      projectId: string;
      type: KanbanCustomFieldType;
    }>('SELECT "projectId", type FROM "KanbanCustomFieldDef" WHERE id = $1', [fieldId]),
  ]);

  if (!cardBelongs) {
    return res.status(404).json({ message: "Card not found" });
  }

  const fieldInfo = fieldRow.rows[0];
  if (!fieldInfo || fieldInfo.projectId !== projectId) {
    return res.status(404).json({ message: "Custom field not found" });
  }

  try {
    const parsedValue = normalizeValue(fieldInfo.type, value);
    const persisted = await upsertCardCustomFieldValue(cardId, fieldId, parsedValue);
    return res.json({ value: persisted });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_NUMBER") {
        return res.status(400).json({ message: "Invalid number value" });
      }
      if (error.message === "INVALID_DATE") {
        return res.status(400).json({ message: "Invalid date value" });
      }
      if (error.message === "INVALID_BOOLEAN") {
        return res.status(400).json({ message: "Invalid boolean value" });
      }
    }
    return res.status(500).json({ message: "Error setting custom field value" });
  }
}

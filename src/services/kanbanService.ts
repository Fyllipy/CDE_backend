import { pool, withTransaction } from "../db/pool";
import { getChecklistsByCardId } from "./kanbanChecklistService";
import { getCustomFieldValuesForCard } from "./kanbanCustomFieldService";

export interface KanbanColumn {
  id: string;
  projectId: string;
  name: string;
  position: number;
  color: string;
  wipLimit: number | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanCard {
  id: string;
  columnId: string;
  projectId: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  priority: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  completedAt: Date | null;
  archivedAt: Date | null;
  parentId: string | null;
}

const DEFAULT_COLUMN_COLOR = "#2563eb";

export async function listBoard(
  projectId: string
): Promise<Array<KanbanColumn & { cards: KanbanCard[] }>> {
  const columnsResult = await pool.query<KanbanColumn>(
    'SELECT id, "projectId", name, position, color, "wipLimit", "archivedAt", "createdAt", "updatedAt" FROM "KanbanColumn" WHERE "projectId" = $1 AND "archivedAt" IS NULL ORDER BY position ASC',
    [projectId]
  );

  const cardsResult = await pool.query<KanbanCard>(
    'SELECT id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt", priority, "startDate", "dueDate", "completedAt", "archivedAt", "parentId" FROM "KanbanCard" WHERE "projectId" = $1 AND "archivedAt" IS NULL ORDER BY position ASC',
    [projectId]
  );

  const cardsByColumn = new Map<string, KanbanCard[]>();
  for (const card of cardsResult.rows) {
    const list = cardsByColumn.get(card.columnId) ?? [];
    list.push(card);
    cardsByColumn.set(card.columnId, list);
  }

  return columnsResult.rows.map((column: KanbanColumn) => ({
    ...column,
    cards: cardsByColumn.get(column.id) ?? [],
  }));
}

export async function getCardDetails(cardId: string) {
  const cardResult = await pool.query<KanbanCard & { labels?: any; assignees?: any }>(
    'SELECT * FROM "KanbanCard" WHERE id = $1',
    [cardId]
  );
  const card = cardResult.rows[0];
  if (!card) return null;

  const [labels, assignees, comments, activity, checklists, customFields, subtasks] = await Promise.all([
    getLabelsByCardId(cardId),
    getAssigneesByCardId(cardId),
    getCommentsByCardId(cardId),
    getActivityByCardId(cardId),
    getChecklistsByCardId(cardId),
    getCustomFieldValuesForCard(cardId),
    getSubtasks(cardId),
  ]);

  return { ...card, labels, assignees, comments, activity, checklists, customFields, subtasks };
}

export async function getSubtasks(cardId: string): Promise<KanbanCard[]> {
  const result = await pool.query<KanbanCard>(
    'SELECT id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt", priority, "startDate", "dueDate", "completedAt", "archivedAt", "parentId" FROM "KanbanCard" WHERE "parentId" = $1 AND "archivedAt" IS NULL ORDER BY position ASC',
    [cardId]
  );
  return result.rows;
}

export async function createColumn(
  projectId: string,
  name: string,
  color?: string
): Promise<KanbanColumn> {
  const positionResult = await pool.query<{ max: number | null }>(
    'SELECT MAX(position) as max FROM "KanbanColumn" WHERE "projectId" = $1',
    [projectId]
  );
  const nextPosition = (positionResult.rows[0]?.max ?? -1) + 1;

  const result = await pool.query<KanbanColumn>(
    'INSERT INTO "KanbanColumn" ("projectId", name, position, color) VALUES ($1, $2, $3, $4) RETURNING id, "projectId", name, position, color, "wipLimit", "archivedAt", "createdAt", "updatedAt"',
    [projectId, name, nextPosition, color ?? DEFAULT_COLUMN_COLOR]
  );
  const column = result.rows[0];
  if (!column) {
    throw new Error("Unable to create column");
  }
  return column;
}

export async function updateColumn(
  columnId: string,
  data: {
    name?: string;
    color?: string;
    wipLimit?: number | null;
    archivedAt?: Date | string | null;
  }
): Promise<KanbanColumn | undefined> {
  const result = await pool.query<KanbanColumn>(
    'UPDATE "KanbanColumn" SET name = COALESCE($2, name), color = COALESCE($3, color), "wipLimit" = $4, "archivedAt" = $5, "updatedAt" = NOW() WHERE id = $1 RETURNING id, "projectId", name, position, color, "wipLimit", "archivedAt", "createdAt", "updatedAt"',
    [columnId, data.name, data.color, data.wipLimit, data.archivedAt]
  );
  return result.rows[0];
}

export async function deleteColumn(columnId: string): Promise<void> {
  await pool.query('DELETE FROM "KanbanColumn" WHERE id = $1', [columnId]);
}

export async function createCard(
  columnId: string,
  projectId: string,
  title: string,
  description: string | null,
  parentId: string | null = null
): Promise<KanbanCard> {
  // Enforce WIP limit for the target column, if any
  const colRes = await pool.query<{ "wipLimit": number | null }>('SELECT "wipLimit" FROM "KanbanColumn" WHERE id = $1', [columnId]);
  const wipLimit = colRes.rows[0]?.wipLimit ?? null;
  if (wipLimit !== null) {
    const countRes = await pool.query<{ cnt: number }>('SELECT COUNT(*)::int as cnt FROM "KanbanCard" WHERE "columnId" = $1', [columnId]);
    const cnt = countRes.rows[0]?.cnt ?? 0;
    if (cnt >= wipLimit) {
      const err = new Error('WIP_LIMIT_EXCEEDED');
      throw err;
    }
  }

  const positionResult = await pool.query<{ max: number | null }>(
    'SELECT MAX(position) as max FROM "KanbanCard" WHERE "columnId" = $1',
    [columnId]
  );
  const nextPosition = (positionResult.rows[0]?.max ?? -1) + 1;

  const result = await pool.query<KanbanCard>(
    'INSERT INTO "KanbanCard" ("columnId", "projectId", title, description, position, "parentId") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt", priority, "startDate", "dueDate", "completedAt", "archivedAt", "parentId"',
    [columnId, projectId, title, description, nextPosition, parentId]
  );
  const card = result.rows[0];
  if (!card) {
    throw new Error('Unable to create card');
  }
  return card;
}

export async function updateCard(
  cardId: string,
  fields: {
    title?: string;
    description?: string | null;
    priority?: string | null;
    startDate?: string | null;
    dueDate?: string | null;
    completedAt?: string | null;
    archivedAt?: string | null;
    parentId?: string | null;
  }
): Promise<KanbanCard | undefined> {
  const result = await pool.query<KanbanCard>(
    'UPDATE "KanbanCard" SET title = COALESCE($2, title), description = $3, priority = $4, "startDate" = $5, "dueDate" = $6, "completedAt" = $7, "archivedAt" = $8, "parentId" = $9, "updatedAt" = NOW() WHERE id = $1 RETURNING id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt", priority, "startDate", "dueDate", "completedAt", "archivedAt", "parentId"',
    [
      cardId,
      fields.title,
      fields.description,
      fields.priority,
      fields.startDate,
      fields.dueDate,
      fields.completedAt,
      fields.archivedAt ?? null,
      fields.parentId ?? null,
    ]
  );
  return result.rows[0];
}

import { addAssigneeToCard, removeAssigneeFromCard, getAssigneesByCardId } from "./kanbanAssigneeService";
import { getCommentsByCardId } from "./kanbanCommentService";
import { addLabelToCard, getLabelsByCardId, removeLabelFromCard } from "./kanbanLabelService";
import { getActivityByCardId } from "./kanbanActivityService";

export async function getCard(cardId: string) {
  const cardResult = await pool.query<KanbanCard>(
    'SELECT * FROM "KanbanCard" WHERE id = $1',
    [cardId]
  );
  const card = cardResult.rows[0];

  if (!card) {
    return null;
  }

  const [labels, assignees, comments, activity, checklists, customFields, subtasks] = await Promise.all([
    getLabelsByCardId(cardId),
    getAssigneesByCardId(cardId),
    getCommentsByCardId(cardId),
    getActivityByCardId(cardId),
    getChecklistsByCardId(cardId),
    getCustomFieldValuesForCard(cardId),
    getSubtasks(cardId),
  ]);

  return { ...card, labels, assignees, comments, activity, checklists, customFields, subtasks };
}

export async function deleteCard(cardId: string): Promise<void> {
  await pool.query('DELETE FROM "KanbanCard" WHERE id = $1', [cardId]);
}

export async function archiveCard(cardId: string): Promise<void> {
  await withTransaction(async (client) => {
    const cardResult = await client.query<{ columnId: string; position: number }>(
      'SELECT "columnId", position FROM "KanbanCard" WHERE id = $1 FOR UPDATE',
      [cardId]
    );
    const card = cardResult.rows[0];
    if (!card) {
      throw new Error('Card not found');
    }

    await client.query(
      'UPDATE "KanbanCard" SET "archivedAt" = NOW(), "updatedAt" = NOW() WHERE id = $1',
      [cardId]
    );

    await client.query(
      'UPDATE "KanbanCard" SET position = position - 1, "updatedAt" = NOW() WHERE "columnId" = $1 AND position > $2 AND "archivedAt" IS NULL',
      [card.columnId, card.position]
    );
  });
}

export async function restoreCard(cardId: string): Promise<void> {
  await withTransaction(async (client) => {
    const cardResult = await client.query<{ columnId: string }>(
      'SELECT "columnId" FROM "KanbanCard" WHERE id = $1 FOR UPDATE',
      [cardId]
    );
    const card = cardResult.rows[0];
    if (!card) {
      throw new Error('Card not found');
    }

    const positionResult = await client.query<{ max: number | null }>(
      'SELECT MAX(position) AS max FROM "KanbanCard" WHERE "columnId" = $1 AND "archivedAt" IS NULL',
      [card.columnId]
    );
    const nextPosition = (positionResult.rows[0]?.max ?? -1) + 1;

    await client.query(
      'UPDATE "KanbanCard" SET "archivedAt" = NULL, position = $2, "updatedAt" = NOW() WHERE id = $1',
      [cardId, nextPosition]
    );
  });
}

export async function moveCard(cardId: string, toColumnId: string, newPosition: number): Promise<void> {
  // Use transaction helper to ensure proper client usage
  return withTransaction(async (client) => {
    const cardResult = await client.query<{ columnId: string; position: number }>(
      'SELECT "columnId", position FROM "KanbanCard" WHERE id = $1 FOR UPDATE',
      [cardId]
    );
    const card = cardResult.rows[0];
    if (!card) {
      throw new Error('Card not found');
    }

    const { columnId: fromColumnId, position: oldPosition } = card;

    if (fromColumnId === toColumnId && oldPosition === newPosition) {
      return;
    }

    // Enforce WIP limit on destination column
    const colRes = await client.query<{ "wipLimit": number | null }>('SELECT "wipLimit" FROM "KanbanColumn" WHERE id = $1 FOR UPDATE', [toColumnId]);
    const wipLimit = colRes.rows[0]?.wipLimit ?? null;
    if (wipLimit !== null) {
      const countRes = await client.query<{ cnt: number }>('SELECT COUNT(*)::int as cnt FROM "KanbanCard" WHERE "columnId" = $1', [toColumnId]);
      const cnt = countRes.rows[0]?.cnt ?? 0;
      // if moving within same column, subtract one from count because the card is currently counted in dest
      const effectiveCount = toColumnId === fromColumnId ? cnt : cnt;
      if (toColumnId !== fromColumnId && effectiveCount >= wipLimit) {
        const err = new Error('WIP_LIMIT_EXCEEDED');
        throw err;
      }
    }

    // 1. "Remove" card from the old column by shifting subsequent cards up
    await client.query(
      'UPDATE "KanbanCard" SET position = position - 1, "updatedAt" = NOW() WHERE "columnId" = $1 AND position > $2',
      [fromColumnId, oldPosition]
    );

    // 2. "Insert" card into the new column by shifting subsequent cards down
    await client.query(
      'UPDATE "KanbanCard" SET position = position + 1, "updatedAt" = NOW() WHERE "columnId" = $1 AND position >= $2',
      [toColumnId, newPosition]
    );

    // 3. Finally, move the card to its new column and position
    await client.query(
      'UPDATE "KanbanCard" SET "columnId" = $1, position = $2, "updatedAt" = NOW() WHERE id = $3',
      [toColumnId, newPosition, cardId]
    );
  });
}

export async function archiveColumn(columnId: string): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      'UPDATE "KanbanColumn" SET "archivedAt" = NOW(), "updatedAt" = NOW() WHERE id = $1',
      [columnId]
    );
    await client.query(
      'UPDATE "KanbanCard" SET "archivedAt" = NOW(), "updatedAt" = NOW() WHERE "columnId" = $1 AND "archivedAt" IS NULL',
      [columnId]
    );
  });
}

export async function restoreColumn(columnId: string): Promise<void> {
  await withTransaction(async (client) => {
    const columnResult = await client.query<{ projectId: string }>(
      'SELECT "projectId" FROM "KanbanColumn" WHERE id = $1 FOR UPDATE',
      [columnId]
    );
    const column = columnResult.rows[0];
    if (!column) {
      throw new Error('Column not found');
    }

    const positionResult = await client.query<{ max: number | null }>(
      'SELECT MAX(position) AS max FROM "KanbanColumn" WHERE "projectId" = $1 AND "archivedAt" IS NULL',
      [column.projectId]
    );
    const nextPosition = (positionResult.rows[0]?.max ?? -1) + 1;

    await client.query(
      'UPDATE "KanbanColumn" SET "archivedAt" = NULL, position = $2, "updatedAt" = NOW() WHERE id = $1',
      [columnId, nextPosition]
    );
    await client.query(
      'UPDATE "KanbanCard" SET "archivedAt" = NULL, "updatedAt" = NOW() WHERE "columnId" = $1',
      [columnId]
    );
  });
}

export async function bulkArchiveCards(cardIds: string[]): Promise<void> {
  for (const cardId of cardIds) {
    if (!cardId) {
      continue;
    }
    await archiveCard(cardId);
  }
}

export async function bulkRestoreCards(cardIds: string[]): Promise<void> {
  for (const cardId of cardIds) {
    if (!cardId) {
      continue;
    }
    await restoreCard(cardId);
  }
}

export async function bulkMoveCards(cardIds: string[], toColumnId: string): Promise<void> {
  await withTransaction(async (client) => {
    const wipResult = await client.query<{ wipLimit: number | null }>(
      'SELECT "wipLimit" FROM "KanbanColumn" WHERE id = $1 FOR UPDATE',
      [toColumnId]
    );
    const wipLimit = wipResult.rows[0]?.wipLimit ?? null;

    const existingCountResult = await client.query<{ cnt: number }>(
      'SELECT COUNT(*)::int AS cnt FROM "KanbanCard" WHERE "columnId" = $1 AND "archivedAt" IS NULL',
      [toColumnId]
    );
    const existingCount = existingCountResult.rows[0]?.cnt ?? 0;

    if (wipLimit !== null && existingCount + cardIds.length > wipLimit) {
      throw new Error('WIP_LIMIT_EXCEEDED');
    }

    const positionResult = await client.query<{ max: number | null }>(
      'SELECT MAX(position) AS max FROM "KanbanCard" WHERE "columnId" = $1 AND "archivedAt" IS NULL',
      [toColumnId]
    );
    let nextPosition = (positionResult.rows[0]?.max ?? -1) + 1;

    for (const cardId of cardIds) {
      if (!cardId) {
        continue;
      }

      const cardResult = await client.query<{ columnId: string; position: number }>(
        'SELECT "columnId", position FROM "KanbanCard" WHERE id = $1 FOR UPDATE',
        [cardId]
      );
      const card = cardResult.rows[0];
      if (!card) {
        continue;
      }

      await client.query(
        'UPDATE "KanbanCard" SET position = position - 1, "updatedAt" = NOW() WHERE "columnId" = $1 AND position > $2 AND "archivedAt" IS NULL',
        [card.columnId, card.position]
      );

      await client.query(
        'UPDATE "KanbanCard" SET "columnId" = $1, position = $2, "updatedAt" = NOW() WHERE id = $3',
        [toColumnId, nextPosition, cardId]
      );

      nextPosition += 1;
    }
  });
}

export async function bulkAssignCards(cardIds: string[], userId: string, action: "add" | "remove"): Promise<void> {
  for (const cardId of cardIds) {
    if (!cardId) {
      continue;
    }
    if (action === "add") {
      await addAssigneeToCard(cardId, userId);
    } else {
      await removeAssigneeFromCard(cardId, userId);
    }
  }
}

export async function bulkLabelCards(cardIds: string[], labelId: string, action: "attach" | "detach"): Promise<void> {
  for (const cardId of cardIds) {
    if (!cardId) {
      continue;
    }
    if (action === "attach") {
      await addLabelToCard(cardId, labelId);
    } else {
      await removeLabelFromCard(cardId, labelId);
    }
  }
}

export async function promoteChecklistItemToSubtask(itemId: string): Promise<KanbanCard> {
  return withTransaction(async (client) => {
    const itemResult = await client.query<{
      checklistId: string;
      cardId: string;
      columnId: string;
      projectId: string;
      title: string;
      position: number;
    }>(
      `SELECT i."checklistId",
              c."cardId",
              card."columnId",
              card."projectId",
              i.title,
              i.position
         FROM "KanbanChecklistItem" i
         JOIN "KanbanChecklist" c ON c.id = i."checklistId"
         JOIN "KanbanCard" card ON card.id = c."cardId"
        WHERE i.id = $1
        FOR UPDATE`,
      [itemId]
    );

    const item = itemResult.rows[0];
    if (!item) {
      throw new Error('Checklist item not found');
    }

    const colRes = await client.query<{ wipLimit: number | null }>(
      'SELECT "wipLimit" FROM "KanbanColumn" WHERE id = $1 FOR UPDATE',
      [item.columnId]
    );
    const wipLimit = colRes.rows[0]?.wipLimit ?? null;
    if (wipLimit !== null) {
      const countRes = await client.query<{ cnt: number }>(
        'SELECT COUNT(*)::int AS cnt FROM "KanbanCard" WHERE "columnId" = $1 AND "archivedAt" IS NULL',
        [item.columnId]
      );
      if ((countRes.rows[0]?.cnt ?? 0) >= wipLimit) {
        throw new Error('WIP_LIMIT_EXCEEDED');
      }
    }

    const positionResult = await client.query<{ max: number | null }>(
      'SELECT MAX(position) AS max FROM "KanbanCard" WHERE "columnId" = $1 AND "archivedAt" IS NULL',
      [item.columnId]
    );
    const nextPosition = (positionResult.rows[0]?.max ?? -1) + 1;

    const cardResult = await client.query<KanbanCard>(
      'INSERT INTO "KanbanCard" ("columnId", "projectId", title, description, position, "parentId") VALUES ($1, $2, $3, NULL, $4, $5) RETURNING id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt", priority, "startDate", "dueDate", "completedAt", "archivedAt", "parentId"',
      [item.columnId, item.projectId, item.title, nextPosition, item.cardId]
    );
    const newCard = cardResult.rows[0];
    if (!newCard) {
      throw new Error('Unable to create subtask card');
    }

    await client.query('DELETE FROM "KanbanChecklistItem" WHERE id = $1', [itemId]);
    await client.query(
      'UPDATE "KanbanChecklistItem" SET position = position - 1, "updatedAt" = NOW() WHERE "checklistId" = $1 AND position > $2',
      [item.checklistId, item.position]
    );

    return newCard;
  });
}

export async function listArchivedColumns(projectId: string): Promise<KanbanColumn[]> {
  const result = await pool.query<KanbanColumn>(
    'SELECT id, "projectId", name, position, color, "wipLimit", "archivedAt", "createdAt", "updatedAt" FROM "KanbanColumn" WHERE "projectId" = $1 AND "archivedAt" IS NOT NULL ORDER BY "updatedAt" DESC',
    [projectId]
  );
  return result.rows;
}

export async function listArchivedCards(projectId: string): Promise<KanbanCard[]> {
  const result = await pool.query<KanbanCard>(
    'SELECT id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt", priority, "startDate", "dueDate", "completedAt", "archivedAt", "parentId" FROM "KanbanCard" WHERE "projectId" = $1 AND "archivedAt" IS NOT NULL ORDER BY "updatedAt" DESC',
    [projectId]
  );
  return result.rows;
}

export async function reorderColumns(projectId: string, orderedIds: string[]): Promise<void> {
  return withTransaction(async (client) => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      const columnId = orderedIds[index] ?? '';
      if (!columnId) continue;
      await client.query(
        'UPDATE "KanbanColumn" SET position = $2, "updatedAt" = NOW() WHERE id = $1 AND "projectId" = $3',
        [columnId, index, projectId]
      );
    }
  });
}

export async function reorderCards(columnId: string, orderedIds: string[]): Promise<void> {
  return withTransaction(async (client) => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      const cardId = orderedIds[index] ?? '';
      if (!cardId) continue;
      await client.query(
        'UPDATE "KanbanCard" SET position = $2, "updatedAt" = NOW() WHERE id = $1 AND "columnId" = $3',
        [cardId, index, columnId]
      );
    }
  });
}

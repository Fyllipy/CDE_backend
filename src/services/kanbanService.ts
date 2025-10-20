import { pool, withTransaction } from "../db/pool";

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
}

const DEFAULT_COLUMN_COLOR = "#2563eb";

export async function listBoard(
  projectId: string
): Promise<Array<KanbanColumn & { cards: KanbanCard[] }>> {
  const columnsResult = await pool.query<KanbanColumn>(
    'SELECT id, "projectId", name, position, color, "wipLimit", "archivedAt", "createdAt", "updatedAt" FROM "KanbanColumn" WHERE "projectId" = $1 ORDER BY position ASC',
    [projectId]
  );

  const cardsResult = await pool.query<KanbanCard>(
    'SELECT id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt", priority, "startDate", "dueDate", "completedAt", "archivedAt" FROM "KanbanCard" WHERE "projectId" = $1 ORDER BY position ASC',
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

  const [labels, assignees, comments, activity] = await Promise.all([
    getLabelsByCardId(cardId),
    getAssigneesByCardId(cardId),
    getCommentsByCardId(cardId),
    getActivityByCardId(cardId),
  ]);

  return { ...card, labels, assignees, comments, activity };
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

export async function createCard(columnId: string, projectId: string, title: string, description: string | null): Promise<KanbanCard> {
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
    'INSERT INTO "KanbanCard" ("columnId", "projectId", title, description, position) VALUES ($1, $2, $3, $4, $5) RETURNING id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt"',
    [columnId, projectId, title, description, nextPosition]
  );
  const card = result.rows[0];
  if (!card) {
    throw new Error('Unable to create card');
  }
  return card;
}

export async function updateCard(cardId: string, fields: { title?: string; description?: string | null; priority?: string | null; startDate?: string | null; dueDate?: string | null; completedAt?: string | null; }): Promise<KanbanCard | undefined> {
  const result = await pool.query<KanbanCard>(
    'UPDATE "KanbanCard" SET title = COALESCE($2, title), description = $3, priority = $4, "startDate" = $5, "dueDate" = $6, "completedAt" = $7, "updatedAt" = NOW() WHERE id = $1 RETURNING id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt", priority, "startDate", "dueDate", "completedAt", "archivedAt"',
    [cardId, fields.title, fields.description, fields.priority, fields.startDate, fields.dueDate, fields.completedAt]
  );
  return result.rows[0];
}

import { getAssigneesByCardId } from "./kanbanAssigneeService";
import { getCommentsByCardId } from "./kanbanCommentService";
import { getLabelsByCardId } from "./kanbanLabelService";
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

  const [labels, assignees, comments, activity] = await Promise.all([
    getLabelsByCardId(cardId),
    getAssigneesByCardId(cardId),
    getCommentsByCardId(cardId),
    getActivityByCardId(cardId),
  ]);

  return { ...card, labels, assignees, comments, activity };
}

export async function deleteCard(cardId: string): Promise<void> {
  await pool.query('DELETE FROM "KanbanCard" WHERE id = $1', [cardId]);
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

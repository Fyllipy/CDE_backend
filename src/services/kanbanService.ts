import { pool } from "../db/pool";

export interface KanbanColumn {
  id: string;
  projectId: string;
  name: string;
  position: number;
  color: string;
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
}

const DEFAULT_COLUMN_COLOR = "#2563eb";

export async function listBoard(projectId: string): Promise<Array<KanbanColumn & { cards: KanbanCard[] }>> {
  const columnsResult = await pool.query<KanbanColumn>(
    'SELECT id, "projectId", name, position, color, "createdAt", "updatedAt" FROM "KanbanColumn" WHERE "projectId" = $1 ORDER BY position ASC',
    [projectId]
  );

  const cardsResult = await pool.query<KanbanCard>(
    'SELECT id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt" FROM "KanbanCard" WHERE "projectId" = $1 ORDER BY position ASC',
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
    cards: cardsByColumn.get(column.id) ?? []
  }));
}

export async function createColumn(projectId: string, name: string, color?: string): Promise<KanbanColumn> {
  const positionResult = await pool.query<{ max: number | null }>(
    'SELECT MAX(position) as max FROM "KanbanColumn" WHERE "projectId" = $1',
    [projectId]
  );
  const nextPosition = (positionResult.rows[0]?.max ?? -1) + 1;

  const result = await pool.query<KanbanColumn>(
    'INSERT INTO "KanbanColumn" ("projectId", name, position, color) VALUES ($1, $2, $3, $4) RETURNING id, "projectId", name, position, color, "createdAt", "updatedAt"',
    [projectId, name, nextPosition, color ?? DEFAULT_COLUMN_COLOR]
  );
  const column = result.rows[0];
  if (!column) {
    throw new Error('Unable to create column');
  }
  return column;
}

export async function updateColumn(columnId: string, data: { name?: string; color?: string }): Promise<KanbanColumn | undefined> {
  const result = await pool.query<KanbanColumn>(
    'UPDATE "KanbanColumn" SET name = COALESCE($2, name), color = COALESCE($3, color), "updatedAt" = NOW() WHERE id = $1 RETURNING id, "projectId", name, position, color, "createdAt", "updatedAt"',
    [columnId, data.name ?? null, data.color ?? null]
  );
  return result.rows[0];
}

export async function deleteColumn(columnId: string): Promise<void> {
  await pool.query('DELETE FROM "KanbanColumn" WHERE id = $1', [columnId]);
}

export async function createCard(columnId: string, projectId: string, title: string, description: string | null): Promise<KanbanCard> {
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

export async function updateCard(cardId: string, fields: { title?: string; description?: string | null }): Promise<KanbanCard | undefined> {
  const result = await pool.query<KanbanCard>(
    'UPDATE "KanbanCard" SET title = COALESCE($2, title), description = $3, "updatedAt" = NOW() WHERE id = $1 RETURNING id, "columnId", "projectId", title, description, position, "createdAt", "updatedAt"',
    [cardId, fields.title ?? null, fields.description ?? null]
  );
  return result.rows[0];
}

export async function deleteCard(cardId: string): Promise<void> {
  await pool.query('DELETE FROM "KanbanCard" WHERE id = $1', [cardId]);
}

export async function moveCard(cardId: string, toColumnId: string, newPosition: number): Promise<void> {
  await pool.query(
    'UPDATE "KanbanCard" SET "columnId" = $2, position = $3, "updatedAt" = NOW() WHERE id = $1',
    [cardId, toColumnId, newPosition]
  );
}

export async function reorderColumns(projectId: string, orderedIds: string[]): Promise<void> {
  await pool.query('BEGIN');
  try {
    for (let index = 0; index < orderedIds.length; index += 1) {
      const columnId = orderedIds[index] ?? '';
      if (!columnId) {
        continue;
      }
      await pool.query(
        'UPDATE "KanbanColumn" SET position = $2, "updatedAt" = NOW() WHERE id = $1 AND "projectId" = $3',
        [columnId, index, projectId]
      );
    }
    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

export async function reorderCards(columnId: string, orderedIds: string[]): Promise<void> {
  await pool.query('BEGIN');
  try {
    for (let index = 0; index < orderedIds.length; index += 1) {
      const cardId = orderedIds[index] ?? '';
      if (!cardId) {
        continue;
      }
      await pool.query(
        'UPDATE "KanbanCard" SET position = $2, "updatedAt" = NOW() WHERE id = $1 AND "columnId" = $3',
        [cardId, index, columnId]
      );
    }
    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

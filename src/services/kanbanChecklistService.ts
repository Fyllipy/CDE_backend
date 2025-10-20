import { pool, withTransaction } from "../db/pool";

export type KanbanChecklist = {
  id: string;
  cardId: string;
  title: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export type KanbanChecklistItem = {
  id: string;
  checklistId: string;
  title: string;
  position: number;
  doneAt: Date | null;
  assigneeId: string | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type KanbanChecklistWithItems = KanbanChecklist & { items: KanbanChecklistItem[] };

export async function getChecklistsByCardId(cardId: string): Promise<KanbanChecklistWithItems[]> {
  const [checklistsResult, itemsResult] = await Promise.all([
    pool.query<KanbanChecklist>(
      'SELECT id, "cardId", title, position, "createdAt", "updatedAt" FROM "KanbanChecklist" WHERE "cardId" = $1 ORDER BY position ASC',
      [cardId]
    ),
    pool.query<KanbanChecklistItem>(
      'SELECT id, "checklistId", title, position, "doneAt", "assigneeId", "dueDate", "createdAt", "updatedAt" FROM "KanbanChecklistItem" WHERE "checklistId" IN (SELECT id FROM "KanbanChecklist" WHERE "cardId" = $1) ORDER BY position ASC',
      [cardId]
    ),
  ]);

  const itemsByChecklist = new Map<string, KanbanChecklistItem[]>();
  for (const item of itemsResult.rows) {
    const list = itemsByChecklist.get(item.checklistId) ?? [];
    list.push(item);
    itemsByChecklist.set(item.checklistId, list);
  }

  return checklistsResult.rows.map((checklist) => ({
    ...checklist,
    items: itemsByChecklist.get(checklist.id) ?? [],
  }));
}

export async function createChecklist(cardId: string, title: string): Promise<KanbanChecklist> {
  return withTransaction(async (client) => {
    const positionResult = await client.query<{ max: number | null }>(
      'SELECT MAX(position) AS max FROM "KanbanChecklist" WHERE "cardId" = $1',
      [cardId]
    );
    const nextPosition = (positionResult.rows[0]?.max ?? -1) + 1;

    const result = await client.query<KanbanChecklist>(
      'INSERT INTO "KanbanChecklist" ("cardId", title, position) VALUES ($1, $2, $3) RETURNING id, "cardId", title, position, "createdAt", "updatedAt"',
      [cardId, title, nextPosition]
    );

    const checklist = result.rows[0];
    if (!checklist) {
      throw new Error("Unable to create checklist");
    }
    return checklist;
  });
}

export async function updateChecklist(checklistId: string, updates: { title?: string }): Promise<KanbanChecklist | undefined> {
  const result = await pool.query<KanbanChecklist>(
    'UPDATE "KanbanChecklist" SET title = COALESCE($2, title), "updatedAt" = NOW() WHERE id = $1 RETURNING id, "cardId", title, position, "createdAt", "updatedAt"',
    [checklistId, updates.title]
  );
  return result.rows[0];
}

export async function deleteChecklist(checklistId: string): Promise<void> {
  await pool.query('DELETE FROM "KanbanChecklist" WHERE id = $1', [checklistId]);
}

export async function reorderChecklists(cardId: string, orderedIds: string[]): Promise<void> {
  await withTransaction(async (client) => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      const checklistId = orderedIds[index];
      if (!checklistId) {
        continue;
      }
      await client.query(
        'UPDATE "KanbanChecklist" SET position = $2, "updatedAt" = NOW() WHERE id = $1 AND "cardId" = $3',
        [checklistId, index, cardId]
      );
    }
  });
}

export async function createChecklistItem(checklistId: string, title: string): Promise<KanbanChecklistItem> {
  return withTransaction(async (client) => {
    const positionResult = await client.query<{ max: number | null }>(
      'SELECT MAX(position) AS max FROM "KanbanChecklistItem" WHERE "checklistId" = $1',
      [checklistId]
    );
    const nextPosition = (positionResult.rows[0]?.max ?? -1) + 1;

    const result = await client.query<KanbanChecklistItem>(
      'INSERT INTO "KanbanChecklistItem" ("checklistId", title, position) VALUES ($1, $2, $3) RETURNING id, "checklistId", title, position, "doneAt", "assigneeId", "dueDate", "createdAt", "updatedAt"',
      [checklistId, title, nextPosition]
    );

    const item = result.rows[0];
    if (!item) {
      throw new Error("Unable to create checklist item");
    }
    return item;
  });
}

export async function updateChecklistItem(
  itemId: string,
  updates: {
    title?: string;
    doneAt?: string | null;
    assigneeId?: string | null;
    dueDate?: string | null;
  }
): Promise<KanbanChecklistItem | undefined> {
  const result = await pool.query<KanbanChecklistItem>(
    'UPDATE "KanbanChecklistItem" SET title = COALESCE($2, title), "doneAt" = $3, "assigneeId" = $4, "dueDate" = $5, "updatedAt" = NOW() WHERE id = $1 RETURNING id, "checklistId", title, position, "doneAt", "assigneeId", "dueDate", "createdAt", "updatedAt"',
    [itemId, updates.title, updates.doneAt ?? null, updates.assigneeId ?? null, updates.dueDate ?? null]
  );
  return result.rows[0];
}

export async function deleteChecklistItem(itemId: string): Promise<void> {
  await pool.query('DELETE FROM "KanbanChecklistItem" WHERE id = $1', [itemId]);
}

export async function reorderChecklistItems(checklistId: string, orderedIds: string[]): Promise<void> {
  await withTransaction(async (client) => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      const itemId = orderedIds[index];
      if (!itemId) {
        continue;
      }
      await client.query(
        'UPDATE "KanbanChecklistItem" SET position = $2, "updatedAt" = NOW() WHERE id = $1 AND "checklistId" = $3',
        [itemId, index, checklistId]
      );
    }
  });
}

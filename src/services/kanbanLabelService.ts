import { pool } from "../db/pool";

export interface KanbanLabel {
  id: string;
  projectId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createLabel(
  projectId: string,
  name: string,
  color: string
): Promise<KanbanLabel> {
  const result = await pool.query<KanbanLabel>(
    'INSERT INTO "KanbanLabel" ("projectId", name, color) VALUES ($1, $2, $3) RETURNING *',
    [projectId, name, color]
  );
  const label = result.rows[0];
  if (!label) {
    throw new Error("Unable to create label");
  }
  return label;
}

export async function getLabelsByProjectId(
  projectId: string
): Promise<KanbanLabel[]> {
  const result = await pool.query<KanbanLabel>(
    'SELECT * FROM "KanbanLabel" WHERE "projectId" = $1 ORDER BY "createdAt" ASC',
    [projectId]
  );
  return result.rows;
}

export async function updateLabel(
  labelId: string,
  updates: { name?: string; color?: string }
): Promise<KanbanLabel> {
  const result = await pool.query<KanbanLabel>(
    'UPDATE "KanbanLabel" SET name = COALESCE($2, name), color = COALESCE($3, color), "updatedAt" = NOW() WHERE id = $1 RETURNING *',
    [labelId, updates.name, updates.color]
  );
  const label = result.rows[0];
  if (!label) {
    throw new Error("Label not found or unable to update");
  }
  return label;
}

export async function deleteLabel(labelId: string): Promise<void> {
  await pool.query('DELETE FROM "KanbanLabel" WHERE id = $1', [labelId]);
}

export async function addLabelToCard(
  cardId: string,
  labelId: string
): Promise<void> {
  await pool.query(
    'INSERT INTO "KanbanCardLabel" ("cardId", "labelId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [cardId, labelId]
  );
}

export async function removeLabelFromCard(
  cardId: string,
  labelId: string
): Promise<void> {
  await pool.query(
    'DELETE FROM "KanbanCardLabel" WHERE "cardId" = $1 AND "labelId" = $2',
    [cardId, labelId]
  );
}

export async function getLabelsByCardId(cardId: string): Promise<KanbanLabel[]> {
  const result = await pool.query<KanbanLabel>(
    'SELECT l.* FROM "KanbanLabel" l JOIN "KanbanCardLabel" cl ON l.id = cl."labelId" WHERE cl."cardId" = $1',
    [cardId]
  );
  return result.rows;
}

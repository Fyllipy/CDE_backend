import { pool } from "../db/pool";

export interface KanbanActivity {
  id: string;
  cardId: string;
  actorId: string;
  type: string;
  data: any;
  createdAt: Date;
}

export async function createActivity(
  cardId: string,
  actorId: string,
  type: string,
  data: any
): Promise<KanbanActivity> {
  const result = await pool.query<KanbanActivity>(
    'INSERT INTO "KanbanActivity" ("cardId", "actorId", type, data) VALUES ($1, $2, $3, $4) RETURNING *',
    [cardId, actorId, type, data]
  );
  const activity = result.rows[0];
  if (!activity) {
    throw new Error("Unable to create activity");
  }
  return activity;
}

export async function getActivityByCardId(
  cardId: string
): Promise<KanbanActivity[]> {
  const result = await pool.query<KanbanActivity>(
    'SELECT * FROM "KanbanActivity" WHERE "cardId" = $1 ORDER BY "createdAt" DESC',
    [cardId]
  );
  return result.rows;
}

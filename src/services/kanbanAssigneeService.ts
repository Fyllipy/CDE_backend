import { pool } from "../db/pool";
import { User } from "../services/userService";

export async function addAssigneeToCard(
  cardId: string,
  userId: string
): Promise<void> {
  await pool.query(
    'INSERT INTO "KanbanCardAssignee" ("cardId", "userId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [cardId, userId]
  );
}

export async function removeAssigneeFromCard(
  cardId: string,
  userId: string
): Promise<void> {
  await pool.query(
    'DELETE FROM "KanbanCardAssignee" WHERE "cardId" = $1 AND "userId" = $2',
    [cardId, userId]
  );
}

export async function getAssigneesByCardId(cardId: string): Promise<User[]> {
  const result = await pool.query<User>(
    'SELECT u.id, u.name, u.email FROM "User" u JOIN "KanbanCardAssignee" ca ON u.id = ca."userId" WHERE ca."cardId" = $1',
    [cardId]
  );
  return result.rows;
}

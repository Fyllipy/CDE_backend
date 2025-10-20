import { pool } from "../db/pool";

export interface KanbanComment {
  id: string;
  cardId: string;
  authorId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createComment(
  cardId: string,
  authorId: string,
  body: string
): Promise<KanbanComment> {
  const result = await pool.query<KanbanComment>(
    'INSERT INTO "KanbanComment" ("cardId", "authorId", body) VALUES ($1, $2, $3) RETURNING *',
    [cardId, authorId, body]
  );
  const comment = result.rows[0];
  if (!comment) {
    throw new Error("Unable to create comment");
  }
  return comment;
}

export async function getCommentsByCardId(
  cardId: string
): Promise<KanbanComment[]> {
  const result = await pool.query<KanbanComment>(
    'SELECT * FROM "KanbanComment" WHERE "cardId" = $1 ORDER BY "createdAt" ASC',
    [cardId]
  );
  return result.rows;
}

export async function updateComment(
  commentId: string,
  body: string
): Promise<KanbanComment> {
  const result = await pool.query<KanbanComment>(
    'UPDATE "KanbanComment" SET body = $2, "updatedAt" = NOW() WHERE id = $1 RETURNING *',
    [commentId, body]
  );
  const comment = result.rows[0];
  if (!comment) {
    throw new Error("Comment not found or unable to update");
  }
  return comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  await pool.query('DELETE FROM "KanbanComment" WHERE id = $1', [commentId]);
}

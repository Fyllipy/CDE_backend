import { Request, Response } from "express";
import {
  createComment,
  deleteComment,
  getCommentsByCardId,
  updateComment,
} from "../services/kanbanCommentService";
import { getAuthUser } from "../middleware/authUtils";

export async function createCommentHandler(req: Request, res: Response) {
  const user = getAuthUser(req)!; // Middleware ensures user is present
  const cardId = req.params.cardId ?? "";
  const { body } = req.body as { body: string };

  if (!body) {
    return res.status(400).json({ message: "Comment body is required" });
  }

  try {
    const comment = await createComment(cardId, user.id, body);
    return res.status(201).json({ comment });
  } catch (error) {
    return res.status(500).json({ message: "Error creating comment" });
  }
}

export async function getCommentsHandler(req: Request, res: Response) {
  const cardId = req.params.cardId ?? "";

  try {
    const comments = await getCommentsByCardId(cardId);
    return res.json({ comments });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching comments" });
  }
}

export async function updateCommentHandler(req: Request, res: Response) {
  const commentId = req.params.commentId ?? "";
  const { body } = req.body as { body: string };

  if (!body) {
    return res.status(400).json({ message: "Comment body is required" });
  }

  // TODO: Add check to ensure the user is the author of the comment

  try {
    const comment = await updateComment(commentId, body);
    return res.json({ comment });
  } catch (error) {
    return res.status(500).json({ message: "Error updating comment" });
  }
}

export async function deleteCommentHandler(req: Request, res: Response) {
  const commentId = req.params.commentId ?? "";

  // TODO: Add check to ensure the user is the author of the comment or a project manager

  try {
    await deleteComment(commentId);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error deleting comment" });
  }
}

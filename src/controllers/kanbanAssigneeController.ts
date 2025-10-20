import { Request, Response } from "express";
import { getMembership } from "../services/projectService";
import {
  addAssigneeToCard,
  removeAssigneeFromCard,
} from "../services/kanbanAssigneeService";

export async function addAssigneeHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const cardId = req.params.cardId ?? "";
  const { userId } = req.body as { userId: string };

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const isAssigneeMember = await getMembership(projectId, userId);
    if (!isAssigneeMember) {
      return res
        .status(403)
        .json({ message: "Assigned user is not a project member" });
    }

    await addAssigneeToCard(cardId, userId);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error adding assignee to card" });
  }
}

export async function removeAssigneeHandler(req: Request, res: Response) {
  const cardId = req.params.cardId ?? "";
  const userId = req.params.userId ?? "";

  try {
    await removeAssigneeFromCard(cardId, userId);
    return res.status(204).send();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error removing assignee from card" });
  }
}

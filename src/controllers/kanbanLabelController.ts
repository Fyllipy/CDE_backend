import { Request, Response } from "express";
import {
  addLabelToCard,
  createLabel,
  deleteLabel,
  getLabelsByProjectId,
  removeLabelFromCard,
  updateLabel,
} from "../services/kanbanLabelService";
import { getMembership } from "../services/projectService";

export async function createLabelHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  const { name, color } = req.body as { name: string; color: string };
  let membership = (req as Request & { projectMembership?: { role: string; userId: string } }).projectMembership;

  if (!membership) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (userId) {
      membership = await getMembership(projectId, userId);
    }
  }

  const role = (membership?.role ?? "").trim().toUpperCase();
    console.log('createLabelHandler role:', membership?.role, 'normalized:', role, 'projectId:', projectId);
  if (!membership || role !== "MANAGER") {
    return res.status(403).json({ message: "Only project managers can create labels" });
  }

  if (!name || !color) {
    return res.status(400).json({ message: "Label name and color are required" });
  }

  try {
    const label = await createLabel(projectId, name, color);
    return res.status(201).json({ label });
  } catch (error) {
    // @ts-ignore
    if (error.constraint === "unique_project_label_name") {
      return res.status(409).json({ message: "Label name already exists" });
    }
    return res.status(500).json({ message: "Error creating label" });
  }
}

export async function getLabelsHandler(req: Request, res: Response) {
  const projectId = req.params.projectId ?? "";
  try {
    const labels = await getLabelsByProjectId(projectId);
    return res.json({ labels });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching labels" });
  }
}

export async function updateLabelHandler(req: Request, res: Response) {
  const labelId = req.params.labelId ?? "";
  const { name, color } = req.body as { name?: string; color?: string };
  let membership = (req as Request & { projectMembership?: { role: string; userId: string } }).projectMembership;
  if (!membership) {
    const projectId = req.params.projectId ?? "";
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (userId) {
      membership = await getMembership(projectId, userId);
    }
  }

  const role = (membership?.role ?? "").trim().toUpperCase();
  if (!membership || role !== "MANAGER") {
    return res.status(403).json({ message: "Only project managers can update labels" });
  }

  if (!name && !color) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  try {
    const label = await updateLabel(labelId, { name, color });
    return res.json({ label });
  } catch (error) {
    return res.status(500).json({ message: "Error updating label" });
  }
}

export async function deleteLabelHandler(req: Request, res: Response) {
  const labelId = req.params.labelId ?? "";
  let membership = (req as Request & { projectMembership?: { role: string; userId: string } }).projectMembership;
  if (!membership) {
    const projectId = req.params.projectId ?? "";
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (userId) {
      membership = await getMembership(projectId, userId);
    }
  }

  const role = (membership?.role ?? "").trim().toUpperCase();
  if (!membership || role !== "MANAGER") {
    return res.status(403).json({ message: "Only project managers can delete labels" });
  }
  try {
    await deleteLabel(labelId);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error deleting label" });
  }
}

export async function addLabelToCardHandler(req: Request, res: Response) {
  const cardId = req.params.cardId ?? "";
  const { labelId } = req.body as { labelId: string };

  if (!labelId) {
    return res.status(400).json({ message: "Label ID is required" });
  }

  try {
    await addLabelToCard(cardId, labelId);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error adding label to card" });
  }
}

export async function removeLabelFromCardHandler(req: Request, res: Response) {
  const cardId = req.params.cardId ?? "";
  const labelId = req.params.labelId ?? "";

  try {
    await removeLabelFromCard(cardId, labelId);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error removing label from card" });
  }
}

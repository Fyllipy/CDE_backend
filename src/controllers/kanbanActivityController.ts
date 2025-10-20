import { Request, Response } from "express";
import { getActivityByCardId } from "../services/kanbanActivityService";

export async function getActivityHandler(req: Request, res: Response) {
  const cardId = req.params.cardId ?? "";

  try {
    const activities = await getActivityByCardId(cardId);
    return res.json({ activities });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching activities" });
  }
}

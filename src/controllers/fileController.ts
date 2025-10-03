import { Request, Response } from "express";
import { promises as fs } from "fs";
import { listFiles, createOrUpdateFileRevision, getRevisionById } from "../services/fileService";
import { getMembership, getNamingStandard } from "../services/projectService";

function getAuthUser(req: Request): { id: string } | undefined {
  return (req as Request & { user?: { id: string } }).user;
}

export async function listProjectFiles(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!projectId) {
    return res.status(400).json({ message: "Project id is required" });
  }

  const membership = await getMembership(projectId, user.id);
  if (!membership) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const files = await listFiles(projectId);
  return res.json({ files });
}

export async function uploadFile(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const file = (req as Request & { file?: Express.Multer.File }).file;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!projectId) {
    return res.status(400).json({ message: "Project id is required" });
  }

  if (!file) {
    return res.status(400).json({ message: "File is required" });
  }

  const membership = await getMembership(projectId, user.id);
  if (!membership) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const pattern = await getNamingStandard(projectId);
  if (!pattern) {
    return res.status(400).json({ message: "Naming standard not configured" });
  }

  const result = await createOrUpdateFileRevision({
    projectId,
    fileBuffer: file.buffer,
    originalFilename: file.originalname,
    uploadedBy: user.id,
    namingPattern: pattern
  });

  return res.status(201).json(result);
}

export async function downloadRevision(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const revisionId = req.params.revisionId ?? '';

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!projectId || !revisionId) {
    return res.status(400).json({ message: "Identifiers are required" });
  }

  const membership = await getMembership(projectId, user.id);
  if (!membership) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const revision = await getRevisionById(revisionId);
  if (!revision) {
    return res.status(404).json({ message: "Revision not found" });
  }

  const fileBuffer = await fs.readFile(revision.storagePath);
  res.setHeader("Content-Disposition", 'attachment; filename="' + revision.originalFilename + '"');
  res.send(fileBuffer);
}

import { Request, Response } from 'express';
import { promises as fs } from 'fs';
import {
  createGeneralDocument,
  deleteGeneralDocument,
  getGeneralDocument,
  listGeneralDocuments
} from '../services/generalDocumentService';
import { getMembership, assertManager } from '../services/projectService';

function getAuthUser(req: Request): { id: string } | undefined {
  return (req as Request & { user?: { id: string } }).user;
}

export async function listGeneralDocs(req: Request, res: Response) {
  const user = getAuthUser(req);
  const { projectId } = req.params;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!projectId) {
    return res.status(400).json({ message: 'Project id is required' });
  }

  const membership = await getMembership(projectId, user.id);
  if (!membership) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const documents = await listGeneralDocuments(projectId);
  return res.json({ documents });
}

export async function createGeneralDoc(req: Request, res: Response) {
  const user = getAuthUser(req);
  const { projectId } = req.params;
  const file = (req as Request & { file?: Express.Multer.File }).file;
  const { category, description } = req.body as { category?: string; description?: string };

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!projectId) {
    return res.status(400).json({ message: 'Project id is required' });
  }

  if (!file) {
    return res.status(400).json({ message: 'File is required' });
  }

  const membership = await getMembership(projectId, user.id);
  if (!membership) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const document = await createGeneralDocument({
    projectId,
    fileBuffer: file.buffer,
    originalFilename: file.originalname,
    uploadedById: user.id,
    category: category ?? 'others',
    description
  });

  return res.status(201).json({ document });
}

export async function deleteGeneralDoc(req: Request, res: Response) {
  const user = getAuthUser(req);
  const { projectId, documentId } = req.params;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!projectId || !documentId) {
    return res.status(400).json({ message: 'Identifiers are required' });
  }

  try {
    await assertManager(projectId, user.id);
  } catch {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    await deleteGeneralDocument(projectId, documentId);
  } catch (err) {
    const status = (err as Error & { status?: number }).status ?? 500;
    const message = status === 404 ? 'Document not found' : 'Unable to delete document';
    return res.status(status).json({ message });
  }

  return res.status(204).send();
}

export async function downloadGeneralDoc(req: Request, res: Response) {
  const user = getAuthUser(req);
  const { projectId, documentId } = req.params;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!projectId || !documentId) {
    return res.status(400).json({ message: 'Identifiers are required' });
  }

  const membership = await getMembership(projectId, user.id);
  if (!membership) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const document = await getGeneralDocument(projectId, documentId);
  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const fileBuffer = await fs.readFile(document.storagePath);
  res.setHeader('Content-Disposition', 'attachment; filename="' + document.originalFilename + '"');
  res.send(fileBuffer);
}

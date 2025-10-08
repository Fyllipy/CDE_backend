import { Request, Response } from "express";
import { promises as fs } from "fs";
import { listFiles, createOrUpdateFileRevision, getRevisionById, deleteFile, deleteRevision, updateRevisionMeta } from "../services/fileService";
import { getMembership, getNamingStandard, assertManager } from "../services/projectService";

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

type UploadedFileMap = Record<string, Express.Multer.File[]>;

function pickFile(map: UploadedFileMap | undefined, key: string): Express.Multer.File | undefined {
  const entry = map?.[key];
  if (!entry || !entry.length) {
    return undefined;
  }
  return entry[0];
}

export async function uploadFile(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const { description, drawingName } = req.body as { description?: string; drawingName?: string };
  const files = (req as Request & { files?: UploadedFileMap }).files;

  const pdfFile = pickFile(files, "pdfFile");
  const dxfFile = pickFile(files, "dxfFile");
  let legacy = pickFile(files, "file");
  const single = (req as Request & { file?: Express.Multer.File }).file;
  if (!legacy && single) {
    legacy = single;
  }

  let resolvedPdf = pdfFile;
  let resolvedDxf = dxfFile;

  if (!resolvedPdf && !resolvedDxf && legacy) {
    const ext = legacy.originalname.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      resolvedPdf = legacy;
    } else if (ext === "dxf") {
      resolvedDxf = legacy;
    } else {
      return res.status(400).json({ message: "Only PDF or DXF files are supported" });
    }
  }

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!projectId) {
    return res.status(400).json({ message: "Project id is required" });
  }

  if (!resolvedPdf && !resolvedDxf) {
    return res.status(400).json({ message: "At least one file (PDF or DXF) is required" });
  }

  if (resolvedPdf && !resolvedPdf.originalname.toLowerCase().endsWith(".pdf")) {
    return res.status(400).json({ message: "PDF file must have .pdf extension" });
  }
  if (resolvedDxf && !resolvedDxf.originalname.toLowerCase().endsWith(".dxf")) {
    return res.status(400).json({ message: "DXF file must have .dxf extension" });
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
    uploadedBy: user.id,
    namingPattern: pattern,
    description: description?.trim() || undefined,
    drawingName: drawingName?.trim() || undefined,
    pdfFile: resolvedPdf
      ? {
          buffer: resolvedPdf.buffer,
          originalFilename: resolvedPdf.originalname
        }
      : undefined,
    dxfFile: resolvedDxf
      ? {
          buffer: resolvedDxf.buffer,
          originalFilename: resolvedDxf.originalname
        }
      : undefined
  });

  return res.status(201).json(result);
}

export async function downloadRevision(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const revisionId = req.params.revisionId ?? '';
  const formatParam = typeof req.query.format === "string" ? req.query.format.toLowerCase() : undefined;

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

  const format = formatParam === "dxf" ? "dxf" : formatParam === "pdf" ? "pdf" : revision.pdfStoragePath ? "pdf" : "dxf";
  if (!format) {
    return res.status(404).json({ message: "Revision file not found" });
  }

  const storagePath = format === "pdf" ? revision.pdfStoragePath : revision.dxfStoragePath;
  const originalFilename = format === "pdf" ? revision.pdfOriginalFilename : revision.dxfOriginalFilename;

  if (!storagePath || !originalFilename) {
    return res.status(404).json({ message: "Requested format not available for this revision" });
  }

  const fileBuffer = await fs.readFile(storagePath);
  res.setHeader("Content-Disposition", 'attachment; filename="' + originalFilename + '"');
  if (format === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
  } else if (format === "dxf") {
    res.setHeader("Content-Type", "application/dxf");
  }
  res.send(fileBuffer);
}

export async function updateRevisionHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const revisionId = req.params.revisionId ?? '';
  const { description, drawingName } = req.body as { description?: string; drawingName?: string };

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!projectId || !revisionId) {
    return res.status(400).json({ message: 'Identifiers are required' });
  }

  // Permitir que qualquer membro edite anotações; manter verificação de participação
  const membership = await getMembership(projectId, user.id);
  if (!membership) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await updateRevisionMeta(projectId, revisionId, {
    description: typeof description === 'string' ? description : undefined,
    drawingName: typeof drawingName === 'string' ? drawingName : undefined
  });

  return res.status(204).send();
}

export async function deleteFileHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const fileId = req.params.fileId ?? '';

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!projectId || !fileId) {
    return res.status(400).json({ message: "Identifiers are required" });
  }

  try {
    await assertManager(projectId, user.id);
  } catch {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    await deleteFile(projectId, fileId);
  } catch (err) {
    const status = (err as Error & { status?: number }).status ?? 500;
    const message = status === 404 ? 'File not found' : 'Unable to delete file';
    return res.status(status).json({ message });
  }

  return res.status(204).send();
}

export async function deleteRevisionHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const revisionId = req.params.revisionId ?? '';

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!projectId || !revisionId) {
    return res.status(400).json({ message: 'Identifiers are required' });
  }

  try {
    await assertManager(projectId, user.id);
  } catch {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    await deleteRevision(projectId, revisionId);
  } catch (err) {
    const status = (err as Error & { status?: number }).status ?? 500;
    const message = status === 404 ? 'Revision not found' : 'Unable to delete revision';
    return res.status(status).json({ message });
  }

  return res.status(204).send();
}

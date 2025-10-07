import { promises as fs } from 'fs';
import { join } from 'path';
import { pool } from '../db/pool';
import { env } from '../config/env';

export type GeneralDocumentCategory = 'photos' | 'documents' | 'received' | 'others';

export interface GeneralDocument {
  id: string;
  projectId: string;
  category: GeneralDocumentCategory;
  originalFilename: string;
  storagePath: string;
  description: string | null;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
}

const CATEGORIES: GeneralDocumentCategory[] = ['photos', 'documents', 'received', 'others'];

function assertCategory(value: string): GeneralDocumentCategory {
  if (CATEGORIES.includes(value as GeneralDocumentCategory)) {
    return value as GeneralDocumentCategory;
  }
  return 'others';
}

async function ensureGeneralDir() {
  await fs.mkdir(env.generalUploadDir, { recursive: true });
}

function buildStoragePath(projectId: string, docId: string, originalName: string): string {
  const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  return join(env.generalUploadDir, projectId, docId + '_' + safeName);
}

export async function createGeneralDocument(options: {
  projectId: string;
  fileBuffer: Buffer;
  originalFilename: string;
  uploadedById: string;
  description?: string;
  category: string;
}): Promise<GeneralDocument> {
  const category = assertCategory(options.category);
  await ensureGeneralDir();

  const insert = await pool.query<GeneralDocument>(
    'INSERT INTO "GeneralDocument" ("projectId", category, "originalFilename", "storagePath", description, "uploadedById") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, "projectId", category, "originalFilename", "storagePath", description, "uploadedById", "createdAt", "updatedAt"',
    [options.projectId, category, options.originalFilename, '', options.description ?? null, options.uploadedById]
  );

  const document = insert.rows[0];
  if (!document) {
    throw new Error('Unable to create general document');
  }

  const storagePath = buildStoragePath(options.projectId, document.id, options.originalFilename);
  await fs.mkdir(join(env.generalUploadDir, options.projectId), { recursive: true });
  await fs.writeFile(storagePath, options.fileBuffer);

  const update = await pool.query<GeneralDocument>(
    'UPDATE "GeneralDocument" SET "storagePath" = $2, "updatedAt" = NOW() WHERE id = $1 RETURNING id, "projectId", category, "originalFilename", "storagePath", description, "uploadedById", "createdAt", "updatedAt"',
    [document.id, storagePath]
  );

  const updated = update.rows[0];
  if (!updated) {
    throw new Error('Unable to finalize general document');
  }

  return updated;
}

export async function listGeneralDocuments(projectId: string): Promise<Record<GeneralDocumentCategory, GeneralDocument[]>> {
  const result = await pool.query<GeneralDocument>(
    'SELECT id, "projectId", category, "originalFilename", "storagePath", description, "uploadedById", "createdAt", "updatedAt" FROM "GeneralDocument" WHERE "projectId" = $1 ORDER BY "createdAt" DESC',
    [projectId]
  );

  const grouped: Record<GeneralDocumentCategory, GeneralDocument[]> = {
    photos: [],
    documents: [],
    received: [],
    others: []
  };

  for (const doc of result.rows) {
    const category = assertCategory(doc.category);
    grouped[category].push(doc);
  }

  return grouped;
}

export async function getGeneralDocument(projectId: string, documentId: string): Promise<GeneralDocument | null> {
  const result = await pool.query<GeneralDocument>(
    'SELECT id, "projectId", category, "originalFilename", "storagePath", description, "uploadedById", "createdAt", "updatedAt" FROM "GeneralDocument" WHERE id = $1 AND "projectId" = $2',
    [documentId, projectId]
  );
  return result.rows[0] ?? null;
}

export async function deleteGeneralDocument(projectId: string, documentId: string): Promise<void> {
  const document = await getGeneralDocument(projectId, documentId);
  if (!document) {
    throw Object.assign(new Error('Document not found'), { status: 404 });
  }

  await pool.query('DELETE FROM "GeneralDocument" WHERE id = $1 AND "projectId" = $2', [documentId, projectId]);

  try {
    await fs.unlink(document.storagePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }
}

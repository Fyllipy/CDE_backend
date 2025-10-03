import { promises as fs } from "fs";
import { join } from "path";
import { pool, withTransaction } from "../db/pool";
import { env } from "../config/env";

export interface StoredFile {
  id: string;
  projectId: string;
  baseName: string;
  extension: string;
  currentRevisionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileRevision {
  id: string;
  fileId: string;
  revisionIndex: number;
  revisionLabel: string;
  uploadedById: string;
  uploadedByName?: string;
  uploadedByEmail?: string;
  storagePath: string;
  originalFilename: string;
  createdAt: Date;
}

export function ensureUploadDir() {
  return fs.mkdir(env.uploadDir, { recursive: true });
}

function getRevisionLabel(index: number): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letter = alphabet[index] ?? "X" + index.toString();
  return "rev" + letter;
}

function deriveBaseName(raw: string): string {
  const revisionPattern = /(.*)[-_]rev([A-Za-z]+)$/i;
  const match = revisionPattern.exec(raw);
  if (match) {
    return match[1] ?? raw;
  }
  return raw;
}

export function buildStoragePath(projectId: string, fileId: string, revisionLabel: string, extension: string): string {
  return join(env.uploadDir, projectId, fileId, revisionLabel + "." + extension);
}

export async function validateAgainstNamingStandard(baseName: string, pattern: string): Promise<void> {
  const tokens = pattern.split("-");
  const values = baseName.split("-");
  if (tokens.length !== values.length) {
    throw Object.assign(new Error("Nome de arquivo não segue o padrão"), { status: 400 });
  }

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i] ?? "";
    const value = values[i] ?? "";
    if (!token || !value) {
      throw Object.assign(new Error("Segmento vazio na nomenclatura"), { status: 400 });
    }
    const isPlaceholder = token.startsWith("{") && token.endsWith("}");
    if (!isPlaceholder && token !== value) {
      throw Object.assign(new Error('Segmento "' + value + '" não corresponde a "' + token + '"'), { status: 400 });
    }
  }
}

function splitNameAndExtension(original: string): { baseName: string; extension: string } {
  const segments = original.split('.');
  if (segments.length <= 1) {
    return { baseName: original, extension: 'dat' };
  }
  const extension = segments.pop() ?? 'dat';
  const baseName = segments.join('.') || original;
  return { baseName, extension };
}

export async function createOrUpdateFileRevision(options: {
  projectId: string;
  fileBuffer: Buffer;
  originalFilename: string;
  uploadedBy: string;
  namingPattern: string;
  overrideBaseName?: string;
}): Promise<{ file: StoredFile; revision: FileRevision }> {
  return withTransaction(async (client) => {
    await ensureUploadDir();

    const nameInfo = splitNameAndExtension(options.overrideBaseName ?? options.originalFilename);
    const baseName = deriveBaseName(nameInfo.baseName);

    await validateAgainstNamingStandard(baseName, options.namingPattern);

    const fileResult = await client.query<StoredFile>(
      'SELECT id, "projectId", "baseName", extension, "currentRevisionId", "createdAt", "updatedAt" FROM "File" WHERE "projectId" = $1 AND "baseName" = $2',
      [options.projectId, baseName]
    );

    let file = fileResult.rows[0] ?? null;
    let revisionIndex = 0;

    if (!file) {
      const inserted = await client.query<StoredFile>(
        'INSERT INTO "File" ("projectId", "baseName", extension) VALUES ($1, $2, $3) RETURNING id, "projectId", "baseName", extension, "currentRevisionId", "createdAt", "updatedAt"',
        [options.projectId, baseName, nameInfo.extension]
      );
      file = inserted.rows[0] ?? null;
    } else {
      const countResult = await client.query<{ total: string }>(
        'SELECT COUNT(*)::text as total FROM "FileRevision" WHERE "fileId" = $1',
        [file.id]
      );
      revisionIndex = Number(countResult.rows[0]?.total ?? "0");
    }

    if (!file) {
      throw new Error('Unable to persist file metadata');
    }

    const revisionLabel = getRevisionLabel(revisionIndex);
    const storagePath = buildStoragePath(options.projectId, file.id, revisionLabel, nameInfo.extension);

    await fs.mkdir(join(env.uploadDir, options.projectId, file.id), { recursive: true });
    await fs.writeFile(storagePath, options.fileBuffer);

    const revisionInsert = await client.query<FileRevision>(
      'INSERT INTO "FileRevision" ("fileId", "revisionIndex", "revisionLabel", "uploadedById", "storagePath", "originalFilename") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, "fileId", "revisionIndex", "revisionLabel", "uploadedById", "storagePath", "originalFilename", "createdAt"',
      [file.id, revisionIndex, revisionLabel, options.uploadedBy, storagePath, options.originalFilename]
    );

    const insertedRevision = revisionInsert.rows[0];
    if (!insertedRevision) {
      throw new Error('Unable to persist file revision');
    }

    const revision: FileRevision = {
      ...insertedRevision,
      uploadedByName: undefined,
      uploadedByEmail: undefined
    };

    const updated = await client.query<StoredFile>(
      'UPDATE "File" SET "currentRevisionId" = $2, "updatedAt" = NOW() WHERE id = $1 RETURNING id, "projectId", "baseName", extension, "currentRevisionId", "createdAt", "updatedAt"',
      [file.id, revision.id]
    );

    const updatedFile = updated.rows[0];
    if (!updatedFile) {
      throw new Error('Unable to update file revision pointer');
    }

    return { file: updatedFile, revision };
  });
}

export async function listFiles(projectId: string): Promise<Array<StoredFile & { revisions: FileRevision[] }>> {
  const filesResult = await pool.query<StoredFile>(
    'SELECT id, "projectId", "baseName", extension, "currentRevisionId", "createdAt", "updatedAt" FROM "File" WHERE "projectId" = $1 ORDER BY "updatedAt" DESC',
    [projectId]
  );

  if (!filesResult.rowCount) {
    return [];
  }

  const fileIds = filesResult.rows.map((item: StoredFile) => item.id);
  const revisionsResult = await pool.query<FileRevision>(
    'SELECT fr.id, fr."fileId", fr."revisionIndex", fr."revisionLabel", fr."uploadedById", fr."storagePath", fr."originalFilename", fr."createdAt", u.name as "uploadedByName", u.email as "uploadedByEmail" FROM "FileRevision" fr LEFT JOIN "User" u ON u.id = fr."uploadedById" WHERE fr."fileId" = ANY($1::uuid[]) ORDER BY fr."revisionIndex" DESC',
    [fileIds]
  );

  const revisionsByFile = new Map<string, FileRevision[]>();
  for (const revision of revisionsResult.rows) {
    const existing = revisionsByFile.get(revision.fileId) ?? [];
    existing.push(revision);
    revisionsByFile.set(revision.fileId, existing);
  }

  return filesResult.rows.map((item: StoredFile) => ({
    ...item,
    revisions: revisionsByFile.get(item.id) ?? []
  }));
}

export async function getRevisionById(id: string): Promise<FileRevision | undefined> {
  const result = await pool.query<FileRevision>(
    'SELECT fr.id, fr."fileId", fr."revisionIndex", fr."revisionLabel", fr."uploadedById", fr."storagePath", fr."originalFilename", fr."createdAt", u.name as "uploadedByName", u.email as "uploadedByEmail" FROM "FileRevision" fr LEFT JOIN "User" u ON u.id = fr."uploadedById" WHERE fr.id = $1',
    [id]
  );
  return result.rows[0];
}

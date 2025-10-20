import { pool } from "../db/pool";

export type KanbanCustomFieldType = "TEXT" | "NUMBER" | "DATE" | "LIST" | "BOOLEAN";

export type KanbanCustomFieldDef = {
  id: string;
  projectId: string;
  name: string;
  type: KanbanCustomFieldType;
  options: any;
  required: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type KanbanCardCustomFieldValue = {
  cardId: string;
  fieldId: string;
  value: any;
  updatedAt: Date;
};

export type KanbanCardCustomField = KanbanCustomFieldDef & { value: any | null };

export async function createCustomFieldDef(
  projectId: string,
  name: string,
  type: KanbanCustomFieldType,
  options: any = null,
  required = false
): Promise<KanbanCustomFieldDef> {
  const result = await pool.query<KanbanCustomFieldDef>(
    'INSERT INTO "KanbanCustomFieldDef" ("projectId", name, type, options, required) VALUES ($1, $2, $3, $4, $5) RETURNING id, "projectId", name, type, options, required, "createdAt", "updatedAt"',
    [projectId, name, type, options, required]
  );
  const field = result.rows[0];
  if (!field) {
    throw new Error("Unable to create custom field");
  }
  return field;
}

export async function getCustomFieldDefsByProject(projectId: string): Promise<KanbanCustomFieldDef[]> {
  const result = await pool.query<KanbanCustomFieldDef>(
    'SELECT id, "projectId", name, type, options, required, "createdAt", "updatedAt" FROM "KanbanCustomFieldDef" WHERE "projectId" = $1 ORDER BY "createdAt" ASC',
    [projectId]
  );
  return result.rows;
}

export async function updateCustomFieldDef(
  fieldId: string,
  updates: { name?: string; type?: KanbanCustomFieldType; options?: any; required?: boolean }
): Promise<KanbanCustomFieldDef | undefined> {
  const result = await pool.query<KanbanCustomFieldDef>(
    'UPDATE "KanbanCustomFieldDef" SET name = COALESCE($2, name), type = COALESCE($3, type), options = $4, required = COALESCE($5, required), "updatedAt" = NOW() WHERE id = $1 RETURNING id, "projectId", name, type, options, required, "createdAt", "updatedAt"',
    [fieldId, updates.name, updates.type, updates.options ?? null, updates.required]
  );
  return result.rows[0];
}

export async function deleteCustomFieldDef(fieldId: string): Promise<void> {
  await pool.query('DELETE FROM "KanbanCustomFieldDef" WHERE id = $1', [fieldId]);
}

export async function upsertCardCustomFieldValue(
  cardId: string,
  fieldId: string,
  value: any
): Promise<KanbanCardCustomFieldValue> {
  const result = await pool.query<KanbanCardCustomFieldValue>(
    'INSERT INTO "KanbanCardCustomField" ("cardId", "fieldId", value) VALUES ($1, $2, $3) ON CONFLICT ("cardId", "fieldId") DO UPDATE SET value = $3, "updatedAt" = NOW() RETURNING "cardId", "fieldId", value, "updatedAt"',
    [cardId, fieldId, value]
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Unable to persist custom field value");
  }
  return row;
}

export async function getCustomFieldValuesForCard(cardId: string): Promise<KanbanCardCustomField[]> {
  const result = await pool.query<{
    id: string;
    projectId: string;
    name: string;
    type: KanbanCustomFieldType;
    options: any;
    required: boolean;
    createdAt: Date;
    updatedAt: Date;
    value: any;
  }>(
    `SELECT d.id,
            d."projectId",
            d.name,
            d.type,
            d.options,
            d.required,
            d."createdAt",
            d."updatedAt",
            c.value
       FROM "KanbanCustomFieldDef" d
       LEFT JOIN "KanbanCardCustomField" c ON c."fieldId" = d.id AND c."cardId" = $1
       WHERE d."projectId" = (SELECT "projectId" FROM "KanbanCard" WHERE id = $1)
       ORDER BY d."createdAt" ASC`,
    [cardId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    type: row.type,
    options: row.options,
    required: row.required,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    value: row.value ?? null,
  }));
}

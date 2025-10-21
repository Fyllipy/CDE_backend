CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Project" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ProjectMembership" (
    "projectId" UUID NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("projectId", "userId")
);

CREATE TABLE IF NOT EXISTS "NamingStandard" (
    "projectId" UUID PRIMARY KEY REFERENCES "Project"(id) ON DELETE CASCADE,
    pattern TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "File" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    "baseName" TEXT NOT NULL,
    extension TEXT NOT NULL,
    "currentRevisionId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_project_filename UNIQUE ("projectId", "baseName")
);

CREATE TABLE IF NOT EXISTS "FileRevision" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "fileId" UUID NOT NULL REFERENCES "File"(id) ON DELETE CASCADE,
    "revisionIndex" INTEGER NOT NULL,
    "revisionLabel" TEXT NOT NULL,
    "uploadedById" UUID NOT NULL REFERENCES "User"(id),
    "pdfStoragePath" TEXT,
    "pdfOriginalFilename" TEXT,
    "dxfStoragePath" TEXT,
    "dxfOriginalFilename" TEXT,
    "drawingName" TEXT,
    description TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_file_revision UNIQUE ("fileId", "revisionIndex")
);

ALTER TABLE "File"
  ADD CONSTRAINT fk_current_revision FOREIGN KEY ("currentRevisionId") REFERENCES "FileRevision"(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "KanbanColumn" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    color TEXT NOT NULL DEFAULT '#2563eb',
    "wipLimit" INTEGER,
    "archivedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_project_column UNIQUE ("projectId", position)
);

CREATE TABLE IF NOT EXISTS "KanbanCard" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "columnId" UUID NOT NULL REFERENCES "KanbanColumn"(id) ON DELETE CASCADE,
    "projectId" UUID NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    priority TEXT,
    "startDate" TIMESTAMPTZ,
    "dueDate" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "archivedAt" TIMESTAMPTZ
);

ALTER TABLE "KanbanCard"
    ADD COLUMN IF NOT EXISTS "parentId" UUID REFERENCES "KanbanCard"(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_kanbancard_project ON "KanbanCard"("projectId");
CREATE INDEX IF NOT EXISTS idx_kanbancard_archived ON "KanbanCard"("archivedAt");
CREATE INDEX IF NOT EXISTS idx_kanbancard_parent ON "KanbanCard"("parentId");

CREATE TABLE IF NOT EXISTS "KanbanLabel" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_project_label_name UNIQUE ("projectId", name)
);

CREATE TABLE IF NOT EXISTS "KanbanCardLabel" (
    "cardId" UUID NOT NULL REFERENCES "KanbanCard"(id) ON DELETE CASCADE,
    "labelId" UUID NOT NULL REFERENCES "KanbanLabel"(id) ON DELETE CASCADE,
    "addedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("cardId", "labelId")
);

CREATE TABLE IF NOT EXISTS "KanbanCardAssignee" (
    "cardId" UUID NOT NULL REFERENCES "KanbanCard"(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("cardId", "userId")
);

CREATE TABLE IF NOT EXISTS "KanbanChecklist" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "cardId" UUID NOT NULL REFERENCES "KanbanCard"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "KanbanChecklistItem" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "checklistId" UUID NOT NULL REFERENCES "KanbanChecklist"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    "doneAt" TIMESTAMPTZ,
    "assigneeId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "dueDate" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "KanbanCustomFieldDef" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    options JSONB,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_project_field_name UNIQUE ("projectId", name)
);

CREATE TABLE IF NOT EXISTS "KanbanCardCustomField" (
    "cardId" UUID NOT NULL REFERENCES "KanbanCard"(id) ON DELETE CASCADE,
    "fieldId" UUID NOT NULL REFERENCES "KanbanCustomFieldDef"(id) ON DELETE CASCADE,
    value JSONB,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("cardId", "fieldId")
);

CREATE INDEX IF NOT EXISTS idx_kanbanchecklist_card ON "KanbanChecklist"("cardId");
CREATE INDEX IF NOT EXISTS idx_kanbanchecklistitem_checklist ON "KanbanChecklistItem"("checklistId");
CREATE INDEX IF NOT EXISTS idx_kanbanchecklistitem_assignee ON "KanbanChecklistItem"("assigneeId");
CREATE INDEX IF NOT EXISTS idx_kanbancustomfield_project ON "KanbanCustomFieldDef"("projectId");
CREATE INDEX IF NOT EXISTS idx_kanbancardcustomfield_card ON "KanbanCardCustomField"("cardId");
CREATE INDEX IF NOT EXISTS idx_kanbancardcustomfield_field ON "KanbanCardCustomField"("fieldId");

CREATE INDEX IF NOT EXISTS idx_file_project ON "File"("projectId");
CREATE INDEX IF NOT EXISTS idx_filerevision_file ON "FileRevision"("fileId");
CREATE INDEX IF NOT EXISTS idx_kanbancolumn_project ON "KanbanColumn"("projectId");
CREATE INDEX IF NOT EXISTS idx_kanbancard_column ON "KanbanCard"("columnId");

CREATE TABLE IF NOT EXISTS "KanbanComment" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "cardId" UUID NOT NULL REFERENCES "KanbanCard"(id) ON DELETE CASCADE,
    "authorId" UUID NOT NULL REFERENCES "User"(id),
    body TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "KanbanActivity" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "cardId" UUID NOT NULL REFERENCES "KanbanCard"(id) ON DELETE CASCADE,
    "actorId" UUID NOT NULL REFERENCES "User"(id),
    type TEXT NOT NULL,
    data JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "GeneralDocument" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    description TEXT,
    "uploadedById" UUID NOT NULL REFERENCES "User"(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generaldoc_project ON "GeneralDocument"("projectId");

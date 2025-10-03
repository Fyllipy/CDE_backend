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
    "storagePath" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_project ON "File"("projectId");
CREATE INDEX IF NOT EXISTS idx_filerevision_file ON "FileRevision"("fileId");
CREATE INDEX IF NOT EXISTS idx_kanbancolumn_project ON "KanbanColumn"("projectId");
CREATE INDEX IF NOT EXISTS idx_kanbancard_column ON "KanbanCard"("columnId");

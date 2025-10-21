BEGIN;

ALTER TABLE "FileRevision"
    ADD COLUMN IF NOT EXISTS "pdfStoragePath" TEXT,
    ADD COLUMN IF NOT EXISTS "pdfOriginalFilename" TEXT,
    ADD COLUMN IF NOT EXISTS "dxfStoragePath" TEXT,
    ADD COLUMN IF NOT EXISTS "dxfOriginalFilename" TEXT,
    ADD COLUMN IF NOT EXISTS "drawingName" TEXT;

UPDATE "FileRevision"
SET
    "pdfStoragePath" = COALESCE(
        "pdfStoragePath",
        CASE
            WHEN "storagePath" IS NOT NULL AND lower(right("storagePath", 4)) = '.pdf' THEN "storagePath"
            ELSE NULL
        END
    ),
    "pdfOriginalFilename" = COALESCE(
        "pdfOriginalFilename",
        CASE
            WHEN "originalFilename" IS NOT NULL AND lower(right("originalFilename", 4)) = '.pdf' THEN "originalFilename"
            ELSE NULL
        END
    ),
    "dxfStoragePath" = COALESCE(
        "dxfStoragePath",
        CASE
            WHEN "storagePath" IS NOT NULL AND lower(right("storagePath", 4)) = '.dxf' THEN "storagePath"
            ELSE NULL
        END
    ),
    "dxfOriginalFilename" = COALESCE(
        "dxfOriginalFilename",
        CASE
            WHEN "originalFilename" IS NOT NULL AND lower(right("originalFilename", 4)) = '.dxf' THEN "originalFilename"
            ELSE NULL
        END
    );

UPDATE "FileRevision"
SET
    "pdfStoragePath" = COALESCE("pdfStoragePath", "storagePath"),
    "pdfOriginalFilename" = COALESCE("pdfOriginalFilename", "originalFilename")
WHERE "storagePath" IS NOT NULL
  AND "pdfStoragePath" IS NULL
  AND "dxfStoragePath" IS NULL;

ALTER TABLE "FileRevision"
    DROP COLUMN IF EXISTS "storagePath",
    DROP COLUMN IF EXISTS "originalFilename";

COMMIT;

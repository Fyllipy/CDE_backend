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
    description: string | null;
    createdAt: Date;
}
export declare function ensureUploadDir(): Promise<string | undefined>;
export declare function buildStoragePath(projectId: string, fileId: string, revisionLabel: string, extension: string): string;
export declare function validateAgainstNamingStandard(baseName: string, pattern: string): Promise<void>;
export declare function createOrUpdateFileRevision(options: {
    projectId: string;
    fileBuffer: Buffer;
    originalFilename: string;
    uploadedBy: string;
    namingPattern: string;
    overrideBaseName?: string;
    description?: string;
}): Promise<{
    file: StoredFile;
    revision: FileRevision;
}>;
export declare function listFiles(projectId: string): Promise<Array<StoredFile & {
    revisions: FileRevision[];
}>>;
export declare function getRevisionById(id: string): Promise<FileRevision | undefined>;
export declare function deleteFile(projectId: string, fileId: string): Promise<void>;

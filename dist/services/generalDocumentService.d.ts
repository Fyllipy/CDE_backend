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
export declare function createGeneralDocument(options: {
    projectId: string;
    fileBuffer: Buffer;
    originalFilename: string;
    uploadedById: string;
    description?: string;
    category: string;
}): Promise<GeneralDocument>;
export declare function listGeneralDocuments(projectId: string): Promise<Record<GeneralDocumentCategory, GeneralDocument[]>>;
export declare function getGeneralDocument(projectId: string, documentId: string): Promise<GeneralDocument | null>;
export declare function deleteGeneralDocument(projectId: string, documentId: string): Promise<void>;

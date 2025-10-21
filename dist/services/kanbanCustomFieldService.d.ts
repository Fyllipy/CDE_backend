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
export type KanbanCardCustomField = KanbanCustomFieldDef & {
    value: any | null;
};
export declare function createCustomFieldDef(projectId: string, name: string, type: KanbanCustomFieldType, options?: any, required?: boolean): Promise<KanbanCustomFieldDef>;
export declare function getCustomFieldDefsByProject(projectId: string): Promise<KanbanCustomFieldDef[]>;
export declare function updateCustomFieldDef(fieldId: string, updates: {
    name?: string;
    type?: KanbanCustomFieldType;
    options?: any;
    required?: boolean;
}): Promise<KanbanCustomFieldDef | undefined>;
export declare function deleteCustomFieldDef(fieldId: string): Promise<void>;
export declare function upsertCardCustomFieldValue(cardId: string, fieldId: string, value: any): Promise<KanbanCardCustomFieldValue>;
export declare function getCustomFieldValuesForCard(cardId: string): Promise<KanbanCardCustomField[]>;

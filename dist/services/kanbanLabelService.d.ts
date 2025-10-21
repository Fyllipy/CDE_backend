export interface KanbanLabel {
    id: string;
    projectId: string;
    name: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare function createLabel(projectId: string, name: string, color: string): Promise<KanbanLabel>;
export declare function getLabelsByProjectId(projectId: string): Promise<KanbanLabel[]>;
export declare function updateLabel(labelId: string, updates: {
    name?: string;
    color?: string;
}): Promise<KanbanLabel>;
export declare function deleteLabel(labelId: string): Promise<void>;
export declare function addLabelToCard(cardId: string, labelId: string): Promise<void>;
export declare function removeLabelFromCard(cardId: string, labelId: string): Promise<void>;
export declare function getLabelsByCardId(cardId: string): Promise<KanbanLabel[]>;

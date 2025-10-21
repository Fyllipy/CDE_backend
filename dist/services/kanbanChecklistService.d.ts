export type KanbanChecklist = {
    id: string;
    cardId: string;
    title: string;
    position: number;
    createdAt: Date;
    updatedAt: Date;
};
export type KanbanChecklistItem = {
    id: string;
    checklistId: string;
    title: string;
    position: number;
    doneAt: Date | null;
    assigneeId: string | null;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
};
export type KanbanChecklistWithItems = KanbanChecklist & {
    items: KanbanChecklistItem[];
};
export declare function getChecklistsByCardId(cardId: string): Promise<KanbanChecklistWithItems[]>;
export declare function createChecklist(cardId: string, title: string): Promise<KanbanChecklist>;
export declare function updateChecklist(checklistId: string, updates: {
    title?: string;
}): Promise<KanbanChecklist | undefined>;
export declare function deleteChecklist(checklistId: string): Promise<void>;
export declare function reorderChecklists(cardId: string, orderedIds: string[]): Promise<void>;
export declare function createChecklistItem(checklistId: string, title: string): Promise<KanbanChecklistItem>;
export declare function updateChecklistItem(itemId: string, updates: {
    title?: string;
    doneAt?: string | null;
    assigneeId?: string | null;
    dueDate?: string | null;
}): Promise<KanbanChecklistItem | undefined>;
export declare function deleteChecklistItem(itemId: string): Promise<void>;
export declare function reorderChecklistItems(checklistId: string, orderedIds: string[]): Promise<void>;

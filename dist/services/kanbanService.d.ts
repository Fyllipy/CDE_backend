export interface KanbanColumn {
    id: string;
    projectId: string;
    name: string;
    position: number;
    color: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface KanbanCard {
    id: string;
    columnId: string;
    projectId: string;
    title: string;
    description: string | null;
    position: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare function listBoard(projectId: string): Promise<Array<KanbanColumn & {
    cards: KanbanCard[];
}>>;
export declare function createColumn(projectId: string, name: string, color?: string): Promise<KanbanColumn>;
export declare function updateColumn(columnId: string, data: {
    name?: string;
    color?: string;
}): Promise<KanbanColumn | undefined>;
export declare function deleteColumn(columnId: string): Promise<void>;
export declare function createCard(columnId: string, projectId: string, title: string, description: string | null): Promise<KanbanCard>;
export declare function updateCard(cardId: string, fields: {
    title?: string;
    description?: string | null;
}): Promise<KanbanCard | undefined>;
export declare function deleteCard(cardId: string): Promise<void>;
export declare function moveCard(cardId: string, toColumnId: string, newPosition: number): Promise<void>;
export declare function reorderColumns(projectId: string, orderedIds: string[]): Promise<void>;
export declare function reorderCards(columnId: string, orderedIds: string[]): Promise<void>;

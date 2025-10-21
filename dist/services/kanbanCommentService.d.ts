export interface KanbanComment {
    id: string;
    cardId: string;
    authorId: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare function createComment(cardId: string, authorId: string, body: string): Promise<KanbanComment>;
export declare function getCommentsByCardId(cardId: string): Promise<KanbanComment[]>;
export declare function updateComment(commentId: string, body: string): Promise<KanbanComment>;
export declare function deleteComment(commentId: string): Promise<void>;

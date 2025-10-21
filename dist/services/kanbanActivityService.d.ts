export interface KanbanActivity {
    id: string;
    cardId: string;
    actorId: string;
    type: string;
    data: any;
    createdAt: Date;
}
export declare function createActivity(cardId: string, actorId: string, type: string, data: any): Promise<KanbanActivity>;
export declare function getActivityByCardId(cardId: string): Promise<KanbanActivity[]>;

import { User } from "../services/userService";
export declare function addAssigneeToCard(cardId: string, userId: string): Promise<void>;
export declare function removeAssigneeFromCard(cardId: string, userId: string): Promise<void>;
export declare function getAssigneesByCardId(cardId: string): Promise<User[]>;

export interface User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    isAdmin?: boolean;
    createdAt: Date;
}
export type UserInput = {
    name: string;
    email: string;
    password: string;
};
export declare function createUser(input: UserInput): Promise<User>;
export declare function findUserByEmail(email: string): Promise<User | undefined>;
export declare function getUserById(id: string): Promise<User | undefined>;
export declare function listUsers(): Promise<Array<Pick<User, 'id' | 'name' | 'email' | 'isAdmin' | 'createdAt'>>>;
export declare function setAdminFlag(userId: string, isAdmin: boolean): Promise<void>;
export declare function verifyCredentials(email: string, password: string): Promise<User | null>;

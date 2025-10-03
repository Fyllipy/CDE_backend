export type ProjectRole = 'MANAGER' | 'MEMBER';
export declare const projectRoles: ProjectRole[];
export declare function assertProjectRole(role: string): asserts role is ProjectRole;

import { PoolClient } from "pg";
import { ProjectRole } from "../types/roles";
export interface Project {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProjectMembership {
    projectId: string;
    userId: string;
    role: ProjectRole;
    joinedAt: Date;
    name?: string;
    email?: string;
}
export declare function createProject(name: string, description: string | null, ownerId: string): Promise<Project>;
export declare function listProjectsForUser(userId: string): Promise<Project[]>;
export declare function getProjectById(id: string): Promise<Project | undefined>;
export declare function updateProject(id: string, name: string, description: string | null): Promise<Project | undefined>;
export declare function deleteProject(id: string): Promise<void>;
export declare function getMembership(projectId: string, userId: string): Promise<ProjectMembership | undefined>;
export declare function listMembers(projectId: string): Promise<ProjectMembership[]>;
export declare function addMember(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMembership>;
export declare function removeMember(projectId: string, userId: string): Promise<void>;
export declare function setNamingStandard(projectId: string, pattern: string): Promise<void>;
export declare function getNamingStandard(projectId: string): Promise<string | undefined>;
export declare function assertManager(projectId: string, userId: string): Promise<void>;
export declare function requireMembership(client: PoolClient, projectId: string, userId: string): Promise<void>;

import { PoolClient } from "pg";
import { pool, withTransaction } from "../db/pool";
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

const listProjectsSql = [
  'SELECT p.id, p.name, p.description, p."createdAt", p."updatedAt"',
  'FROM "Project" p',
  'INNER JOIN "ProjectMembership" pm ON pm."projectId" = p.id',
  'WHERE pm."userId" = $1',
  'ORDER BY p."updatedAt" DESC'
].join('\n');

const updateProjectSql = [
  'UPDATE "Project"',
  'SET name = $2,',
  '    description = $3,',
  '    "updatedAt" = NOW()',
  'WHERE id = $1',
  'RETURNING id, name, description, "createdAt", "updatedAt"'
].join('\n');

const addMemberSql = [
  'INSERT INTO "ProjectMembership" ("projectId", "userId", role)',
  'VALUES ($1, $2, $3)',
  'ON CONFLICT ("projectId", "userId")',
  'DO UPDATE SET role = EXCLUDED.role',
  'RETURNING "projectId", "userId", role, "joinedAt"'
].join('\n');

const namingStandardUpsertSql = [
  'INSERT INTO "NamingStandard" ("projectId", pattern)',
  'VALUES ($1, $2)',
  'ON CONFLICT ("projectId")',
  'DO UPDATE SET pattern = EXCLUDED.pattern, "updatedAt" = NOW()'
].join('\n');

export async function createProject(
  name: string,
  description: string | null,
  ownerId: string
): Promise<Project> {
  return withTransaction(async (client) => {
    const projectResult = await client.query<Project>(
      'INSERT INTO "Project" (name, description) VALUES ($1, $2) RETURNING id, name, description, "createdAt", "updatedAt"',
      [name, description]
    );
    const project = projectResult.rows[0];
    if (!project) {
      throw new Error('Unable to create project');
    }

    await client.query(
      'INSERT INTO "ProjectMembership" ("projectId", "userId", role) VALUES ($1, $2, $3)',
      [project.id, ownerId, 'MANAGER']
    );

    await client.query(
      'INSERT INTO "NamingStandard" ("projectId", pattern) VALUES ($1, $2)',
      [project.id, '{discipline}-{type}-{sequence}']
    );

    return project;
  });
}

export async function listProjectsForUser(userId: string): Promise<Project[]> {
  const result = await pool.query<Project>(listProjectsSql, [userId]);
  return result.rows;
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const result = await pool.query<Project>(
    'SELECT id, name, description, "createdAt", "updatedAt" FROM "Project" WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

export async function updateProject(id: string, name: string, description: string | null): Promise<Project | undefined> {
  const result = await pool.query<Project>(updateProjectSql, [id, name, description]);
  return result.rows[0];
}

export async function deleteProject(id: string): Promise<void> {
  await pool.query('DELETE FROM "Project" WHERE id = $1', [id]);
}

export async function getMembership(projectId: string, userId: string): Promise<ProjectMembership | undefined> {
  const result = await pool.query<ProjectMembership>(
    'SELECT pm."projectId", pm."userId", pm.role, pm."joinedAt", u.name, u.email FROM "ProjectMembership" pm LEFT JOIN "User" u ON u.id = pm."userId" WHERE pm."projectId" = $1 AND pm."userId" = $2',
    [projectId, userId]
  );
  return result.rows[0];
}

export async function listMembers(projectId: string): Promise<ProjectMembership[]> {
  const result = await pool.query<ProjectMembership>(
    'SELECT pm."projectId", pm."userId", pm.role, pm."joinedAt", u.name, u.email FROM "ProjectMembership" pm INNER JOIN "User" u ON u.id = pm."userId" WHERE pm."projectId" = $1 ORDER BY u.name',
    [projectId]
  );
  return result.rows;
}

export async function addMember(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMembership> {
  const result = await pool.query<ProjectMembership>(addMemberSql, [projectId, userId, role]);
  const membership = result.rows[0];
  if (!membership) {
    throw new Error('Unable to add member');
  }

  const userLookup = await pool.query<{ name: string; email: string }>(
    'SELECT name, email FROM "User" WHERE id = $1',
    [userId]
  );

  return {
    ...membership,
    name: userLookup.rows[0]?.name,
    email: userLookup.rows[0]?.email
  };
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  await pool.query('DELETE FROM "ProjectMembership" WHERE "projectId" = $1 AND "userId" = $2', [projectId, userId]);
}

export async function updateMemberRole(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMembership> {
  const result = await pool.query<ProjectMembership>(
    'UPDATE "ProjectMembership" SET role = $3 WHERE "projectId" = $1 AND "userId" = $2 RETURNING "projectId", "userId", role, "joinedAt"',
    [projectId, userId, role]
  );
  const membership = result.rows[0];
  if (!membership) {
    throw Object.assign(new Error('Membership not found'), { status: 404 });
  }
  return membership;
}
export async function setNamingStandard(projectId: string, pattern: string): Promise<void> {
  await pool.query(namingStandardUpsertSql, [projectId, pattern]);
}

export async function getNamingStandard(projectId: string): Promise<string | undefined> {
  const result = await pool.query<{ pattern: string }>(
    'SELECT pattern FROM "NamingStandard" WHERE "projectId" = $1',
    [projectId]
  );
  return result.rows[0]?.pattern;
}

export async function assertManager(projectId: string, userId: string): Promise<void> {
  const membership = await getMembership(projectId, userId);
  if (!membership || membership.role !== 'MANAGER') {
    const error = new Error('Forbidden');
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
}

export async function requireMembership(client: PoolClient, projectId: string, userId: string): Promise<void> {
  const result = await client.query(
    'SELECT 1 FROM "ProjectMembership" WHERE "projectId" = $1 AND "userId" = $2',
    [projectId, userId]
  );
  if (!result.rowCount) {
    const error = new Error('Forbidden');
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
}

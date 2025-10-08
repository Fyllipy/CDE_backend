import { Request, Response } from 'express';
import { listUsers } from '../services/userService';
import { pool } from '../db/pool';
import type { ProjectMembership } from '../services/projectService';

export async function listAllUsers(_req: Request, res: Response) {
  const users = await listUsers();
  return res.json({ users });
}

export async function listAllMemberships(_req: Request, res: Response) {
  const result = await pool.query<{
    projectId: string;
    projectName: string;
    userId: string;
    userName: string | null;
    userEmail: string | null;
    role: ProjectMembership['role'];
    joinedAt: Date;
  }>(
    'SELECT pm."projectId", p.name as "projectName", pm."userId", u.name as "userName", u.email as "userEmail", pm.role, pm."joinedAt" FROM "ProjectMembership" pm INNER JOIN "Project" p ON p.id = pm."projectId" INNER JOIN "User" u ON u.id = pm."userId" ORDER BY p.name, u.name'
  );
  return res.json({ memberships: result.rows });
}

export async function updateMembershipRole(req: Request, res: Response) {
  const { projectId, userId, role } = req.body as { projectId: string; userId: string; role: ProjectMembership['role'] };
  if (!projectId || !userId || !role) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  const result = await pool.query(
    'UPDATE "ProjectMembership" SET role = $3 WHERE "projectId" = $1 AND "userId" = $2',
    [projectId, userId, role]
  );
  if (!result.rowCount) {
    return res.status(404).json({ message: 'Membership not found' });
  }
  return res.status(204).send();
}


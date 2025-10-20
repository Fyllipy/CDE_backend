import { Request, Response, NextFunction } from "express";
import { getMembership, ProjectMembership } from "../services/projectService";

export function getAuthUser(req: Request): { id: string } | undefined {
  return (req as Request & { user?: { id: string } }).user;
}

export async function ensureMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  const membership = await getMembership(projectId, userId);
  return Boolean(membership);
}

export async function ensureProjectMember(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId || req.body.projectId || (req.query.projectId as string) || '';

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!projectId) {
    return res.status(400).json({ 
      message: "Project ID is required",
      debug: {
        params: req.params,
        path: req.path,
        baseUrl: req.baseUrl
      }
    });
  }

  console.log('[ensureProjectMember] checking membership', {
    projectId,
    userId: user.id,
    url: req.originalUrl
  });

  const membership = await getMembership(projectId, user.id);
  if (!membership) {
    console.warn('[ensureProjectMember] membership not found', {
      projectId,
      userId: user.id
    });
    return res.status(403).json({ 
      message: "Forbidden - You are not a member of this project",
      projectId,
      userId: user.id
    });
  }

  console.log('[ensureProjectMember] membership confirmed', {
    projectId,
    userId: user.id,
    role: membership.role
  });

  (req as Request & { projectMembership?: ProjectMembership }).projectMembership = membership;

  return next();
}
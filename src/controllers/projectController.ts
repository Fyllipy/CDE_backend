import { Request, Response } from "express";
import { ProjectRole, assertProjectRole } from "../types/roles";
import {
  createProject,
  listProjectsForUser,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  listMembers,
  removeMember,
  getNamingStandard,
  setNamingStandard,
  getMembership
} from "../services/projectService";

function getAuthUser(req: Request): { id: string } | undefined {
  return (req as Request & { user?: { id: string } }).user;
}

async function ensureManager(projectId: string, userId: string): Promise<boolean> {
  const membership = await getMembership(projectId, userId);
  return Boolean(membership && membership.role === "MANAGER");
}

export async function listMyProjects(req: Request, res: Response) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const projects = await listProjectsForUser(user.id);
  return res.json({ projects });
}

export async function createProjectHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { name, description } = req.body as { name: string; description?: string };
  if (!name) {
    return res.status(400).json({ message: "Project name is required" });
  }

  const project = await createProject(name, description ?? null, user.id);
  return res.status(201).json({ project });
}

export async function getProjectHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!projectId) {
    return res.status(400).json({ message: "Project id is required" });
  }

  const membership = await getMembership(projectId, user.id);
  if (!membership) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const project = await getProjectById(projectId);
  const namingPattern = await getNamingStandard(projectId);

  return res.json({ project, membership, namingPattern });
}

export async function updateProjectHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const { name, description } = req.body as { name: string; description?: string };

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!projectId) {
    return res.status(400).json({ message: "Project id is required" });
  }

  const isManager = await ensureManager(projectId, user.id);
  if (!isManager) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const updated = await updateProject(projectId, name, description ?? null);
  return res.json({ project: updated });
}

export async function deleteProjectHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!projectId) {
    return res.status(400).json({ message: "Project id is required" });
  }

  const isManager = await ensureManager(projectId, user.id);
  if (!isManager) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await deleteProject(projectId);
  return res.status(204).send();
}

export async function listMembersHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!projectId) {
    return res.status(400).json({ message: "Project id is required" });
  }

  const membership = await getMembership(projectId, user.id);
  if (!membership) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const members = await listMembers(projectId);
  return res.json({ members });
}

export async function addMemberHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const { userId, role } = req.body as { userId: string; role: ProjectRole };
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!projectId) {
    return res.status(400).json({ message: "Project id is required" });
  }

  const isManager = await ensureManager(projectId, user.id);
  if (!isManager) {
    return res.status(403).json({ message: "Forbidden" });
  }

  assertProjectRole(role);
  const member = await addMember(projectId, userId, role);
  return res.status(201).json({ member });
}

export async function removeMemberHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const memberId = req.params.memberId ?? '';
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!projectId || !memberId) {
    return res.status(400).json({ message: "Identifiers are required" });
  }

  const isManager = await ensureManager(projectId, user.id);
  if (!isManager) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await removeMember(projectId, memberId);
  return res.status(204).send();
}

export async function updateNamingStandardHandler(req: Request, res: Response) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId ?? '';
  const { pattern } = req.body as { pattern: string };
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!projectId) {
    return res.status(400).json({ message: "Project id is required" });
  }

  const isManager = await ensureManager(projectId, user.id);
  if (!isManager) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (!pattern) {
    return res.status(400).json({ message: "Pattern is required" });
  }

  await setNamingStandard(projectId, pattern);
  return res.status(200).json({ pattern });
}

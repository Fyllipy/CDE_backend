import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  listMyProjects,
  createProjectHandler,
  getProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
  listMembersHandler,
  addMemberHandler,
  removeMemberHandler,
  updateNamingStandardHandler
} from "../controllers/projectController";

export const projectRouter = Router();

projectRouter.use(requireAuth);

projectRouter.get("/", listMyProjects);
projectRouter.post("/", createProjectHandler);
projectRouter.get("/:projectId", getProjectHandler);
projectRouter.put("/:projectId", updateProjectHandler);
projectRouter.delete("/:projectId", deleteProjectHandler);
projectRouter.get("/:projectId/members", listMembersHandler);
projectRouter.post("/:projectId/members", addMemberHandler);
projectRouter.delete("/:projectId/members/:memberId", removeMemberHandler);
projectRouter.patch("/:projectId/naming-standard", updateNamingStandardHandler);

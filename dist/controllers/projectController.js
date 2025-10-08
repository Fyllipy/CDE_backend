"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMyProjects = listMyProjects;
exports.createProjectHandler = createProjectHandler;
exports.getProjectHandler = getProjectHandler;
exports.updateProjectHandler = updateProjectHandler;
exports.deleteProjectHandler = deleteProjectHandler;
exports.listMembersHandler = listMembersHandler;
exports.addMemberHandler = addMemberHandler;
exports.removeMemberHandler = removeMemberHandler;
exports.addMemberByEmailHandler = addMemberByEmailHandler;
exports.updateMemberRoleHandler = updateMemberRoleHandler;
exports.updateNamingStandardHandler = updateNamingStandardHandler;
const roles_1 = require("../types/roles");
const projectService_1 = require("../services/projectService");
const userService_1 = require("../services/userService");
function getAuthUser(req) {
    return req.user;
}
async function ensureManager(projectId, userId) {
    const membership = await (0, projectService_1.getMembership)(projectId, userId);
    return Boolean(membership && membership.role === "MANAGER");
}
async function listMyProjects(req, res) {
    const user = getAuthUser(req);
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const projects = await (0, projectService_1.listProjectsForUser)(user.id);
    return res.json({ projects });
}
async function createProjectHandler(req, res) {
    const user = getAuthUser(req);
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Project name is required" });
    }
    const project = await (0, projectService_1.createProject)(name, description !== null && description !== void 0 ? description : null, user.id);
    return res.status(201).json({ project });
}
async function getProjectHandler(req, res) {
    var _a;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId) {
        return res.status(400).json({ message: "Project id is required" });
    }
    const membership = await (0, projectService_1.getMembership)(projectId, user.id);
    if (!membership) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const project = await (0, projectService_1.getProjectById)(projectId);
    const namingPattern = await (0, projectService_1.getNamingStandard)(projectId);
    return res.json({ project, membership, namingPattern });
}
async function updateProjectHandler(req, res) {
    var _a;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const { name, description } = req.body;
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
    const updated = await (0, projectService_1.updateProject)(projectId, name, description !== null && description !== void 0 ? description : null);
    return res.json({ project: updated });
}
async function deleteProjectHandler(req, res) {
    var _a;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
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
    await (0, projectService_1.deleteProject)(projectId);
    return res.status(204).send();
}
async function listMembersHandler(req, res) {
    var _a;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId) {
        return res.status(400).json({ message: "Project id is required" });
    }
    const membership = await (0, projectService_1.getMembership)(projectId, user.id);
    if (!membership) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const members = await (0, projectService_1.listMembers)(projectId);
    return res.json({ members });
}
async function addMemberHandler(req, res) {
    var _a;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const { userId, role } = req.body;
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
    (0, roles_1.assertProjectRole)(role);
    const member = await (0, projectService_1.addMember)(projectId, userId, role);
    return res.status(201).json({ member });
}
async function removeMemberHandler(req, res) {
    var _a, _b;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const memberId = (_b = req.params.memberId) !== null && _b !== void 0 ? _b : '';
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
    await (0, projectService_1.removeMember)(projectId, memberId);
    return res.status(204).send();
}
async function addMemberByEmailHandler(req, res) {
    var _a;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const { email, role } = req.body;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId || !email) {
        return res.status(400).json({ message: "Project id and email are required" });
    }
    const isManager = await ensureManager(projectId, user.id);
    if (!isManager) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const found = await (0, userService_1.findUserByEmail)(email);
    if (!found) {
        return res.status(404).json({ message: "User not found" });
    }
    const member = await (0, projectService_1.addMember)(projectId, found.id, role !== null && role !== void 0 ? role : 'MEMBER');
    return res.status(201).json({ member });
}
async function updateMemberRoleHandler(req, res) {
    var _a, _b;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const memberId = (_b = req.params.memberId) !== null && _b !== void 0 ? _b : '';
    const { role } = req.body;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!projectId || !memberId || !role) {
        return res.status(400).json({ message: "Identifiers and role are required" });
    }
    const isManager = await ensureManager(projectId, user.id);
    if (!isManager) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const updated = await (0, projectService_1.updateMemberRole)(projectId, memberId, role);
    return res.json({ member: updated });
}
async function updateNamingStandardHandler(req, res) {
    var _a;
    const user = getAuthUser(req);
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : '';
    const { pattern } = req.body;
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
    await (0, projectService_1.setNamingStandard)(projectId, pattern);
    return res.status(200).json({ pattern });
}
//# sourceMappingURL=projectController.js.map
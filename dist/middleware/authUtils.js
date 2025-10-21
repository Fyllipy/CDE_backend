"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthUser = getAuthUser;
exports.ensureMember = ensureMember;
exports.ensureProjectMember = ensureProjectMember;
const projectService_1 = require("../services/projectService");
function getAuthUser(req) {
    return req.user;
}
async function ensureMember(projectId, userId) {
    const membership = await (0, projectService_1.getMembership)(projectId, userId);
    return Boolean(membership);
}
async function ensureProjectMember(req, res, next) {
    const user = getAuthUser(req);
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId || '';
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
    const membership = await (0, projectService_1.getMembership)(projectId, user.id);
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
    req.projectMembership = membership;
    return next();
}
//# sourceMappingURL=authUtils.js.map
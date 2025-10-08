"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAllUsers = listAllUsers;
exports.listAllMemberships = listAllMemberships;
exports.updateMembershipRole = updateMembershipRole;
const userService_1 = require("../services/userService");
const pool_1 = require("../db/pool");
async function listAllUsers(_req, res) {
    const users = await (0, userService_1.listUsers)();
    return res.json({ users });
}
async function listAllMemberships(_req, res) {
    const result = await pool_1.pool.query('SELECT pm."projectId", p.name as "projectName", pm."userId", u.name as "userName", u.email as "userEmail", pm.role, pm."joinedAt" FROM "ProjectMembership" pm INNER JOIN "Project" p ON p.id = pm."projectId" INNER JOIN "User" u ON u.id = pm."userId" ORDER BY p.name, u.name');
    return res.json({ memberships: result.rows });
}
async function updateMembershipRole(req, res) {
    const { projectId, userId, role } = req.body;
    if (!projectId || !userId || !role) {
        return res.status(400).json({ message: 'Missing fields' });
    }
    const result = await pool_1.pool.query('UPDATE "ProjectMembership" SET role = $3 WHERE "projectId" = $1 AND "userId" = $2', [projectId, userId, role]);
    if (!result.rowCount) {
        return res.status(404).json({ message: 'Membership not found' });
    }
    return res.status(204).send();
}
//# sourceMappingURL=adminController.js.map
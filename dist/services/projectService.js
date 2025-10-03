"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = createProject;
exports.listProjectsForUser = listProjectsForUser;
exports.getProjectById = getProjectById;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject;
exports.getMembership = getMembership;
exports.listMembers = listMembers;
exports.addMember = addMember;
exports.removeMember = removeMember;
exports.setNamingStandard = setNamingStandard;
exports.getNamingStandard = getNamingStandard;
exports.assertManager = assertManager;
exports.requireMembership = requireMembership;
const pool_1 = require("../db/pool");
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
async function createProject(name, description, ownerId) {
    return (0, pool_1.withTransaction)(async (client) => {
        const projectResult = await client.query('INSERT INTO "Project" (name, description) VALUES ($1, $2) RETURNING id, name, description, "createdAt", "updatedAt"', [name, description]);
        const project = projectResult.rows[0];
        if (!project) {
            throw new Error('Unable to create project');
        }
        await client.query('INSERT INTO "ProjectMembership" ("projectId", "userId", role) VALUES ($1, $2, $3)', [project.id, ownerId, 'MANAGER']);
        await client.query('INSERT INTO "NamingStandard" ("projectId", pattern) VALUES ($1, $2)', [project.id, '{discipline}-{type}-{sequence}']);
        return project;
    });
}
async function listProjectsForUser(userId) {
    const result = await pool_1.pool.query(listProjectsSql, [userId]);
    return result.rows;
}
async function getProjectById(id) {
    const result = await pool_1.pool.query('SELECT id, name, description, "createdAt", "updatedAt" FROM "Project" WHERE id = $1', [id]);
    return result.rows[0];
}
async function updateProject(id, name, description) {
    const result = await pool_1.pool.query(updateProjectSql, [id, name, description]);
    return result.rows[0];
}
async function deleteProject(id) {
    await pool_1.pool.query('DELETE FROM "Project" WHERE id = $1', [id]);
}
async function getMembership(projectId, userId) {
    const result = await pool_1.pool.query('SELECT pm."projectId", pm."userId", pm.role, pm."joinedAt", u.name, u.email FROM "ProjectMembership" pm LEFT JOIN "User" u ON u.id = pm."userId" WHERE pm."projectId" = $1 AND pm."userId" = $2', [projectId, userId]);
    return result.rows[0];
}
async function listMembers(projectId) {
    const result = await pool_1.pool.query('SELECT pm."projectId", pm."userId", pm.role, pm."joinedAt", u.name, u.email FROM "ProjectMembership" pm INNER JOIN "User" u ON u.id = pm."userId" WHERE pm."projectId" = $1 ORDER BY u.name', [projectId]);
    return result.rows;
}
async function addMember(projectId, userId, role) {
    var _a, _b;
    const result = await pool_1.pool.query(addMemberSql, [projectId, userId, role]);
    const membership = result.rows[0];
    if (!membership) {
        throw new Error('Unable to add member');
    }
    const userLookup = await pool_1.pool.query('SELECT name, email FROM "User" WHERE id = $1', [userId]);
    return {
        ...membership,
        name: (_a = userLookup.rows[0]) === null || _a === void 0 ? void 0 : _a.name,
        email: (_b = userLookup.rows[0]) === null || _b === void 0 ? void 0 : _b.email
    };
}
async function removeMember(projectId, userId) {
    await pool_1.pool.query('DELETE FROM "ProjectMembership" WHERE "projectId" = $1 AND "userId" = $2', [projectId, userId]);
}
async function setNamingStandard(projectId, pattern) {
    await pool_1.pool.query(namingStandardUpsertSql, [projectId, pattern]);
}
async function getNamingStandard(projectId) {
    var _a;
    const result = await pool_1.pool.query('SELECT pattern FROM "NamingStandard" WHERE "projectId" = $1', [projectId]);
    return (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.pattern;
}
async function assertManager(projectId, userId) {
    const membership = await getMembership(projectId, userId);
    if (!membership || membership.role !== 'MANAGER') {
        const error = new Error('Forbidden');
        error.status = 403;
        throw error;
    }
}
async function requireMembership(client, projectId, userId) {
    const result = await client.query('SELECT 1 FROM "ProjectMembership" WHERE "projectId" = $1 AND "userId" = $2', [projectId, userId]);
    if (!result.rowCount) {
        const error = new Error('Forbidden');
        error.status = 403;
        throw error;
    }
}
//# sourceMappingURL=projectService.js.map
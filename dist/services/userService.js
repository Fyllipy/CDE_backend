"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.findUserByEmail = findUserByEmail;
exports.getUserById = getUserById;
exports.verifyCredentials = verifyCredentials;
const pool_1 = require("../db/pool");
const password_1 = require("../utils/password");
async function createUser(input) {
    const hashed = await (0, password_1.hashPassword)(input.password);
    const result = await pool_1.pool.query('INSERT INTO "User" (name, email, "passwordHash") VALUES ($1, $2, $3) RETURNING id, name, email, "passwordHash", "createdAt"', [input.name, input.email, hashed]);
    const user = result.rows[0];
    if (!user) {
        throw new Error('Unable to create user');
    }
    return user;
}
async function findUserByEmail(email) {
    const result = await pool_1.pool.query('SELECT id, name, email, "passwordHash", "createdAt" FROM "User" WHERE email = $1', [email]);
    return result.rows[0];
}
async function getUserById(id) {
    const result = await pool_1.pool.query('SELECT id, name, email, "passwordHash", "createdAt" FROM "User" WHERE id = $1', [id]);
    return result.rows[0];
}
async function verifyCredentials(email, password) {
    const user = await findUserByEmail(email);
    if (!user) {
        return null;
    }
    const valid = await (0, password_1.comparePassword)(password, user.passwordHash);
    if (!valid) {
        return null;
    }
    return user;
}
//# sourceMappingURL=userService.js.map
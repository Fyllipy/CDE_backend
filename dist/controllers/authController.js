"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.me = me;
const jwt_1 = require("../utils/jwt");
const userService_1 = require("../services/userService");
async function register(req, res) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    const existing = await (0, userService_1.findUserByEmail)(email);
    if (existing) {
        return res.status(409).json({ message: "User already exists" });
    }
    const user = await (0, userService_1.createUser)({ name, email, password });
    const token = (0, jwt_1.signJwt)({ userId: user.id });
    return res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email }
    });
}
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Missing credentials" });
    }
    const user = await (0, userService_1.verifyCredentials)(email, password);
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = (0, jwt_1.signJwt)({ userId: user.id });
    return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email }
    });
}
async function me(req, res) {
    const authUser = req.user;
    if (!authUser) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await (0, userService_1.getUserById)(authUser.id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.json({ user: { id: user.id, name: user.name, email: user.email } });
}
//# sourceMappingURL=authController.js.map
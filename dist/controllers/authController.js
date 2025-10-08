"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.me = me;
exports.initAdmin = initAdmin;
const jwt_1 = require("../utils/jwt");
const userService_1 = require("../services/userService");
async function register(req, res) {
    var _a;
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
        user: { id: user.id, name: user.name, email: user.email, isAdmin: (_a = user.isAdmin) !== null && _a !== void 0 ? _a : false }
    });
}
async function login(req, res) {
    var _a;
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
        user: { id: user.id, name: user.name, email: user.email, isAdmin: (_a = user.isAdmin) !== null && _a !== void 0 ? _a : false }
    });
}
async function me(req, res) {
    var _a;
    const authUser = req.user;
    if (!authUser) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await (0, userService_1.getUserById)(authUser.id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.json({ user: { id: user.id, name: user.name, email: user.email, isAdmin: (_a = user.isAdmin) !== null && _a !== void 0 ? _a : false } });
}
// Init admin once: if no admin exists, promote the provided email user to admin (or create it)
async function initAdmin(req, res) {
    var _a;
    const { email, password, name } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Missing email/password' });
    }
    const exists = await ((_a = (await (0, userService_1.findUserByEmail)(email))) === null || _a === void 0 ? void 0 : _a.isAdmin);
    const anyAdmin = await (await Promise.resolve().then(() => __importStar(require('../db/pool')))).pool
        .query('SELECT COUNT(*)::text AS total FROM "User" WHERE "isAdmin" = true')
        .then(r => { var _a, _b; return Number((_b = (_a = r.rows[0]) === null || _a === void 0 ? void 0 : _a.total) !== null && _b !== void 0 ? _b : '0') > 0; });
    if (anyAdmin) {
        return res.status(409).json({ message: 'Admin already initialized' });
    }
    let user = await (0, userService_1.findUserByEmail)(email);
    if (!user) {
        user = await (0, userService_1.createUser)({ name: name !== null && name !== void 0 ? name : 'Admin', email, password });
    }
    await (0, userService_1.setAdminFlag)(user.id, true);
    return res.status(201).json({ message: 'Admin initialized' });
}
//# sourceMappingURL=authController.js.map
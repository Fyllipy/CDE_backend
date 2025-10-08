"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/register", authController_1.register);
exports.authRouter.post("/login", authController_1.login);
exports.authRouter.post("/init-admin", authController_1.initAdmin);
exports.authRouter.get("/me", authMiddleware_1.requireAuth, authController_1.me);
//# sourceMappingURL=authRoutes.js.map
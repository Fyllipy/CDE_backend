"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const adminMiddleware_1 = require("../middleware/adminMiddleware");
const adminController_1 = require("../controllers/adminController");
exports.adminRouter = (0, express_1.Router)();
exports.adminRouter.use(authMiddleware_1.requireAuth, adminMiddleware_1.requireAdmin);
exports.adminRouter.get('/admin/users', adminController_1.listAllUsers);
exports.adminRouter.get('/admin/memberships', adminController_1.listAllMemberships);
exports.adminRouter.patch('/admin/memberships', adminController_1.updateMembershipRole);
//# sourceMappingURL=adminRoutes.js.map
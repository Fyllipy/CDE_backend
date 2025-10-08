"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
const userService_1 = require("../services/userService");
async function requireAdmin(req, res, next) {
    const auth = req.user;
    if (!auth) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await (0, userService_1.getUserById)(auth.id);
    if (!(user === null || user === void 0 ? void 0 : user.isAdmin)) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
}
//# sourceMappingURL=adminMiddleware.js.map
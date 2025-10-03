"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jwt_1 = require("../utils/jwt");
function requireAuth(req, res, next) {
    const header = req.header('authorization');
    if (!header) {
        return res.status(401).json({ message: 'Missing authorization header' });
    }
    const [, token] = header.split(' ');
    if (!token) {
        return res.status(401).json({ message: 'Invalid authorization header format' });
    }
    try {
        const payload = (0, jwt_1.verifyJwt)(token);
        req.user = { id: payload.userId };
        return next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}
//# sourceMappingURL=authMiddleware.js.map
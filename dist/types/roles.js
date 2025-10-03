"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRoles = void 0;
exports.assertProjectRole = assertProjectRole;
exports.projectRoles = ['MANAGER', 'MEMBER'];
function assertProjectRole(role) {
    if (!exports.projectRoles.includes(role)) {
        throw new Error('Invalid project role: ' + role);
    }
}
//# sourceMappingURL=roles.js.map
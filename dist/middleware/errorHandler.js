"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(error, _req, res, _next) {
    var _a;
    const status = (_a = error.status) !== null && _a !== void 0 ? _a : 500;
    const message = status === 500 ? 'Unexpected error' : error.message;
    if (status === 500) {
        console.error(error);
    }
    res.status(status).json({ message });
}
//# sourceMappingURL=errorHandler.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const routes_1 = require("./routes");
const errorHandler_1 = require("./middleware/errorHandler");
const env_1 = require("./config/env");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({ origin: env_1.env.nodeEnv === 'development' ? '*' : undefined }));
exports.app.use(express_1.default.json());
exports.app.get('/health', (_req, res) => res.json({ status: 'ok' }));
exports.app.use('/uploads', express_1.default.static(path_1.default.resolve(env_1.env.uploadDir)));
exports.app.use('/api', routes_1.apiRouter);
exports.app.use(errorHandler_1.errorHandler);
//# sourceMappingURL=app.js.map
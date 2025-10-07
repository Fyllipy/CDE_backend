"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
    if (!process.env[key]) {
        throw new Error('Missing required environment variable ' + key);
    }
}
exports.env = {
    nodeEnv: (_a = process.env.NODE_ENV) !== null && _a !== void 0 ? _a : 'development',
    port: Number((_b = process.env.PORT) !== null && _b !== void 0 ? _b : 4000),
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: (_c = process.env.JWT_EXPIRES_IN) !== null && _c !== void 0 ? _c : '1d',
    databaseUrl: process.env.DATABASE_URL,
    uploadDir: (_d = process.env.UPLOAD_DIR) !== null && _d !== void 0 ? _d : 'uploads',
    generalUploadDir: (_e = process.env.GENERAL_UPLOAD_DIR) !== null && _e !== void 0 ? _e : 'general-uploads'
};
//# sourceMappingURL=env.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const authRoutes_1 = require("./authRoutes");
const projectRoutes_1 = require("./projectRoutes");
const fileRoutes_1 = require("./fileRoutes");
const kanbanRoutes_1 = require("./kanbanRoutes");
exports.apiRouter = (0, express_1.Router)();
exports.apiRouter.use("/auth", authRoutes_1.authRouter);
exports.apiRouter.use("/projects", projectRoutes_1.projectRouter);
exports.apiRouter.use("/projects", fileRoutes_1.fileRouter);
exports.apiRouter.use("/projects", kanbanRoutes_1.kanbanRouter);
//# sourceMappingURL=index.js.map
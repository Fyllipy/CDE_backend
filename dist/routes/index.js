"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const authRoutes_1 = require("./authRoutes");
const projectRoutes_1 = require("./projectRoutes");
const fileRoutes_1 = require("./fileRoutes");
const kanbanRoutes_1 = require("./kanbanRoutes");
const generalDocumentRoutes_1 = require("./generalDocumentRoutes");
const adminRoutes_1 = require("./adminRoutes");
exports.apiRouter = (0, express_1.Router)();
exports.apiRouter.use("/auth", authRoutes_1.authRouter);
exports.apiRouter.use("/projects", projectRoutes_1.projectRouter);
exports.apiRouter.use("/projects", fileRoutes_1.fileRouter);
exports.apiRouter.use("/projects", kanbanRoutes_1.kanbanRouter);
exports.apiRouter.use("/projects", generalDocumentRoutes_1.generalDocumentRouter);
exports.apiRouter.use("/", adminRoutes_1.adminRouter);
//# sourceMappingURL=index.js.map
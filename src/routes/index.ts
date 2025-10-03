import { Router } from "express";
import { authRouter } from "./authRoutes";
import { projectRouter } from "./projectRoutes";
import { fileRouter } from "./fileRoutes";
import { kanbanRouter } from "./kanbanRoutes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/projects", projectRouter);
apiRouter.use("/projects", fileRouter);
apiRouter.use("/projects", kanbanRouter);

import { Router } from "express";
import { authRouter } from "./authRoutes";
import { projectRouter } from "./projectRoutes";
import { fileRouter } from "./fileRoutes";
import { kanbanRouter } from "./kanbanRoutes";
import { generalDocumentRouter } from "./generalDocumentRoutes";
import { adminRouter } from "./adminRoutes";
import kanbanLabelRoutes from "./kanbanLabelRoutes";
import kanbanAssigneeRoutes from "./kanbanAssigneeRoutes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/projects", projectRouter);
apiRouter.use("/projects", fileRouter);
apiRouter.use("/projects", generalDocumentRouter);
apiRouter.use("/", adminRouter);

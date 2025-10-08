import { Router } from "express";
import { register, login, me, initAdmin } from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/init-admin", initAdmin);
authRouter.get("/me", requireAuth, me);

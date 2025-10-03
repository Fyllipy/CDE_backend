import { Router } from "express";
import { register, login, me } from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);

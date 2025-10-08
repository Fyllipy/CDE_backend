import { Request, Response } from "express";
import { signJwt } from "../utils/jwt";
import { createUser, findUserByEmail, verifyCredentials, getUserById, setAdminFlag } from "../services/userService";

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ message: "User already exists" });
  }

  const user = await createUser({ name, email, password });
  const token = signJwt({ userId: user.id });

  return res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin ?? false }
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signJwt({ userId: user.id });

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin ?? false }
  });
}

export async function me(req: Request, res: Response) {
  const authUser = (req as Request & { user?: { id: string } }).user;
  if (!authUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await getUserById(authUser.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin ?? false } });
}

// Init admin once: if no admin exists, promote the provided email user to admin (or create it)
export async function initAdmin(req: Request, res: Response) {
  const { email, password, name } = req.body as { email: string; password: string; name?: string };
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email/password' });
  }
  const exists = await (await findUserByEmail(email))?.isAdmin;
  const anyAdmin = await (await import('../db/pool')).pool
    .query<{ total: string }>('SELECT COUNT(*)::text AS total FROM "User" WHERE "isAdmin" = true')
    .then(r => Number(r.rows[0]?.total ?? '0') > 0);
  if (anyAdmin) {
    return res.status(409).json({ message: 'Admin already initialized' });
  }
  let user = await findUserByEmail(email);
  if (!user) {
    user = await createUser({ name: name ?? 'Admin', email, password });
  }
  await setAdminFlag(user.id, true);
  return res.status(201).json({ message: 'Admin initialized' });
}

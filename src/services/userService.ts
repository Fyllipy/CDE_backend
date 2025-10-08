import { pool } from '../db/pool';
import { hashPassword, comparePassword } from '../utils/password';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isAdmin?: boolean;
  createdAt: Date;
}

export type UserInput = {
  name: string;
  email: string;
  password: string;
};

export async function createUser(input: UserInput): Promise<User> {
  const hashed = await hashPassword(input.password);
  const result = await pool.query<User>(
    'INSERT INTO "User" (name, email, "passwordHash") VALUES ($1, $2, $3) RETURNING id, name, email, "passwordHash", "isAdmin", "createdAt"',
    [input.name, input.email, hashed]
  );
  const user = result.rows[0];
  if (!user) {
    throw new Error('Unable to create user');
  }
  return user;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const result = await pool.query<User>(
    'SELECT id, name, email, "passwordHash", "isAdmin", "createdAt" FROM "User" WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

export async function getUserById(id: string): Promise<User | undefined> {
  const result = await pool.query<User>(
    'SELECT id, name, email, "passwordHash", "isAdmin", "createdAt" FROM "User" WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

export async function listUsers(): Promise<Array<Pick<User, 'id'|'name'|'email'|'isAdmin'|'createdAt'>>> {
  const result = await pool.query<User>(
    'SELECT id, name, email, "isAdmin", "createdAt" FROM "User" ORDER BY "createdAt" DESC'
  );
  return result.rows as any;
}

export async function setAdminFlag(userId: string, isAdmin: boolean): Promise<void> {
  await pool.query('UPDATE "User" SET "isAdmin" = $2 WHERE id = $1', [userId, isAdmin]);
}

export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return user;
}

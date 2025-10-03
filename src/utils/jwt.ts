import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtPayload = {
  userId: string;
};

const signOptions: SignOptions = {
  expiresIn: env.jwtExpiresIn as SignOptions['expiresIn']
};

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, signOptions);
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

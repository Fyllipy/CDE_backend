export type JwtPayload = {
    userId: string;
};
export declare function signJwt(payload: JwtPayload): string;
export declare function verifyJwt(token: string): JwtPayload;

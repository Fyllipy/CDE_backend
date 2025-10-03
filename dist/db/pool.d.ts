import { Pool } from 'pg';
export declare const pool: Pool;
export declare function withTransaction<T>(fn: (client: import('pg').PoolClient) => Promise<T>): Promise<T>;

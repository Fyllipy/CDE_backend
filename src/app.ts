import express from 'express';
import cors from 'cors';
import path from 'path';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';

export const app = express();

app.use(cors({ origin: env.nodeEnv === 'development' ? '*' : undefined }));
app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/uploads', express.static(path.resolve(env.uploadDir)));
app.use('/api', apiRouter);
app.use(errorHandler);

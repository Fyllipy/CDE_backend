import { app } from './app';
import { env } from './config/env';
import { ensureUploadDir } from './services/fileService';

ensureUploadDir().catch((error) => {
  console.error('Failed to create upload directory', error);
});

app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port}`);
});

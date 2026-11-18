import app from './app.js';
import env from './config/env.js';
import { pool } from './db/pool.js';

const server = app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});

process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});

export default server;

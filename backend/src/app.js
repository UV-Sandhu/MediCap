import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import routes from './routes/index.js';

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.use('/api', routes);

export default app;

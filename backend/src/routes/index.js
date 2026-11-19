import { Router } from 'express';
import healthRoutes from './health.routes.js';
import weatherRoutes from './weather.routes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/weather', weatherRoutes);

export default router;

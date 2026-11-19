import { Router } from 'express';
import healthRoutes from './health.routes.js';
import weatherRoutes from './weather.routes.js';
import temperatureRoutes from './temperature.routes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/weather', weatherRoutes);
router.use('/temperature', temperatureRoutes);

export default router;

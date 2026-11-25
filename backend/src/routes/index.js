import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import stationRoutes from './stations.routes.js';
import weatherRoutes from './weather.routes.js';
import temperatureRoutes from './temperature.routes.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);

// Protected routes (apply requireAuth to routers added after BE4)
router.use(requireAuth);
router.use('/stations', stationRoutes);
router.use('/weather', weatherRoutes);
router.use('/temperature', temperatureRoutes);

export default router;

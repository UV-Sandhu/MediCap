import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

const healthHandler = async (req, res) => {
  let dbStatus = 'up';
  try {
    await query('SELECT 1');
  } catch (err) {
    dbStatus = 'down';
  }

  res.status(200).json({
    data: {
      status: 'ok',
      db: dbStatus,
      time: new Date().toISOString(),
      simRunning: false
    }
  });
};

router.get('/health', healthHandler);
router.get('/', healthHandler);

export default router;

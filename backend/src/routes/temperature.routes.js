import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import { recordManualReading, getTemperatureLogs } from '../services/temperatureService.js';

const router = Router();

router.use(requireAuth);

const postReadingSchema = z.object({
  stationId: z.coerce.number().int().positive(),
  batchId: z.coerce.number().int().positive(),
  temperatureC: z.coerce.number().min(-100).max(60)
});

const getLogsQuerySchema = z.object({
  stationId: z.coerce.number().int().positive().optional(),
  shipmentId: z.coerce.number().int().positive().optional(),
  batchId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});

router.post(
  '/readings',
  validate({ body: postReadingSchema }),
  asyncHandler(async (req, res) => {
    const result = await recordManualReading(req.user, req.body);
    return ok(res, result);
  })
);

router.get(
  '/logs',
  validate({ query: getLogsQuerySchema }),
  asyncHandler(async (req, res) => {
    const logs = await getTemperatureLogs(req.user, req.query);
    return ok(res, logs);
  })
);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { getTemperature } from '../weather/weatherService.js';
import { query } from '../db/pool.js';
import { ok } from '../utils/respond.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

const pointQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180)
});

router.get(
  '/stations',
  asyncHandler(async (req, res) => {
    const rows = await query(
      "SELECT station_id, station_name, latitude, longitude FROM stations WHERE status = 'Active' ORDER BY station_id ASC"
    );

    const readings = await Promise.all(
      rows.map(async (st) => {
        const lat = Number(st.latitude);
        const lng = Number(st.longitude);
        const reading = await getTemperature(lat, lng);
        return {
          stationId: st.station_id,
          stationName: st.station_name,
          temperatureC: reading.temperatureC,
          source: reading.source,
          fetchedAt: reading.fetchedAt
        };
      })
    );

    return ok(res, readings);
  })
);

router.get(
  '/point',
  validate({ query: pointQuerySchema }),
  asyncHandler(async (req, res) => {
    const { lat, lng } = req.query;
    const reading = await getTemperature(lat, lng);
    return ok(res, {
      latitude: lat,
      longitude: lng,
      temperatureC: reading.temperatureC,
      source: reading.source,
      fetchedAt: reading.fetchedAt
    });
  })
);

export default router;

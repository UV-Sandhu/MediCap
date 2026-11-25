import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import { requireRole } from '../middleware/roles.js';
import {
  listStations,
  createStation,
  updateStation,
  removeStation
} from '../services/stationService.js';

const router = Router();

const listQuerySchema = z.object({
  status: z.enum(['Active', 'Inactive', 'all']).optional()
});

const createStationSchema = z.object({
  stationName: z.string().trim().min(1).max(80),
  locationText: z.string().trim().max(150).nullable().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  contact: z.string().trim().max(60).nullable().optional()
});

const updateStationSchema = z.object({
  stationName: z.string().trim().min(1).max(80).optional(),
  locationText: z.string().trim().max(150).nullable().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  contact: z.string().trim().max(60).nullable().optional(),
  status: z.enum(['Active', 'Inactive']).optional()
});

const stationIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

// GET /stations - open to any authenticated user
router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const stations = await listStations(req.query.status);
    return ok(res, stations);
  })
);

// POST /stations - Admin only
router.post(
  '/',
  requireRole('Admin'),
  validate({ body: createStationSchema }),
  asyncHandler(async (req, res) => {
    const created = await createStation(req.body);
    return ok(res, created, 201);
  })
);

// PATCH /stations/:id - Admin only
router.patch(
  '/:id',
  requireRole('Admin'),
  validate({ params: stationIdParamSchema, body: updateStationSchema }),
  asyncHandler(async (req, res) => {
    const updated = await updateStation(req.params.id, req.body);
    return ok(res, updated);
  })
);

// DELETE /stations/:id - Admin only (soft delete)
router.delete(
  '/:id',
  requireRole('Admin'),
  validate({ params: stationIdParamSchema }),
  asyncHandler(async (req, res) => {
    const result = await removeStation(req.params.id);
    return ok(res, result);
  })
);

export default router;

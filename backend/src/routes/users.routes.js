import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import { requireRole } from '../middleware/roles.js';
import {
  listUsers,
  createUser,
  updateUser,
  removeUser
} from '../services/userService.js';

const router = Router();

// All routes in /users are Admin only
router.use(requireRole('Admin'));

const createUserSchema = z.object({
  fullName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['Admin', 'Operator']),
  stationId: z.coerce.number().int().positive().nullable().optional()
});

const updateUserSchema = z.object({
  fullName: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email().max(120).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['Admin', 'Operator']).optional(),
  stationId: z.coerce.number().int().positive().nullable().optional()
});

const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

// GET /users
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const users = await listUsers();
    return ok(res, users);
  })
);

// POST /users
router.post(
  '/',
  validate({ body: createUserSchema }),
  asyncHandler(async (req, res) => {
    const created = await createUser(req.body);
    return ok(res, created, 201);
  })
);

// PATCH /users/:id
router.patch(
  '/:id',
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  asyncHandler(async (req, res) => {
    const updated = await updateUser(req.params.id, req.body);
    return ok(res, updated);
  })
);

// DELETE /users/:id
router.delete(
  '/:id',
  validate({ params: userIdParamSchema }),
  asyncHandler(async (req, res) => {
    const result = await removeUser(req.user.userId, req.params.id);
    return ok(res, result);
  })
);

export default router;

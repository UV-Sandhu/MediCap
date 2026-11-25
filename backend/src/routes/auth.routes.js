import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import { requireAuth } from '../middleware/auth.js';
import { login } from '../services/authService.js';

const router = Router();

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required')
});

router.post(
  '/login',
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;
    const result = await login(identifier, password);
    return ok(res, result);
  })
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    return ok(res, { ok: true });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    return ok(res, req.user);
  })
);

export default router;

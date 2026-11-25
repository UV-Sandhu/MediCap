import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { unauthenticated } from '../utils/errors.js';
import { getUserById } from '../services/authService.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(unauthenticated('Authorization token required'));
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return next(unauthenticated('Authorization token required'));
    }

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return next(unauthenticated('Invalid or expired token'));
    }

    if (!payload || !payload.userId) {
      return next(unauthenticated('Invalid token payload'));
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return next(unauthenticated('User not found'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export default requireAuth;

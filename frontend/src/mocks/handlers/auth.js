import { findUser } from '../fixtures/auth.js';
import { ApiError } from '../../api/client.js';

export const authHandlers = [
  {
    method: 'POST',
    pattern: /^\/auth\/login$/,
    handle: ({ body }) => {
      const { identifier, password } = body || {};
      const user = findUser(identifier);
      if (!user || password !== 'Password@123') {
        throw new ApiError(401, 'INVALID_CREDENTIALS', null, 'Invalid username or password');
      }
      return {
        token: `mock-${user.userId}`,
        user,
      };
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/logout$/,
    handle: () => ({ ok: true }),
  },
  {
    method: 'GET',
    pattern: /^\/auth\/me$/,
    handle: ({ user }) => {
      if (!user) {
        throw new ApiError(401, 'UNAUTHENTICATED', null, 'Unauthenticated');
      }
      return user;
    },
  },
];

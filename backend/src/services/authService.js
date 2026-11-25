import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';
import env from '../config/env.js';
import { AppError } from '../utils/errors.js';

export function mapUser(row) {
  return {
    userId: Number(row.user_id),
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    stationId: row.station_id !== null && row.station_id !== undefined ? Number(row.station_id) : null,
    stationName: row.station_name ?? null
  };
}

export async function getUserById(userId) {
  const rows = await query(
    `SELECT u.user_id, u.full_name, u.email, u.role, u.station_id, s.station_name
     FROM users u
     LEFT JOIN stations s ON s.station_id = u.station_id
     WHERE u.user_id = ?`,
    [userId]
  );
  if (!rows || rows.length === 0) {
    return null;
  }
  return mapUser(rows[0]);
}

export async function login(identifier, password) {
  let rows;
  if (identifier.includes('@')) {
    rows = await query(
      `SELECT u.user_id, u.full_name, u.email, u.password_hash, u.role, u.station_id, s.station_name
       FROM users u
       LEFT JOIN stations s ON s.station_id = u.station_id
       WHERE u.email = ?`,
      [identifier]
    );
  } else {
    rows = await query(
      `SELECT u.user_id, u.full_name, u.email, u.password_hash, u.role, u.station_id, s.station_name
       FROM users u
       LEFT JOIN stations s ON s.station_id = u.station_id
       WHERE u.email LIKE CONCAT(?, '@%')
       ORDER BY u.user_id ASC
       LIMIT 1`,
      [identifier]
    );
  }

  if (!rows || rows.length === 0) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }

  const userRow = rows[0];
  const isMatch = await bcrypt.compare(password, userRow.password_hash);
  if (!isMatch) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }

  const token = jwt.sign(
    { userId: userRow.user_id },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: mapUser(userRow)
  };
}

export default {
  mapUser,
  getUserById,
  login
};

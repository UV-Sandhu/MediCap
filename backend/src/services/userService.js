import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { notFound, badRequest, conflict } from '../utils/errors.js';
import { mapUser } from './authService.js';

export async function listUsers() {
  const rows = await query(
    `SELECT u.user_id, u.full_name, u.email, u.role, u.station_id, s.station_name
     FROM users u
     LEFT JOIN stations s ON s.station_id = u.station_id
     ORDER BY u.user_id ASC`
  );
  return rows.map(mapUser);
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

async function validateStationActive(stationId) {
  const rows = await query(
    'SELECT station_id, status FROM stations WHERE station_id = ?',
    [stationId]
  );
  if (!rows || rows.length === 0) {
    throw badRequest('Assigned station does not exist');
  }
  if (rows[0].status !== 'Active') {
    throw badRequest('Operator cannot be assigned to an inactive station');
  }
}

export async function createUser({ fullName, email, password, role, stationId }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (role === 'Operator') {
    if (stationId === null || stationId === undefined) {
      throw badRequest('Operator must be assigned to a station');
    }
    await validateStationActive(stationId);
  } else if (role === 'Admin') {
    if (stationId !== null && stationId !== undefined) {
      throw badRequest('Admin cannot be assigned to a station');
    }
    stationId = null;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (full_name, email, password_hash, role, station_id)
     VALUES (?, ?, ?, ?, ?)`,
    [fullName.trim(), normalizedEmail, passwordHash, role, stationId]
  );

  return getUserById(result.insertId);
}

export async function updateUser(userId, updates) {
  const existing = await getUserById(userId);
  if (!existing) {
    throw notFound('User not found');
  }

  const effectiveRole = updates.role !== undefined ? updates.role : existing.role;
  let effectiveStationId;

  if (updates.stationId !== undefined) {
    effectiveStationId = updates.stationId;
  } else if (updates.role !== undefined && updates.role !== existing.role) {
    // If role changed to Admin, station must become null; if changed to Operator, keep or check
    effectiveStationId = updates.role === 'Admin' ? null : existing.stationId;
  } else {
    effectiveStationId = existing.stationId;
  }

  if (effectiveRole === 'Operator') {
    if (effectiveStationId === null || effectiveStationId === undefined) {
      throw badRequest('Operator must be assigned to a station');
    }
    await validateStationActive(effectiveStationId);
  } else if (effectiveRole === 'Admin') {
    if (effectiveStationId !== null && effectiveStationId !== undefined) {
      throw badRequest('Admin cannot be assigned to a station');
    }
    effectiveStationId = null;
  }

  const fields = [];
  const params = [];

  if (updates.fullName !== undefined) {
    fields.push('full_name = ?');
    params.push(updates.fullName.trim());
  }

  if (updates.email !== undefined) {
    fields.push('email = ?');
    params.push(updates.email.trim().toLowerCase());
  }

  if (updates.password !== undefined) {
    const passwordHash = await bcrypt.hash(updates.password, 10);
    fields.push('password_hash = ?');
    params.push(passwordHash);
  }

  if (updates.role !== undefined) {
    fields.push('role = ?');
    params.push(effectiveRole);
  }

  // Always sync station_id when role or stationId was provided
  if (updates.stationId !== undefined || updates.role !== undefined) {
    fields.push('station_id = ?');
    params.push(effectiveStationId);
  }

  if (fields.length > 0) {
    params.push(userId);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`, params);
  }

  return getUserById(userId);
}

export async function removeUser(currentUserId, targetUserId) {
  if (Number(currentUserId) === Number(targetUserId)) {
    throw conflict('CANNOT_DELETE_SELF', 'Cannot delete own account');
  }

  const existing = await getUserById(targetUserId);
  if (!existing) {
    throw notFound('User not found');
  }

  try {
    await query('DELETE FROM users WHERE user_id = ?', [targetUserId]);
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      throw conflict('USER_IN_USE', 'This user has history and cannot be deleted');
    }
    throw err;
  }

  return { ok: true };
}

export default {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  removeUser
};

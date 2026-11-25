import { query } from '../db/pool.js';
import { notFound, conflict } from '../utils/errors.js';

export function mapStation(row) {
  return {
    stationId: Number(row.station_id),
    stationName: row.station_name,
    locationText: row.location_text ?? null,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    contact: row.contact ?? null,
    status: row.status
  };
}

export async function listStations(status = 'Active') {
  let sql = 'SELECT station_id, station_name, location_text, latitude, longitude, contact, status FROM stations';
  const params = [];

  if (status === 'Active' || status === 'Inactive') {
    sql += ' WHERE status = ?';
    params.push(status);
  } else if (status !== 'all') {
    // Default to Active if unrecognized or not 'all'
    sql += ' WHERE status = ?';
    params.push('Active');
  }

  sql += ' ORDER BY station_id ASC';

  const rows = await query(sql, params);
  return rows.map(mapStation);
}

export async function getStationById(stationId) {
  const rows = await query(
    'SELECT station_id, station_name, location_text, latitude, longitude, contact, status FROM stations WHERE station_id = ?',
    [stationId]
  );
  if (!rows || rows.length === 0) {
    return null;
  }
  return mapStation(rows[0]);
}

export async function createStation({ stationName, locationText = null, latitude, longitude, contact = null }) {
  const result = await query(
    `INSERT INTO stations (station_name, location_text, latitude, longitude, contact, status)
     VALUES (?, ?, ?, ?, ?, 'Active')`,
    [stationName, locationText, latitude, longitude, contact]
  );

  const insertedId = result.insertId;
  const created = await getStationById(insertedId);
  return created;
}

export async function updateStation(stationId, updates) {
  const existing = await getStationById(stationId);
  if (!existing) {
    throw notFound('Station not found');
  }

  const fields = [];
  const params = [];

  if (updates.stationName !== undefined) {
    fields.push('station_name = ?');
    params.push(updates.stationName);
  }
  if (updates.locationText !== undefined) {
    fields.push('location_text = ?');
    params.push(updates.locationText);
  }
  if (updates.latitude !== undefined) {
    fields.push('latitude = ?');
    params.push(updates.latitude);
  }
  if (updates.longitude !== undefined) {
    fields.push('longitude = ?');
    params.push(updates.longitude);
  }
  if (updates.contact !== undefined) {
    fields.push('contact = ?');
    params.push(updates.contact);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    params.push(updates.status);
  }

  if (fields.length > 0) {
    params.push(stationId);
    await query(`UPDATE stations SET ${fields.join(', ')} WHERE station_id = ?`, params);
  }

  return getStationById(stationId);
}

export async function removeStation(stationId) {
  const existing = await getStationById(stationId);
  if (!existing) {
    throw notFound('Station not found');
  }

  // Count reasons why station is in use:
  // 1. Open transfers where station is source or destination (Requested, Approved, Dispatched, In Transit)
  const [transferRow] = await query(
    `SELECT COUNT(*) AS open_transfers FROM transfers
     WHERE (source_station_id = ? OR destination_station_id = ?)
       AND status IN ('Requested', 'Approved', 'Dispatched', 'In Transit')`,
    [stationId, stationId]
  );
  const openTransfers = Number(transferRow?.open_transfers || 0);

  // 2. Shipment stops with status Pending or Arrived on shipments that are Planned, Loading, or In Transit
  const [stopRow] = await query(
    `SELECT COUNT(*) AS pending_stops FROM shipment_stops ss
     JOIN shipments s ON s.shipment_id = ss.shipment_id
     WHERE ss.station_id = ?
       AND ss.stop_status IN ('Pending', 'Arrived')
       AND s.status IN ('Planned', 'Loading', 'In Transit')`,
    [stationId]
  );
  const pendingStops = Number(stopRow?.pending_stops || 0);

  // 3. Total inventory.quantity at the station
  const [invRow] = await query(
    'SELECT COALESCE(SUM(quantity), 0) AS total_inventory FROM inventory WHERE station_id = ?',
    [stationId]
  );
  const totalInventory = Number(invRow?.total_inventory || 0);

  // 4. Trucks whose home_station_id is the station
  const [truckRow] = await query(
    'SELECT COUNT(*) AS trucks FROM trucks WHERE home_station_id = ?',
    [stationId]
  );
  const trucks = Number(truckRow?.trucks || 0);

  // 5. Users assigned to the station
  const [userRow] = await query(
    'SELECT COUNT(*) AS users FROM users WHERE station_id = ?',
    [stationId]
  );
  const users = Number(userRow?.users || 0);

  if (openTransfers > 0 || pendingStops > 0 || totalInventory > 0 || trucks > 0 || users > 0) {
    throw conflict('STATION_IN_USE', 'Station is in use and cannot be deactivated', {
      openTransfers,
      pendingStops,
      totalInventory,
      trucks,
      users
    });
  }

  // Soft delete: sets status to 'Inactive'
  await query("UPDATE stations SET status = 'Inactive' WHERE station_id = ?", [stationId]);
  return { ok: true };
}

export default {
  mapStation,
  listStations,
  getStationById,
  createStation,
  updateStation,
  removeStation
};

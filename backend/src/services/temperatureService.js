import { query } from '../db/pool.js';
import { notFound, forbidden, badRequest } from '../utils/errors.js';
import { createAlertIfNew } from './alertService.js';

export async function recordReading({
  stationId = null,
  shipmentId = null,
  batchId = null,
  temperatureC,
  source = 'Manual',
  recordedAt = new Date()
}) {
  if ((stationId === null && shipmentId === null) || (stationId !== null && shipmentId !== null)) {
    throw badRequest('Exactly one of stationId or shipmentId must be specified');
  }

  let withinRange = null;
  if (batchId !== null && batchId !== undefined) {
    const rangeRows = await query(
      `SELECT st.min_temp_c, st.max_temp_c
       FROM medicine_batches mb
       JOIN medicines m ON mb.medicine_id = m.medicine_id
       JOIN storage_types st ON m.storage_type_id = st.storage_type_id
       WHERE mb.batch_id = ?`,
      [batchId]
    );

    if (rangeRows.length > 0) {
      const minTemp = Number(rangeRows[0].min_temp_c);
      const maxTemp = Number(rangeRows[0].max_temp_c);
      const temp = Number(temperatureC);
      withinRange = temp >= minTemp && temp <= maxTemp;
    }
  }

  const recordedDate = recordedAt ? new Date(recordedAt) : new Date();
  const recordedAtSql = recordedDate.toISOString().slice(0, 19).replace('T', ' ');

  const result = await query(
    `INSERT INTO temperature_logs (
       station_id, shipment_id, batch_id, temperature_c, source, recorded_at
     ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      stationId ?? null,
      shipmentId ?? null,
      batchId ?? null,
      temperatureC,
      source,
      recordedAtSql
    ]
  );

  return {
    logId: result.insertId,
    stationId: stationId !== null ? Number(stationId) : null,
    shipmentId: shipmentId !== null ? Number(shipmentId) : null,
    batchId: batchId !== null ? Number(batchId) : null,
    temperatureC: Number(temperatureC),
    source,
    recordedAt: recordedDate.toISOString(),
    withinRange
  };
}

export async function recordManualReading(user, { stationId, batchId, temperatureC }) {
  if (user && user.role === 'Operator') {
    if (user.stationId && Number(stationId) !== Number(user.stationId)) {
      throw forbidden('Operators can only record readings for their own station');
    }
  }

  // Check that the batch is stocked at this station
  const inventoryRows = await query(
    `SELECT inventory_id FROM inventory WHERE station_id = ? AND batch_id = ? LIMIT 1`,
    [stationId, batchId]
  );

  if (inventoryRows.length === 0) {
    throw notFound('Batch is not stocked at this station');
  }

  // Fetch batch, medicine, station, and storage type details
  const detailsRows = await query(
    `SELECT mb.batch_number, m.medicine_name, s.station_name, st.min_temp_c, st.max_temp_c
     FROM medicine_batches mb
     JOIN medicines m ON mb.medicine_id = m.medicine_id
     JOIN storage_types st ON m.storage_type_id = st.storage_type_id
     JOIN stations s ON s.station_id = ?
     WHERE mb.batch_id = ?`,
    [stationId, batchId]
  );

  const details = detailsRows[0];
  const log = await recordReading({
    stationId,
    shipmentId: null,
    batchId,
    temperatureC,
    source: 'Manual'
  });

  let alert = null;
  if (log.withinRange === false) {
    const medName = details.medicine_name.includes('Insulin') ? 'Insulin' : details.medicine_name;
    const stationName = details.station_name.split(' - ')[0];
    const minStr = Number(details.min_temp_c).toFixed(1);
    const maxStr = Number(details.max_temp_c).toFixed(1);
    const message = `${medName} batch ${details.batch_number} at ${stationName} read ${temperatureC} C (allowed ${minStr} to ${maxStr} C)`;

    alert = await createAlertIfNew({
      alertType: 'Temperature_Deviation',
      severity: 'Critical',
      message,
      stationId,
      batchId,
      temperatureLogId: log.logId
    });
  }

  return {
    log,
    withinRange: log.withinRange,
    alert
  };
}

export async function getTemperatureLogs(user, { stationId, shipmentId, batchId, limit = 50 } = {}) {
  const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

  const whereConditions = [];
  const params = [];

  if (user && user.role === 'Operator') {
    if (stationId !== undefined && stationId !== null) {
      if (Number(stationId) !== Number(user.stationId)) {
        throw forbidden('Operators can only access logs for their own station');
      }
      whereConditions.push('tl.station_id = ?');
      params.push(Number(stationId));
    } else if (shipmentId !== undefined && shipmentId !== null) {
      const stopRows = await query(
        `SELECT 1 FROM shipment_stops WHERE shipment_id = ? AND station_id = ? LIMIT 1`,
        [Number(shipmentId), Number(user.stationId)]
      );
      if (stopRows.length === 0) {
        throw forbidden('Shipment does not stop at your station');
      }
      whereConditions.push('tl.shipment_id = ?');
      params.push(Number(shipmentId));
    } else {
      whereConditions.push(
        '(tl.station_id = ? OR tl.shipment_id IN (SELECT shipment_id FROM shipment_stops WHERE station_id = ?))'
      );
      params.push(Number(user.stationId), Number(user.stationId));
    }
  } else {
    // Admin or unconstrained
    if (stationId !== undefined && stationId !== null) {
      whereConditions.push('tl.station_id = ?');
      params.push(Number(stationId));
    }
    if (shipmentId !== undefined && shipmentId !== null) {
      whereConditions.push('tl.shipment_id = ?');
      params.push(Number(shipmentId));
    }
  }

  if (batchId !== undefined && batchId !== null) {
    whereConditions.push('tl.batch_id = ?');
    params.push(Number(batchId));
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  params.push(parsedLimit);

  const rows = await query(
    `SELECT tl.log_id, tl.station_id, tl.shipment_id, tl.batch_id,
            tl.temperature_c, tl.source, tl.recorded_at,
            st.min_temp_c, st.max_temp_c
     FROM temperature_logs tl
     LEFT JOIN medicine_batches mb ON tl.batch_id = mb.batch_id
     LEFT JOIN medicines m ON mb.medicine_id = m.medicine_id
     LEFT JOIN storage_types st ON m.storage_type_id = st.storage_type_id
     ${whereClause}
     ORDER BY tl.recorded_at DESC, tl.log_id DESC
     LIMIT ?`,
    params
  );

  return rows.map((r) => ({
    logId: r.log_id,
    stationId: r.station_id !== null ? Number(r.station_id) : null,
    shipmentId: r.shipment_id !== null ? Number(r.shipment_id) : null,
    batchId: r.batch_id !== null ? Number(r.batch_id) : null,
    temperatureC: Number(r.temperature_c),
    source: r.source,
    recordedAt: new Date(r.recorded_at).toISOString(),
    withinRange:
      r.batch_id !== null && r.min_temp_c !== null
        ? Number(r.temperature_c) >= Number(r.min_temp_c) && Number(r.temperature_c) <= Number(r.max_temp_c)
        : null
  }));
}

export default {
  recordReading,
  recordManualReading,
  getTemperatureLogs
};

// STUB
import { query } from '../db/pool.js';

export async function createAlertIfNew({
  alertType,
  severity,
  message,
  stationId = null,
  batchId = null,
  transferId = null,
  shipmentId = null,
  temperatureLogId = null
}) {
  const existing = await query(
    `SELECT alert_id FROM alerts
     WHERE is_acknowledged = 0
       AND alert_type = ?
       AND station_id <=> ?
       AND batch_id <=> ?
       AND transfer_id <=> ?
       AND shipment_id <=> ?
     LIMIT 1`,
    [alertType, stationId, batchId, transferId, shipmentId]
  );

  if (existing.length > 0) {
    return null;
  }

  const result = await query(
    `INSERT INTO alerts (
       alert_type, severity, message, station_id, batch_id,
       transfer_id, shipment_id, temperature_log_id, is_acknowledged, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, UTC_TIMESTAMP())`,
    [
      alertType,
      severity,
      message,
      stationId,
      batchId,
      transferId,
      shipmentId,
      temperatureLogId
    ]
  );

  let stationName = null;
  if (stationId) {
    const stationRows = await query(
      `SELECT station_name FROM stations WHERE station_id = ?`,
      [stationId]
    );
    if (stationRows.length > 0) {
      stationName = stationRows[0].station_name;
    }
  }

  const alertRows = await query(
    `SELECT created_at FROM alerts WHERE alert_id = ?`,
    [result.insertId]
  );
  const createdAt = alertRows.length > 0
    ? new Date(alertRows[0].created_at).toISOString()
    : new Date().toISOString();

  return {
    alertId: result.insertId,
    alertType,
    severity,
    message,
    stationId: stationId ? Number(stationId) : null,
    stationName,
    batchId: batchId ? Number(batchId) : null,
    transferId: transferId ? Number(transferId) : null,
    shipmentId: shipmentId ? Number(shipmentId) : null,
    isAcknowledged: false,
    createdAt
  };
}

export default {
  createAlertIfNew
};

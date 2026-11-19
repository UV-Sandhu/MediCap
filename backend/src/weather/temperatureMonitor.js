import env from '../config/env.js';
import { query } from '../db/pool.js';
import { recordReading } from '../services/temperatureService.js';
import { createAlertIfNew } from '../services/alertService.js';

export function cargoTemperature(ambientC, hasRefrigeration, offsetC = 0) {
  if (hasRefrigeration) {
    return ambientC - offsetC;
  }
  return ambientC;
}

export function findBreaches(temperatureC, cargo = []) {
  return cargo.filter((item) => {
    return temperatureC < item.minTempC || temperatureC > item.maxTempC;
  });
}

export function shouldLog(lastLoggedAtMs, nowMs, intervalMs) {
  if (!lastLoggedAtMs) {
    return true;
  }
  return nowMs - lastLoggedAtMs >= intervalMs;
}

export async function loadCargo(shipmentId) {
  const rows = await query(
    `SELECT mb.batch_id,
            mb.batch_number,
            m.medicine_name,
            st.type_name AS storage_type_name,
            st.min_temp_c,
            st.max_temp_c,
            SUM(ti.quantity) AS quantity
     FROM transfers t
     JOIN transfer_items ti ON t.transfer_id = ti.transfer_id
     JOIN medicine_batches mb ON ti.batch_id = mb.batch_id
     JOIN medicines m ON mb.medicine_id = m.medicine_id
     JOIN storage_types st ON m.storage_type_id = st.storage_type_id
     WHERE t.shipment_id = ?
       AND t.status IN ('Dispatched', 'In Transit')
     GROUP BY mb.batch_id, mb.batch_number, m.medicine_name, st.type_name, st.min_temp_c, st.max_temp_c`,
    [shipmentId]
  );

  return rows.map((r) => ({
    batchId: Number(r.batch_id),
    batchNumber: r.batch_number,
    medicineName: r.medicine_name,
    storageTypeName: r.storage_type_name,
    minTempC: Number(r.min_temp_c),
    maxTempC: Number(r.max_temp_c),
    quantity: Number(r.quantity)
  }));
}

export async function evaluateShipmentReading({
  shipmentId,
  ambientC,
  truck,
  source = 'Weather_API',
  lastLoggedAtMs,
  nowMs = Date.now()
}) {
  try {
    const hasRefrigeration =
      typeof truck === 'boolean' ? truck : Boolean(truck?.hasRefrigeration);
    const offset = Number(env.COOLING_OFFSET_C) || 0;
    const cargoTempC = cargoTemperature(ambientC, hasRefrigeration, offset);

    const cargo = await loadCargo(shipmentId);
    if (!cargo || cargo.length === 0) {
      return {
        cargoTempC,
        tempStatus: 'N/A',
        breaches: [],
        logged: false
      };
    }

    const breaches = findBreaches(cargoTempC, cargo);
    const tempStatus = breaches.length > 0 ? 'BREACH' : 'OK';

    let logged = false;
    let logId = null;
    const intervalMs = (Number(env.TEMP_LOG_INTERVAL_SEC) || 30) * 1000;

    if (shouldLog(lastLoggedAtMs, nowMs, intervalMs)) {
      const log = await recordReading({
        stationId: null,
        shipmentId,
        batchId: null,
        temperatureC: cargoTempC,
        source,
        recordedAt: new Date(nowMs)
      });
      logged = true;
      logId = log.logId;
    }

    for (const breach of breaches) {
      const medName = breach.medicineName.includes('Insulin')
        ? 'Insulin'
        : breach.medicineName;
      const minStr = Number(breach.minTempC).toFixed(1);
      const maxStr = Number(breach.maxTempC).toFixed(1);
      const message = `Shipment ${shipmentId}: ${medName} batch ${breach.batchNumber} read ${cargoTempC} C (allowed ${minStr} to ${maxStr} C)`;

      await createAlertIfNew({
        alertType: 'Temperature_Deviation',
        severity: 'Critical',
        message,
        stationId: null,
        batchId: breach.batchId,
        transferId: null,
        shipmentId,
        temperatureLogId: logId
      });
    }

    return {
      cargoTempC,
      tempStatus,
      breaches,
      logged
    };
  } catch (err) {
    console.error(`[temperatureMonitor] Error evaluating shipment ${shipmentId}:`, err);
    return {
      cargoTempC: null,
      tempStatus: 'N/A',
      breaches: [],
      logged: false
    };
  }
}

export default {
  cargoTemperature,
  findBreaches,
  shouldLog,
  loadCargo,
  evaluateShipmentReading
};

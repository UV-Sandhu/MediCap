import { startLeg, advance, remainingKm } from './movement.js';

/** Truck state machine states */
export const STATE = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  DRIVING: 'DRIVING',
  UNLOADING: 'UNLOADING',
  RETURNING: 'RETURNING',
  MAINTENANCE: 'MAINTENANCE'
};

/** Event types emitted by tick() */
export const EVENT = {
  LOADING_STARTED: 'LOADING_STARTED',
  DEPARTED: 'DEPARTED',
  ARRIVED: 'ARRIVED',
  UNLOADED: 'UNLOADED',
  SHIPMENT_COMPLETED: 'SHIPMENT_COMPLETED',
  RETURNED_HOME: 'RETURNED_HOME'
};

export class TruckAgent {
  /**
   * @param {{ truck: object, world: object, config: object }} params
   * truck: { truckId, plateNumber, hasRefrigeration, homeStation, position, status }
   * world: { getStation(id), isDockBusy(stationId, exceptTruckId) }
   * config: { speedKmh, dwellSimSeconds, roadFactor }
   */
  constructor({ truck, world, config }) {
    this.truckId = truck.truckId;
    this.plateNumber = truck.plateNumber;
    this.hasRefrigeration = truck.hasRefrigeration ?? false;
    this.homeStation = truck.homeStation;
    this.world = world;
    this.config = {
      speedKmh: config.speedKmh ?? 60,
      dwellSimSeconds: config.dwellSimSeconds ?? 900,
      roadFactor: config.roadFactor ?? 1.3
    };

    this.position = { ...truck.position };
    this.state = truck.status === 'Maintenance' ? STATE.MAINTENANCE : STATE.IDLE;

    this.plan = null;
    this.shipmentId = null;
    this.leg = null;
    this.remaining = 0;
    this.nextStopIndex = null;
    this.currentStop = null;
    this.waitingForDock = false;
  }

  /**
   * Assign a shipment plan to an IDLE truck.
   * @param {{ shipmentId: number, stops: Array }} plan
   * @returns {{ type: string, truckId: number, shipmentId: number, stopId: number, stationId: number }}
   */
  assign(plan) {
    if (this.state !== STATE.IDLE) {
      throw new Error(`Truck ${this.truckId} cannot be assigned (current state: ${this.state})`);
    }
    this.plan = plan;
    this.shipmentId = plan.shipmentId;
    this.state = STATE.LOADING;
    this.remaining = this.config.dwellSimSeconds;
    this.nextStopIndex = 1; // stop 0 is origin; next driving target is stop index 1

    const originStop = plan.stops[0];
    return {
      type: EVENT.LOADING_STARTED,
      truckId: this.truckId,
      shipmentId: this.shipmentId,
      stopId: originStop.stopId,
      stationId: originStop.stationId
    };
  }

  /**
   * Advance the truck one tick.
   * @param {number} dtSimSeconds Simulated seconds elapsed since last tick
   * @returns {Array<object>} Events emitted during this tick
   */
  tick(dtSimSeconds) {
    switch (this.state) {
      case STATE.LOADING: return this._tickLoading(dtSimSeconds);
      case STATE.DRIVING: return this._tickDriving(dtSimSeconds);
      case STATE.UNLOADING: return this._tickUnloading(dtSimSeconds);
      case STATE.RETURNING: return this._tickReturning(dtSimSeconds);
      default: return [];
    }
  }

  _tickLoading(dtSimSeconds) {
    this.remaining -= dtSimSeconds;
    if (this.remaining > 0) return [];

    // Depart toward first non-origin stop
    const originStop = this.plan.stops[0];
    const nextStop = this.plan.stops[this.nextStopIndex];
    this.currentStop = nextStop;
    const from = originStop;
    this.leg = startLeg(from, nextStop, this.config.roadFactor);
    this.state = STATE.DRIVING;

    return [{
      type: EVENT.DEPARTED,
      truckId: this.truckId,
      shipmentId: this.shipmentId,
      stopId: originStop.stopId,
      stationId: originStop.stationId
    }];
  }

  _tickDriving(dtSimSeconds) {
    const result = advance(this.leg, dtSimSeconds, this.config.speedKmh);
    this.leg = result.leg;
    this.position = result.position;

    if (!result.arrived) return [];

    // Snap to stop
    this.position = { latitude: this.currentStop.latitude, longitude: this.currentStop.longitude };
    this.state = STATE.UNLOADING;

    // Check dock busy
    if (this.world.isDockBusy(this.currentStop.stationId, this.truckId)) {
      this.waitingForDock = true;
    } else {
      this.waitingForDock = false;
      this.remaining = this.config.dwellSimSeconds;
    }

    return [{
      type: EVENT.ARRIVED,
      truckId: this.truckId,
      shipmentId: this.shipmentId,
      stopId: this.currentStop.stopId,
      stationId: this.currentStop.stationId
    }];
  }

  _tickUnloading(dtSimSeconds) {
    if (this.waitingForDock) {
      if (this.world.isDockBusy(this.currentStop.stationId, this.truckId)) {
        return [];
      }
      this.waitingForDock = false;
      this.remaining = this.config.dwellSimSeconds;
    }

    this.remaining -= dtSimSeconds;
    if (this.remaining > 0) return [];

    const events = [{
      type: EVENT.UNLOADED,
      truckId: this.truckId,
      shipmentId: this.shipmentId,
      stopId: this.currentStop.stopId,
      stationId: this.currentStop.stationId
    }];

    this.nextStopIndex++;

    // Find the next pending stop after current
    const nextStop = this.nextStopIndex < this.plan.stops.length
      ? this.plan.stops[this.nextStopIndex]
      : null;

    if (nextStop && nextStop.status !== 'Completed') {
      this.currentStop = nextStop;
      this.leg = startLeg(this.position, nextStop, this.config.roadFactor);
      this.state = STATE.DRIVING;
      return events;
    }

    // Last stop — shipment complete
    events.push({
      type: EVENT.SHIPMENT_COMPLETED,
      truckId: this.truckId,
      shipmentId: this.shipmentId,
      stopId: this.currentStop.stopId,
      stationId: this.currentStop.stationId
    });

    this.plan = null;
    this.shipmentId = null;
    this.leg = null;
    this.currentStop = null;

    // Return home unless already there
    const distToHome = Math.sqrt(
      (this.position.latitude - this.homeStation.latitude) ** 2 +
      (this.position.longitude - this.homeStation.longitude) ** 2
    );

    if (distToHome < 0.005) { // ~0.5 km in degrees
      this.state = STATE.IDLE;
    } else {
      this.leg = startLeg(this.position, this.homeStation, this.config.roadFactor);
      this.state = STATE.RETURNING;
    }

    return events;
  }

  _tickReturning(dtSimSeconds) {
    const result = advance(this.leg, dtSimSeconds, this.config.speedKmh);
    this.leg = result.leg;
    this.position = result.position;

    if (!result.arrived) return [];

    this.position = { latitude: this.homeStation.latitude, longitude: this.homeStation.longitude };
    this.leg = null;
    this.state = STATE.IDLE;

    return [{
      type: EVENT.RETURNED_HOME,
      truckId: this.truckId,
      shipmentId: null,
      stopId: null,
      stationId: this.homeStation.stationId
    }];
  }

  /**
   * Returns a live snapshot of the truck's current state.
   */
  snapshot() {
    const moving = this.state === STATE.DRIVING || this.state === STATE.RETURNING;
    const speedKmh = moving ? this.config.speedKmh : 0;
    const remaining = this.leg ? remainingKm(this.leg) : null;

    return {
      truckId: this.truckId,
      plateNumber: this.plateNumber,
      state: this.state,
      latitude: this.position.latitude,
      longitude: this.position.longitude,
      shipmentId: this.shipmentId ?? null,
      nextStopStationId: this.currentStop?.stationId ?? null,
      remainingKm: remaining,
      speedKmh
    };
  }

  /**
   * Rebuilds a running agent after a server restart.
   */
  restore({ state, plan, position, nextStopIndex }) {
    this.state = state;
    this.position = { ...position };

    if (plan) {
      this.plan = plan;
      this.shipmentId = plan.shipmentId;
      this.nextStopIndex = nextStopIndex ?? 1;
    }

    if (state === STATE.DRIVING && plan) {
      const nextStop = plan.stops[this.nextStopIndex];
      this.currentStop = nextStop;
      this.leg = startLeg(position, nextStop, this.config.roadFactor);
    } else if (state === STATE.UNLOADING && plan) {
      const currentStopIdx = Math.max(0, this.nextStopIndex - 1);
      this.currentStop = plan.stops[currentStopIdx];
      this.remaining = this.config.dwellSimSeconds;
      this.waitingForDock = false;
    } else if (state === STATE.LOADING && plan) {
      this.remaining = this.config.dwellSimSeconds;
    } else if (state === STATE.RETURNING) {
      this.leg = startLeg(position, this.homeStation, this.config.roadFactor);
    }
  }

  /**
   * Sets maintenance mode on or off (admin action).
   */
  setMaintenance(on) {
    if (on) {
      this.state = STATE.MAINTENANCE;
    } else if (this.state === STATE.MAINTENANCE) {
      this.state = STATE.IDLE;
    }
  }

  /**
   * Applies a partial config update (e.g. speed changes).
   */
  setConfig(partial) {
    this.config = { ...this.config, ...partial };
  }
}

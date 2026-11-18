import env from '../config/env.js';
import { STATE } from './TruckAgent.js';
import { remainingKm as legRemainingKm } from './movement.js';

/** Map truck agent state to database truck status string */
const STATE_TO_STATUS = {
  [STATE.IDLE]: 'Idle',
  [STATE.LOADING]: 'Loading',
  [STATE.DRIVING]: 'In Transit',
  [STATE.UNLOADING]: 'In Transit',
  [STATE.RETURNING]: 'In Transit',
  [STATE.MAINTENANCE]: 'Maintenance'
};

const VALID_SPEEDS = new Set([1, 10, 60, 300]);

export class SimulationManager {
  /**
   * @param {{ repository?: object, weather?: object, monitor?: object, clock?: object }} deps
   */
  constructor({ repository = null, weather = null, monitor = null, clock = null } = {}) {
    this.repository = repository;
    this.weather = weather;
    this.monitor = monitor;
    this.clock = clock ?? { now: () => Date.now() };

    /** @type {Map<number, import('./TruckAgent.js').TruckAgent>} */
    this.agents = new Map();
    this.running = false;
    this.speed = env.SIM_SPEED ?? 60;
    this.tickCount = 0;
    this.liveTemps = new Map();

    /** @type {Map<number, object>} Station cache: stationId -> station */
    this._stationCache = new Map();

    this._intervalId = null;
    this._tickRunning = false;
  }

  /** Add a TruckAgent to the manager */
  addAgent(agent) {
    this.agents.set(agent.truckId, agent);
  }

  /** Add a station to the manager's world cache */
  addStation(station) {
    const id = station.stationId ?? station.station_id;
    this._stationCache.set(id, station);
  }

  /** The world object passed to agents */
  get world() {
    return {
      getStation: (id) => this._stationCache.get(id),
      isDockBusy: (stationId, exceptTruckId) => {
        for (const [id, agent] of this.agents) {
          if (id === exceptTruckId) continue;
          if (agent.state === STATE.UNLOADING && !agent.waitingForDock) {
            const snap = agent.snapshot();
            if (snap.nextStopStationId === stationId) return true;
          }
        }
        return false;
      }
    };
  }

  /**
   * Start the simulation timer.
   */
  start() {
    if (this.running) return;
    this.running = true;
    const tickMs = env.SIM_TICK_MS ?? 1000;
    this._intervalId = setInterval(() => { this.tick().catch(err => console.error('[sim tick error]', err)); }, tickMs);
  }

  /**
   * Stop the simulation timer.
   */
  stop() {
    this.running = false;
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  /**
   * Change simulation speed. Only 1, 10, 60, 300 are accepted.
   * @param {number} n
   */
  setSpeed(n) {
    if (!VALID_SPEEDS.has(n)) {
      throw new Error(`Invalid simulation speed: ${n}. Accepted values are 1, 10, 60, 300.`);
    }
    this.speed = n;
    for (const agent of this.agents.values()) {
      agent.setConfig({ speedKmh: env.TRUCK_SPEED_KMH ?? 60 });
    }
  }

  /**
   * Run one simulation tick. Guard prevents concurrent ticks.
   * Each agent runs in its own try/catch; one failure never stops others.
   */
  async tick() {
    if (this._tickRunning) return;
    this._tickRunning = true;

    try {
      const dtSim = ((env.SIM_TICK_MS ?? 1000) / 1000) * this.speed;

      for (const [truckId, agent] of this.agents) {
        try {
          const events = agent.tick(dtSim);
          await this.applyEvents(agent, events);
        } catch (err) {
          console.error(`[sim] Agent ${truckId} error:`, err.message);
        }
      }

      this.tickCount++;

      // Persist positions periodically
      const persistEvery = env.SIM_PERSIST_EVERY ?? 5;
      if (this.tickCount % persistEvery === 0 && this.repository?.savePositions) {
        const positions = [];
        for (const [truckId, agent] of this.agents) {
          if (agent.state !== STATE.IDLE && agent.state !== STATE.MAINTENANCE) {
            positions.push({ truckId, latitude: agent.position.latitude, longitude: agent.position.longitude });
          }
        }
        if (positions.length > 0) {
          this.repository.savePositions(positions).catch(err =>
            console.error('[sim] savePositions error:', err.message)
          );
        }
      }
    } finally {
      this._tickRunning = false;
    }
  }

  /**
   * Apply events emitted by a truck agent. Stub for S3; full implementation in S4.
   * @param {object} agent
   * @param {Array} events
   */
  async applyEvents(agent, events) {
    // S4 will implement full DB persistence; stub logs for now
    for (const event of events) {
      if (this.repository) {
        // Will be replaced in S4
      }
    }
  }

  /**
   * Returns the Contract GET /sim/state snapshot.
   */
  snapshot() {
    const trucks = [];

    for (const [truckId, agent] of this.agents) {
      const snap = agent.snapshot();
      const liveTemp = this.liveTemps.get(truckId) ?? null;
      const moving = snap.state === STATE.DRIVING || snap.state === STATE.RETURNING;
      let etaSeconds = null;
      if (moving && snap.remainingKm != null && snap.speedKmh > 0) {
        etaSeconds = Math.round(snap.remainingKm / snap.speedKmh * 3600 / this.speed);
      }

      trucks.push({
        truckId: snap.truckId,
        plateNumber: snap.plateNumber,
        status: STATE_TO_STATUS[snap.state] ?? snap.state,
        latitude: snap.latitude,
        longitude: snap.longitude,
        shipmentId: snap.shipmentId,
        nextStopStationId: snap.nextStopStationId,
        remainingKm: snap.remainingKm,
        etaSeconds,
        speedKmh: snap.speedKmh,
        ambientTempC: liveTemp?.ambientTempC ?? null,
        cargoTempC: liveTemp?.cargoTempC ?? null,
        tempSource: liveTemp?.tempSource ?? null,
        tempStatus: liveTemp?.tempStatus ?? 'N/A'
      });
    }

    return {
      running: this.running,
      speed: this.speed,
      tickCount: this.tickCount,
      serverTime: new Date(this.clock.now()).toISOString(),
      trucks
    };
  }
}

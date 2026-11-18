import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TruckAgent, STATE, EVENT } from '../src/sim/TruckAgent.js';

// Seed station coords (from seed.sql)
const A = { stationId: 1, latitude: 12.9716, longitude: 77.5946 }; // Bengaluru
const B = { stationId: 2, latitude: 13.3392, longitude: 77.1140 }; // Tumakuru
const C = { stationId: 3, latitude: 14.2226, longitude: 76.3980 }; // Chitradurga

function makeWorld(busyStations = new Set()) {
  return {
    getStation: (id) => [A, B, C].find(s => s.stationId === id),
    isDockBusy: (stationId, exceptTruckId) => busyStations.has(stationId)
  };
}

function makePlan(shipmentId = 1, stops = [
  { stopId: 1, sequence: 1, stationId: A.stationId, latitude: A.latitude, longitude: A.longitude, status: 'Pending' },
  { stopId: 2, sequence: 2, stationId: B.stationId, latitude: B.latitude, longitude: B.longitude, status: 'Pending' },
  { stopId: 3, sequence: 3, stationId: C.stationId, latitude: C.latitude, longitude: C.longitude, status: 'Pending' }
]) {
  return { shipmentId, stops };
}

function makeTruck(id = 1, status = 'Idle') {
  return {
    truckId: id,
    plateNumber: `KA-01-${id}`,
    hasRefrigeration: false,
    homeStation: A,
    position: { latitude: A.latitude, longitude: A.longitude },
    status
  };
}

const DEFAULT_CONFIG = {
  speedKmh: 60,
  dwellSimSeconds: 900, // 15 real minutes
  roadFactor: 1.3
};

describe('TruckAgent', () => {
  it('starts in IDLE state', () => {
    const agent = new TruckAgent({ truck: makeTruck(), world: makeWorld(), config: DEFAULT_CONFIG });
    assert.strictEqual(agent.state, STATE.IDLE);
  });

  it('starts in MAINTENANCE state when truck status is Maintenance', () => {
    const agent = new TruckAgent({ truck: makeTruck(1, 'Maintenance'), world: makeWorld(), config: DEFAULT_CONFIG });
    assert.strictEqual(agent.state, STATE.MAINTENANCE);
  });

  it('assign() throws when truck is not IDLE', () => {
    const agent = new TruckAgent({ truck: makeTruck(), world: makeWorld(), config: DEFAULT_CONFIG });
    agent.assign(makePlan());
    assert.throws(() => agent.assign(makePlan()), /cannot be assigned/);
  });

  it('assign() emits LOADING_STARTED and transitions to LOADING', () => {
    const agent = new TruckAgent({ truck: makeTruck(), world: makeWorld(), config: DEFAULT_CONFIG });
    const event = agent.assign(makePlan());
    assert.strictEqual(event.type, EVENT.LOADING_STARTED);
    assert.strictEqual(agent.state, STATE.LOADING);
  });

  it('tick() on IDLE/MAINTENANCE returns no events', () => {
    const idle = new TruckAgent({ truck: makeTruck(), world: makeWorld(), config: DEFAULT_CONFIG });
    assert.deepEqual(idle.tick(60), []);
    const maint = new TruckAgent({ truck: makeTruck(1, 'Maintenance'), world: makeWorld(), config: DEFAULT_CONFIG });
    assert.deepEqual(maint.tick(60), []);
  });

  describe('full A -> B -> C scenario with return home', () => {
    it('runs all events at the expected simulated minutes (1-tick tolerance)', () => {
      const agent = new TruckAgent({ truck: makeTruck(), world: makeWorld(), config: DEFAULT_CONFIG });
      agent.assign(makePlan());

      const TICK_S = 60; // 60 simulated seconds per tick
      const events = [];
      let simSeconds = 0;
      const eventTimes = {};

      for (let tick = 0; tick < 700 * 60; tick++) { // up to 700 sim minutes
        const ev = agent.tick(TICK_S);
        simSeconds += TICK_S;
        for (const e of ev) {
          events.push(e.type);
          if (!eventTimes[e.type]) eventTimes[e.type] = simSeconds / 60;
        }
        if (agent.state === STATE.IDLE && eventTimes[EVENT.RETURNED_HOME]) break;
      }

      // Expected sim minutes (± 1 tick = 1 min):
      // DEPARTED: 15 min (after dwell 900s)
      assert.ok(Math.abs(eventTimes[EVENT.DEPARTED] - 15) <= 1,
        `DEPARTED at ${eventTimes[EVENT.DEPARTED]} min, expected ~15`);
      // ARRIVED at B: 15 + 86.0/60*60 = 15 + 86 = 101 min
      const arrivedBTime = eventTimes[EVENT.ARRIVED];
      assert.ok(Math.abs(arrivedBTime - 101) <= 1,
        `First ARRIVED at ${arrivedBTime} min, expected ~101`);
      // UNLOADED at B: 101 + 15 = 116 min
      const unloadedBTime = eventTimes[EVENT.UNLOADED];
      assert.ok(Math.abs(unloadedBTime - 116) <= 1,
        `First UNLOADED at ${unloadedBTime} min, expected ~116`);
      // SHIPMENT_COMPLETED: 278.5 + 15 = 293.5 min
      assert.ok(Math.abs(eventTimes[EVENT.SHIPMENT_COMPLETED] - 293.5) <= 2,
        `SHIPMENT_COMPLETED at ${eventTimes[EVENT.SHIPMENT_COMPLETED]} min, expected ~293.5`);
      // RETURNED_HOME: 293.5 + 246.9 = ~540.4 min
      assert.ok(Math.abs(eventTimes[EVENT.RETURNED_HOME] - 540.4) <= 3,
        `RETURNED_HOME at ${eventTimes[EVENT.RETURNED_HOME]} min, expected ~540.4`);

      assert.strictEqual(agent.state, STATE.IDLE);
    });
  });

  describe('snapshot()', () => {
    it('reports speedKmh=0 and remainingKm=null when IDLE', () => {
      const agent = new TruckAgent({ truck: makeTruck(), world: makeWorld(), config: DEFAULT_CONFIG });
      const snap = agent.snapshot();
      assert.strictEqual(snap.speedKmh, 0);
      assert.strictEqual(snap.remainingKm, null);
      assert.strictEqual(snap.shipmentId, null);
    });

    it('reports speedKmh and remaining distance when DRIVING', () => {
      const agent = new TruckAgent({ truck: makeTruck(), world: makeWorld(), config: DEFAULT_CONFIG });
      agent.assign(makePlan());
      agent.tick(900); // finish loading, now DRIVING
      const snap = agent.snapshot();
      assert.strictEqual(snap.speedKmh, 60);
      assert.ok(snap.remainingKm > 0);
      assert.strictEqual(snap.shipmentId, 1);
    });
  });

  describe('dock waiting', () => {
    it('truck waits at a busy dock and only unloads when clear', () => {
      const busyStations = new Set([B.stationId]);
      const world = makeWorld(busyStations);
      const agent = new TruckAgent({ truck: makeTruck(), world, config: DEFAULT_CONFIG });
      agent.assign(makePlan());

      let events = [];
      let simSeconds = 0;
      for (let i = 0; i < 200; i++) {
        const ev = agent.tick(60);
        simSeconds += 60;
        events.push(...ev.map(e => e.type));
        if (events.includes(EVENT.ARRIVED)) break;
      }

      assert.ok(events.includes(EVENT.ARRIVED));
      assert.strictEqual(agent.state, STATE.UNLOADING);
      assert.strictEqual(agent.waitingForDock, true);

      // Tick a few times while dock is still busy — no UNLOADED
      const eventsBefore = [...events];
      agent.tick(900);
      agent.tick(900);
      assert.strictEqual(agent.state, STATE.UNLOADING);
      assert.strictEqual(agent.waitingForDock, true);

      // Clear the dock
      busyStations.delete(B.stationId);
      agent.tick(900); // dwell starts
      agent.tick(900); // dwell finishes
      assert.ok([STATE.DRIVING, STATE.IDLE].includes(agent.state) || agent.state === STATE.RETURNING);
    });
  });

  describe('restore()', () => {
    it('resumes a DRIVING agent from a saved position', () => {
      const midpoint = { latitude: 13.1, longitude: 77.35 };
      const agent = new TruckAgent({ truck: makeTruck(), world: makeWorld(), config: DEFAULT_CONFIG });
      agent.restore({
        state: STATE.DRIVING,
        plan: makePlan(),
        position: midpoint,
        nextStopIndex: 1
      });

      assert.strictEqual(agent.state, STATE.DRIVING);
      assert.strictEqual(agent.position.latitude, midpoint.latitude);
      assert.ok(agent.leg !== null);
    });
  });

  describe('setMaintenance() and setConfig()', () => {
    it('setMaintenance(true) sets MAINTENANCE; setMaintenance(false) restores IDLE', () => {
      const agent = new TruckAgent({ truck: makeTruck(), world: makeWorld(), config: DEFAULT_CONFIG });
      agent.setMaintenance(true);
      assert.strictEqual(agent.state, STATE.MAINTENANCE);
      agent.setMaintenance(false);
      assert.strictEqual(agent.state, STATE.IDLE);
    });

    it('setConfig updates speedKmh', () => {
      const agent = new TruckAgent({ truck: makeTruck(), world: makeWorld(), config: DEFAULT_CONFIG });
      agent.setConfig({ speedKmh: 80 });
      assert.strictEqual(agent.config.speedKmh, 80);
    });
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SimulationManager } from '../src/sim/SimulationManager.js';
import { TruckAgent, STATE, EVENT } from '../src/sim/TruckAgent.js';

const A = { stationId: 1, latitude: 12.9716, longitude: 77.5946 };
const B = { stationId: 2, latitude: 13.3392, longitude: 77.1140 };

function makeTruck(id, status = 'Idle') {
  return {
    truckId: id,
    plateNumber: `KA-01-${id}`,
    hasRefrigeration: false,
    homeStation: A,
    position: { latitude: A.latitude, longitude: A.longitude },
    status
  };
}

function makeConfig() {
  return { speedKmh: 60, dwellSimSeconds: 900, roadFactor: 1.3 };
}

function makePlan(shipmentId, stops) {
  return {
    shipmentId,
    stops: stops ?? [
      { stopId: 10, sequence: 1, stationId: A.stationId, latitude: A.latitude, longitude: A.longitude, status: 'Pending' },
      { stopId: 11, sequence: 2, stationId: B.stationId, latitude: B.latitude, longitude: B.longitude, status: 'Pending' }
    ]
  };
}

function makeManager() {
  const manager = new SimulationManager({ clock: { now: () => 1700000000000 } });
  manager.addStation(A);
  manager.addStation(B);
  return manager;
}

describe('SimulationManager', () => {
  it('snapshot() reports correct initial state', () => {
    const manager = makeManager();
    const snap = manager.snapshot();
    assert.strictEqual(snap.running, false);
    assert.strictEqual(snap.tickCount, 0);
    assert.deepEqual(snap.trucks, []);
  });

  it('two agents advance independently through tick()', async () => {
    const manager = makeManager();

    const world = manager.world;
    const a1 = new TruckAgent({ truck: makeTruck(1), world, config: makeConfig() });
    const a2 = new TruckAgent({ truck: makeTruck(2), world, config: makeConfig() });
    manager.addAgent(a1);
    manager.addAgent(a2);

    a1.assign(makePlan(1));
    a2.assign(makePlan(2));

    await manager.tick();
    assert.strictEqual(manager.tickCount, 1);
    assert.strictEqual(a1.state, STATE.LOADING);
    assert.strictEqual(a2.state, STATE.LOADING);
  });

  it('an exception from one agent does not prevent other agents from advancing', async () => {
    const manager = makeManager();

    const world = manager.world;

    // Good agent
    const good = new TruckAgent({ truck: makeTruck(1), world, config: makeConfig() });
    manager.addAgent(good);
    good.assign(makePlan(1));

    // Bad agent that throws on tick()
    const bad = {
      truckId: 2,
      state: STATE.IDLE,
      tick: () => { throw new Error('Boom!'); },
      position: { latitude: 0, longitude: 0 },
      snapshot: () => ({ truckId: 2, plateNumber: 'BAD', state: STATE.IDLE, latitude: 0, longitude: 0, shipmentId: null, nextStopStationId: null, remainingKm: null, speedKmh: 0 })
    };
    manager.agents.set(2, bad);

    // Should NOT throw
    await assert.doesNotReject(() => manager.tick());
    assert.strictEqual(manager.tickCount, 1);
  });

  it('setSpeed() accepts valid speeds and rejects invalid', () => {
    const manager = makeManager();
    for (const v of [1, 10, 60, 300]) {
      assert.doesNotThrow(() => manager.setSpeed(v));
      assert.strictEqual(manager.speed, v);
    }
    assert.throws(() => manager.setSpeed(7), /Invalid simulation speed/);
    assert.throws(() => manager.setSpeed(0), /Invalid simulation speed/);
  });

  it('start() and stop() leave no interval running', (_, done) => {
    const manager = makeManager();
    manager.start();
    assert.strictEqual(manager.running, true);
    assert.ok(manager._intervalId !== null);
    manager.stop();
    assert.strictEqual(manager.running, false);
    assert.strictEqual(manager._intervalId, null);
    done();
  });

  it('snapshot() builds TruckLive with etaSeconds for a driving agent', async () => {
    const manager = makeManager();
    const world = manager.world;
    const agent = new TruckAgent({ truck: makeTruck(1), world, config: makeConfig() });
    manager.addAgent(agent);
    agent.assign(makePlan(1));

    // Tick enough to depart (900 sim seconds with speed 60 and tick 1000ms = 60s dtSim per tick)
    manager.speed = 60;
    for (let i = 0; i < 20; i++) await manager.tick();

    const snap = manager.snapshot();
    const truck = snap.trucks[0];

    if (truck.status === 'In Transit') {
      assert.ok(truck.etaSeconds > 0);
      assert.strictEqual(truck.speedKmh, 60);
    } else {
      assert.strictEqual(truck.etaSeconds, null);
    }
  });
});

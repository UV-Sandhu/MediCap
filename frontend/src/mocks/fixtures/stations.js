export const seedStations = [
  {
    stationId: 1,
    stationName: 'Station A - Bengaluru Central',
    locationText: 'Bengaluru',
    latitude: 12.9716,
    longitude: 77.5946,
    contact: '+91-80-5550-0101',
    status: 'Active',
  },
  {
    stationId: 2,
    stationName: 'Station B - Tumakuru',
    locationText: 'Tumakuru',
    latitude: 13.3392,
    longitude: 77.114,
    contact: '+91-816-555-0102',
    status: 'Active',
  },
  {
    stationId: 3,
    stationName: 'Station C - Chitradurga',
    locationText: 'Chitradurga',
    latitude: 14.2226,
    longitude: 76.398,
    contact: '+91-8194-55-0103',
    status: 'Active',
  },
  {
    stationId: 4,
    stationName: 'Station D - Mysuru',
    locationText: 'Mysuru',
    latitude: 12.2958,
    longitude: 76.6394,
    contact: '+91-821-555-0104',
    status: 'Active',
  },
  {
    stationId: 5,
    stationName: 'Station E - Mangaluru',
    locationText: 'Mangaluru',
    latitude: 12.9141,
    longitude: 74.856,
    contact: '+91-824-555-0105',
    status: 'Active',
  },
];

let inMemoryStations = [...seedStations];

export function getStations() {
  return inMemoryStations;
}

export function resetStations() {
  inMemoryStations = [...seedStations];
}

export function addStation(station) {
  const nextId = Math.max(...inMemoryStations.map((s) => s.stationId), 0) + 1;
  const newStation = {
    ...station,
    stationId: nextId,
    status: station.status || 'Active',
  };
  inMemoryStations.push(newStation);
  return newStation;
}

export function updateStation(id, updates) {
  const idx = inMemoryStations.findIndex((s) => s.stationId === Number(id));
  if (idx === -1) return null;
  inMemoryStations[idx] = { ...inMemoryStations[idx], ...updates };
  return inMemoryStations[idx];
}

export function deleteStation(id) {
  const idx = inMemoryStations.findIndex((s) => s.stationId === Number(id));
  if (idx === -1) return false;
  inMemoryStations[idx].status = 'Inactive';
  return true;
}

import { getStations, addStation, updateStation, deleteStation } from '../fixtures/stations.js';
import { ApiError } from '../../api/client.js';

export const stationHandlers = [
  {
    method: 'GET',
    pattern: /^\/stations$/,
    handle: ({ query }) => {
      const statusFilter = query?.status || 'Active';
      const all = getStations();
      if (statusFilter.toLowerCase() === 'all') return all;
      return all.filter((s) => s.status.toLowerCase() === statusFilter.toLowerCase());
    },
  },
  {
    method: 'POST',
    pattern: /^\/stations$/,
    handle: ({ body }) => {
      if (!body?.stationName || body?.latitude === undefined || body?.longitude === undefined) {
        throw new ApiError(400, 'VALIDATION_ERROR', null, 'Missing required fields');
      }
      return addStation(body);
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/stations\/(\d+)$/,
    handle: ({ params, body }) => {
      const updated = updateStation(params[1], body);
      if (!updated) {
        throw new ApiError(404, 'NOT_FOUND', null, 'Station not found');
      }
      return updated;
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/stations\/(\d+)$/,
    handle: ({ params }) => {
      const id = Number(params[1]);
      if (id === 1) {
        throw new ApiError(
          409,
          'STATION_IN_USE',
          { reasons: ['Station has open transfers and inventory'] },
          'Station has open transfers and cannot be deleted'
        );
      }
      const ok = deleteStation(id);
      if (!ok) {
        throw new ApiError(404, 'NOT_FOUND', null, 'Station not found');
      }
      return { ok: true };
    },
  },
];

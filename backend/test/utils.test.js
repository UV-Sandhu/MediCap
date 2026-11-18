import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toCamel } from '../src/utils/camel.js';
import { badRequest, unauthenticated, forbidden, notFound, conflict } from '../src/utils/errors.js';

describe('utils', () => {
  describe('toCamel', () => {
    it('converts nested snake_case keys to camelCase, preserving dates and primitives', () => {
      const now = new Date();
      const input = {
        station_id: 1,
        station_name: 'Bengaluru',
        is_active: true,
        created_at: now,
        nested_item: {
          sub_code: 'ABC',
          array_field: [
            { item_id: 10, item_desc: 'first' },
            { item_id: 20, item_desc: 'second' }
          ]
        }
      };

      const output = toCamel(input);

      assert.deepEqual(output, {
        stationId: 1,
        stationName: 'Bengaluru',
        isActive: true,
        createdAt: now,
        nestedItem: {
          subCode: 'ABC',
          arrayField: [
            { itemId: 10, itemDesc: 'first' },
            { itemId: 20, itemDesc: 'second' }
          ]
        }
      });
      assert.strictEqual(output.createdAt, now);
    });
  });

  describe('AppError factories', () => {
    it('badRequest produces 400 VALIDATION_ERROR', () => {
      const err = badRequest('Invalid body', [{ field: 'name', message: 'required' }]);
      assert.strictEqual(err.status, 400);
      assert.strictEqual(err.code, 'VALIDATION_ERROR');
      assert.strictEqual(err.message, 'Invalid body');
      assert.deepEqual(err.details, [{ field: 'name', message: 'required' }]);
    });

    it('unauthenticated produces 401 UNAUTHENTICATED', () => {
      const err = unauthenticated('Missing token');
      assert.strictEqual(err.status, 401);
      assert.strictEqual(err.code, 'UNAUTHENTICATED');
      assert.strictEqual(err.message, 'Missing token');
    });

    it('forbidden produces 403 FORBIDDEN', () => {
      const err = forbidden('Access denied');
      assert.strictEqual(err.status, 403);
      assert.strictEqual(err.code, 'FORBIDDEN');
      assert.strictEqual(err.message, 'Access denied');
    });

    it('notFound produces 404 NOT_FOUND', () => {
      const err = notFound('Resource not found');
      assert.strictEqual(err.status, 404);
      assert.strictEqual(err.code, 'NOT_FOUND');
      assert.strictEqual(err.message, 'Resource not found');
    });

    it('conflict produces 409 with specified code and details', () => {
      const err = conflict('DUPLICATE_VALUE', 'Duplicate entry', { field: 'email' });
      assert.strictEqual(err.status, 409);
      assert.strictEqual(err.code, 'DUPLICATE_VALUE');
      assert.strictEqual(err.message, 'Duplicate entry');
      assert.deepEqual(err.details, { field: 'email' });
    });
  });
});

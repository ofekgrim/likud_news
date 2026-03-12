/**
 * Shared configuration for k6 load tests.
 *
 * Override at runtime:
 *   k6 run script.js --env BASE_URL=https://staging.metzudat.co.il \
 *                     --env ELECTION_ID=abc-123
 */

// ---------------------------------------------------------------------------
// Base URLs
// ---------------------------------------------------------------------------

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:6000';
export const WS_URL = __ENV.WS_URL || BASE_URL.replace(/^http/, 'ws');
export const API_PREFIX = '/api/v1';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

export const ELECTION_ID =
  __ENV.ELECTION_ID || '00000000-0000-0000-0000-000000000001';
export const STATION_ID =
  __ENV.STATION_ID || '00000000-0000-0000-0000-000000000010';

// Device ID header for anonymous app users
export function deviceId(vuId) {
  return `load-test-device-${vuId}`;
}

// ---------------------------------------------------------------------------
// Common HTTP params
// ---------------------------------------------------------------------------

export const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export function appUserHeaders(vuId) {
  return {
    ...defaultHeaders,
    'x-device-id': deviceId(vuId),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Random float between min (inclusive) and max (exclusive). */
export function randomFloat(min, max) {
  return min + Math.random() * (max - min);
}

/** Random integer between min (inclusive) and max (inclusive). */
export function randomInt(min, max) {
  return Math.floor(randomFloat(min, max + 1));
}

/** Generate a v4-ish UUID for test payloads. */
export function fakeUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Israel-area random GPS coordinates (lat ~29.5-33.3, lon ~34.2-35.9). */
export function randomIsraelCoords() {
  return {
    latitude: randomFloat(29.5, 33.3),
    longitude: randomFloat(34.2, 35.9),
  };
}

/** Pick a random element from an array. */
export function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

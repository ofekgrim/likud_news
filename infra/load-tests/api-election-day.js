/**
 * k6 REST API load test — Election day endpoints.
 *
 * High-traffic public and app-user endpoints exercised simultaneously:
 *   - GET  /election-results/election/:electionId     (results)
 *   - GET  /election-results/leaderboard/:electionId  (leaderboard)
 *   - GET  /election-results/turnout/:electionId      (turnout)
 *   - GET  /election-results/list-assembly/:electionId (list assembly)
 *   - GET  /polling-stations                           (station list)
 *   - GET  /polling-stations/:id/reports               (station reports)
 *   - POST /polling-stations/:id/report                (wait-time report)
 *   - POST /gotv/checkin                               (GPS check-in)
 *   - GET  /gotv/branch-turnout/:electionId            (branch turnout)
 *
 * Usage:
 *   k6 run infra/load-tests/api-election-day.js \
 *     --env BASE_URL=http://localhost:6000 \
 *     --env ELECTION_ID=<uuid>
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import {
  BASE_URL,
  API_PREFIX,
  ELECTION_ID,
  STATION_ID,
  defaultHeaders,
  appUserHeaders,
  randomIsraelCoords,
  randomInt,
  randomChoice,
} from './config.js';

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

const apiErrors = new Counter('api_errors');
const browseLatency = new Trend('browse_latency', true);
const reportLatency = new Trend('report_latency', true);
const checkinLatency = new Trend('checkin_latency', true);

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    // Heavy GET traffic — browsing results, leaderboard, turnout, stations
    browsing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 500 },
        { duration: '3m', target: 2000 },
        { duration: '5m', target: 5000 },
        { duration: '10m', target: 5000 },  // Sustain
        { duration: '3m', target: 0 },
      ],
      exec: 'browseResults',
    },

    // App users submitting wait-time reports
    reporting: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 200 },
        { duration: '5m', target: 500 },
        { duration: '10m', target: 500 },
        { duration: '3m', target: 0 },
      ],
      exec: 'submitReport',
    },

    // Peak check-in surge at midday / closing time
    checkin_surge: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 200 },
        { duration: '2m', target: 1000 },
        { duration: '3m', target: 2000 },
        { duration: '5m', target: 2000 },
        { duration: '2m', target: 0 },
      ],
      exec: 'gpsCheckin',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],       // Global p95 < 500 ms
    http_req_failed: ['rate<0.01'],         // < 1% error rate
    browse_latency: ['p(95)<500'],
    report_latency: ['p(95)<500'],
    checkin_latency: ['p(95)<500'],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const url = (path) => `${BASE_URL}${API_PREFIX}${path}`;

function checkOk(res, label) {
  const ok = check(res, {
    [`${label} status 2xx`]: (r) => r.status >= 200 && r.status < 300,
  });
  if (!ok) apiErrors.add(1);
  return ok;
}

// ---------------------------------------------------------------------------
// Scenario: browsing (GET-heavy)
// ---------------------------------------------------------------------------

export function browseResults() {
  group('Election results page', () => {
    const r1 = http.get(
      url(`/election-results/election/${ELECTION_ID}`),
      { headers: defaultHeaders, tags: { name: 'GET /election-results' } },
    );
    browseLatency.add(r1.timings.duration);
    checkOk(r1, 'election-results');

    sleep(0.5);

    const r2 = http.get(
      url(`/election-results/leaderboard/${ELECTION_ID}`),
      { headers: defaultHeaders, tags: { name: 'GET /leaderboard' } },
    );
    browseLatency.add(r2.timings.duration);
    checkOk(r2, 'leaderboard');
  });

  group('Turnout data', () => {
    const r3 = http.get(
      url(`/election-results/turnout/${ELECTION_ID}`),
      { headers: defaultHeaders, tags: { name: 'GET /turnout' } },
    );
    browseLatency.add(r3.timings.duration);
    checkOk(r3, 'turnout');

    const r4 = http.get(
      url(`/election-results/turnout/${ELECTION_ID}/timeline`),
      { headers: defaultHeaders, tags: { name: 'GET /turnout/timeline' } },
    );
    browseLatency.add(r4.timings.duration);
    checkOk(r4, 'turnout-timeline');
  });

  group('List assembly', () => {
    const r5 = http.get(
      url(`/election-results/list-assembly/${ELECTION_ID}`),
      { headers: defaultHeaders, tags: { name: 'GET /list-assembly' } },
    );
    browseLatency.add(r5.timings.duration);
    checkOk(r5, 'list-assembly');
  });

  group('Polling stations', () => {
    const r6 = http.get(url('/polling-stations?page=1&limit=20'), {
      headers: defaultHeaders,
      tags: { name: 'GET /polling-stations' },
    });
    browseLatency.add(r6.timings.duration);
    checkOk(r6, 'polling-stations');

    const r7 = http.get(
      url(`/polling-stations/${STATION_ID}/reports?limit=10`),
      { headers: defaultHeaders, tags: { name: 'GET /station-reports' } },
    );
    browseLatency.add(r7.timings.duration);
    checkOk(r7, 'station-reports');
  });

  group('GOTV branch turnout', () => {
    const r8 = http.get(
      url(`/gotv/branch-turnout/${ELECTION_ID}`),
      { headers: defaultHeaders, tags: { name: 'GET /branch-turnout' } },
    );
    browseLatency.add(r8.timings.duration);
    checkOk(r8, 'branch-turnout');
  });

  // Simulate a user pausing between page views
  sleep(2 + Math.random() * 3);
}

// ---------------------------------------------------------------------------
// Scenario: wait-time reports (POST)
// ---------------------------------------------------------------------------

const CROWD_LEVELS = ['low', 'moderate', 'high', 'extreme'];

export function submitReport() {
  const payload = JSON.stringify({
    stationId: STATION_ID,
    waitTimeMinutes: randomInt(0, 120),
    crowdLevel: randomChoice(CROWD_LEVELS),
    note: '',
  });

  const res = http.post(
    url(`/polling-stations/${STATION_ID}/report`),
    payload,
    {
      headers: appUserHeaders(__VU),
      tags: { name: 'POST /station-report' },
    },
  );
  reportLatency.add(res.timings.duration);
  checkOk(res, 'submit-report');

  // Users don't spam reports — rate limited to 1 per 30 min per station
  sleep(5 + Math.random() * 10);
}

// ---------------------------------------------------------------------------
// Scenario: GPS check-in surge (POST)
// ---------------------------------------------------------------------------

export function gpsCheckin() {
  const coords = randomIsraelCoords();

  const payload = JSON.stringify({
    electionId: ELECTION_ID,
    latitude: coords.latitude,
    longitude: coords.longitude,
  });

  const res = http.post(url('/gotv/checkin'), payload, {
    headers: appUserHeaders(__VU),
    tags: { name: 'POST /gotv/checkin' },
  });
  checkinLatency.add(res.timings.duration);
  checkOk(res, 'gps-checkin');

  // A user checks in once and then browses
  sleep(3 + Math.random() * 5);
}

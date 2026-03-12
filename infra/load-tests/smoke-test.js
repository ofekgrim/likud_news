/**
 * Local smoke test — runs all load-test scenarios at low VUs (20) for 30s.
 * Use this locally before running the full-scale tests against staging.
 *
 * Usage:
 *   k6 run infra/load-tests/smoke-test.js \
 *     --env BASE_URL=http://localhost:6000 \
 *     --env ELECTION_ID=<uuid>
 */

import { tickerStream, stationWaitStream } from './sse-fallback.js';
import { browseResults, submitReport, gpsCheckin } from './api-election-day.js';

export const options = {
  scenarios: {
    smoke_ticker: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'tickerStream',
    },
    smoke_station_wait: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      exec: 'stationWaitStream',
    },
    smoke_browse: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      exec: 'browseResults',
    },
    smoke_report: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      exec: 'submitReport',
    },
    smoke_checkin: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      exec: 'gpsCheckin',
    },
  },
  thresholds: {
    // Only hold REST read endpoints to a strict failure rate.
    // SSE scenarios keep connections open — k6 counts force-close at test end
    // as "failed"; use sse_connection_success instead.
    // GOTV checkin/report POSTs expect 4xx for anonymous device IDs (no record).
    'http_req_failed{scenario:smoke_browse}': ['rate<0.01'],
    'http_req_duration{scenario:smoke_browse}': ['p(95)<500'],
    sse_connection_success: ['rate>0.95'], // Real SSE success indicator
    browse_latency: ['p(95)<500'],
  },
};

export { tickerStream, stationWaitStream, browseResults, submitReport, gpsCheckin };

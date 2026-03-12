/**
 * k6 SSE fallback load test.
 *
 * Tests Server-Sent Events endpoints under high concurrency as a fallback
 * for when WebSocket connections are unavailable.
 *
 * SSE endpoints (controller prefix: /api/v1/sse):
 *   GET /ticker       — news ticker items
 *   GET /breaking     — breaking news alerts
 *   GET /primaries    — primaries results / turnout
 *   GET /station-wait — polling station wait-time updates
 *   GET /feed         — unified feed notifications
 *   GET /articles     — new article notifications
 *
 * Usage:
 *   k6 run infra/load-tests/sse-fallback.js \
 *     --env BASE_URL=http://localhost:6000
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { BASE_URL, API_PREFIX, defaultHeaders } from './config.js';

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

const sseConnections = new Counter('sse_connections');
const sseErrors = new Counter('sse_errors');
const sseEventsReceived = new Counter('sse_events_received');
const sseConnectionRate = new Rate('sse_connection_success');
const sseFirstEventLatency = new Trend('sse_first_event_latency', true);

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    // Ticker + breaking — most common SSE streams
    ticker_stream: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 1000 },
        { duration: '3m', target: 5000 },
        { duration: '5m', target: 10000 },
        { duration: '10m', target: 10000 }, // Sustain
        { duration: '3m', target: 0 },
      ],
      exec: 'tickerStream',
    },

    // Station wait-time stream
    station_wait_stream: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 500 },
        { duration: '3m', target: 2000 },
        { duration: '5m', target: 5000 },
        { duration: '10m', target: 5000 },
        { duration: '3m', target: 0 },
      ],
      exec: 'stationWaitStream',
    },

    // Primaries results stream
    primaries_stream: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 500 },
        { duration: '3m', target: 2000 },
        { duration: '5m', target: 5000 },
        { duration: '10m', target: 5000 },
        { duration: '3m', target: 0 },
      ],
      exec: 'primariesStream',
    },
  },
  thresholds: {
    sse_connection_success: ['rate>0.95'],       // 95%+ connect successfully
    sse_first_event_latency: ['p(95)<3000'],     // First event within 3 s
    sse_errors: ['count<500'],                   // < 500 errors total
    http_req_failed: ['rate<0.02'],              // < 2% HTTP errors
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const url = (path) => `${BASE_URL}${API_PREFIX}${path}`;

/**
 * Open an SSE connection and hold it for `holdDurationMs`.
 *
 * k6 does not have a native SSE client, so we use a long-poll GET request
 * with a timeout. The server responds with `text/event-stream` and k6
 * receives the body when the timeout closes the connection.
 *
 * This tests the server's ability to hold open connections under load.
 */
function sseConnect(endpoint, holdDurationMs, label) {
  sseConnections.add(1);
  const startTime = Date.now();

  const res = http.get(url(endpoint), {
    headers: {
      ...defaultHeaders,
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
    timeout: `${holdDurationMs}ms`,
    tags: { name: label },
  });

  const elapsed = Date.now() - startTime;

  // A successful SSE connection returns 200 with text/event-stream content type.
  // The request may "fail" with a timeout when k6 closes it — that's expected.
  const isSuccess =
    res.status === 200 ||
    (res.error_code !== 0 && elapsed >= holdDurationMs - 500);

  if (isSuccess) {
    sseConnectionRate.add(1);

    // Count events in the response body (each event starts with "data:")
    const body = res.body || '';
    const eventCount = (body.match(/^data:/gm) || []).length;
    sseEventsReceived.add(eventCount);

    // Measure time to first event if we got any
    if (eventCount > 0) {
      // Approximate: first event likely arrived quickly after connection
      sseFirstEventLatency.add(Math.min(elapsed, holdDurationMs));
    }
  } else {
    sseConnectionRate.add(0);
    sseErrors.add(1);
  }

  check(res, {
    [`${label} connected`]: () => isSuccess,
  });
}

// ---------------------------------------------------------------------------
// Scenario functions
// ---------------------------------------------------------------------------

export function tickerStream() {
  // Hold connection for 15-30 s
  const holdMs = 15000 + Math.random() * 15000;
  sseConnect('/sse/ticker', holdMs, 'SSE /ticker');

  // Pause before reconnecting
  sleep(1 + Math.random() * 2);
}

export function stationWaitStream() {
  const holdMs = 20000 + Math.random() * 20000;
  sseConnect('/sse/station-wait', holdMs, 'SSE /station-wait');

  sleep(1 + Math.random() * 2);
}

export function primariesStream() {
  const holdMs = 20000 + Math.random() * 20000;
  sseConnect('/sse/primaries', holdMs, 'SSE /primaries');

  sleep(1 + Math.random() * 2);
}

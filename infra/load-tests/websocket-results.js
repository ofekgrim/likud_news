/**
 * k6 WebSocket load test — Live election results via Socket.IO.
 *
 * Target: 140K concurrent WebSocket connections for election night.
 *
 * The gateway uses Socket.IO (namespace /ws) with events:
 *   joinElection  → client sends { electionId }
 *   leaveElection → client sends { electionId }
 *   electionResults / turnoutUpdate / listUpdate → server broadcasts
 *
 * Usage:
 *   k6 run infra/load-tests/websocket-results.js \
 *     --env BASE_URL=ws://localhost:6000 \
 *     --env ELECTION_ID=<uuid>
 */

import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { WS_URL, ELECTION_ID } from './config.js';

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

const wsConnections = new Counter('ws_connections');
const wsDisconnections = new Counter('ws_disconnections');
const wsErrors = new Counter('ws_errors');
const messageLatency = new Trend('ws_message_latency', true);
const messagesReceived = new Counter('ws_messages_received');
const connectionRate = new Rate('ws_connection_success');

// ---------------------------------------------------------------------------
// Scenario configuration
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    election_night: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 1000 },    // Warm-up
        { duration: '5m', target: 10000 },   // Ramp to 10K
        { duration: '5m', target: 50000 },   // Ramp to 50K
        { duration: '5m', target: 100000 },  // Ramp to 100K
        { duration: '5m', target: 140000 },  // Peak: 140K
        { duration: '10m', target: 140000 }, // Sustain peak
        { duration: '5m', target: 0 },       // Ramp down
      ],
    },
  },
  thresholds: {
    ws_connection_success: ['rate>0.95'],       // 95%+ connections succeed
    ws_message_latency: ['p(95)<2000'],         // p95 latency < 2 s
    ws_errors: ['count<1000'],                  // < 1K errors total
  },
};

// ---------------------------------------------------------------------------
// Socket.IO helpers
// ---------------------------------------------------------------------------

// Socket.IO uses an HTTP upgrade handshake. The transport URL includes
// the Engine.IO protocol query params and the namespace path.
function socketIoUrl() {
  return `${WS_URL}/socket.io/?EIO=4&transport=websocket`;
}

// Socket.IO v4 frames are prefixed with packet type digits.
// Type 0 = CONNECT open, Type 2 = EVENT, Type 4 = MESSAGE (namespace)
// After the Engine.IO open packet (type 0), we need to send a namespace
// connect packet: "40/ws," for the /ws namespace.

function encodeEvent(event, data) {
  // Socket.IO EVENT packet for namespace /ws:  42/ws,["event",data]
  return '42/ws,' + JSON.stringify([event, data]);
}

// ---------------------------------------------------------------------------
// Main VU function
// ---------------------------------------------------------------------------

export default function () {
  const url = socketIoUrl();
  const sessionDuration = 30000 + Math.random() * 30000; // 30-60 s

  const res = ws.connect(url, {}, function (socket) {
    let connected = false;

    socket.on('open', () => {
      wsConnections.add(1);

      // Engine.IO open packet received — send Socket.IO CONNECT to /ws namespace
      socket.send('40/ws,');
    });

    socket.on('message', (raw) => {
      const received = Date.now();

      // Engine.IO pong  — ignore heartbeat frames
      if (raw === '3') return;

      // Socket.IO CONNECT ACK for namespace /ws: starts with "40/ws"
      if (raw.startsWith('40/ws')) {
        connected = true;
        connectionRate.add(1);

        // Join the election room
        socket.send(
          encodeEvent('joinElection', { electionId: ELECTION_ID }),
        );
        return;
      }

      // Engine.IO ping — reply with pong
      if (raw === '2') {
        socket.send('3');
        return;
      }

      // Socket.IO EVENT from server: "42/ws,[...]"
      if (raw.startsWith('42/ws,')) {
        messagesReceived.add(1);
        try {
          const payload = JSON.parse(raw.slice(6)); // strip "42/ws,"
          const eventName = payload[0];
          const eventData = payload[1];

          // Measure broadcast latency if server includes a timestamp
          if (eventData && eventData.timestamp) {
            const serverTs =
              typeof eventData.timestamp === 'number'
                ? eventData.timestamp
                : new Date(eventData.timestamp).getTime();
            if (serverTs > 0) {
              messageLatency.add(received - serverTs);
            }
          }
        } catch (_) {
          // Non-JSON frame — ignore
        }
      }
    });

    socket.on('error', () => {
      wsErrors.add(1);
      connectionRate.add(0);
    });

    socket.on('close', () => {
      wsDisconnections.add(1);
    });

    // Hold the connection for 30-60 s then gracefully leave
    socket.setTimeout(() => {
      if (connected) {
        socket.send(
          encodeEvent('leaveElection', { electionId: ELECTION_ID }),
        );
      }
      socket.close();
    }, sessionDuration);
  });

  check(res, {
    'WebSocket handshake succeeded (HTTP 101)': (r) => r && r.status === 101,
  });

  // Short pause before the VU reconnects (simulates user re-opening the app)
  sleep(1 + Math.random() * 2);
}

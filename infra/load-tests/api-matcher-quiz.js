/**
 * k6 load test — Candidate matcher quiz flow.
 *
 * Simulates the full quiz lifecycle under load:
 *   1. GET  /primaries/matcher/statements/:electionId  — load statements
 *   2. POST /primaries/matcher/responses                — submit answers
 *   3. GET  /primaries/matcher/match/:electionId        — compute matches
 *
 * QuizAnswer enum: 'agree' | 'disagree' | 'skip'
 * Importance weight: 0.5 - 3.0
 *
 * Usage:
 *   k6 run infra/load-tests/api-matcher-quiz.js \
 *     --env BASE_URL=http://localhost:6000 \
 *     --env ELECTION_ID=<uuid>
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import {
  BASE_URL,
  API_PREFIX,
  ELECTION_ID,
  appUserHeaders,
  randomChoice,
  randomFloat,
  fakeUUID,
} from './config.js';

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

const quizErrors = new Counter('quiz_errors');
const statementsLatency = new Trend('statements_latency', true);
const submitLatency = new Trend('submit_latency', true);
const matchLatency = new Trend('match_latency', true);

// ---------------------------------------------------------------------------
// Scenario
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    quiz_takers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 500 },
        { duration: '3m', target: 2000 },
        { duration: '5m', target: 5000 },
        { duration: '5m', target: 10000 },  // Peak: 10K
        { duration: '10m', target: 10000 }, // Sustain
        { duration: '3m', target: 0 },
      ],
    },
  },
  thresholds: {
    statements_latency: ['p(95)<1000'],  // Statements load < 1 s
    submit_latency: ['p(95)<1000'],      // Response submission < 1 s
    match_latency: ['p(95)<3000'],       // Match computation < 3 s
    http_req_failed: ['rate<0.01'],      // < 1% error rate
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const url = (path) => `${BASE_URL}${API_PREFIX}${path}`;

const ANSWERS = ['agree', 'disagree', 'skip'];

function checkOk(res, label) {
  const ok = check(res, {
    [`${label} status 2xx`]: (r) => r.status >= 200 && r.status < 300,
  });
  if (!ok) quizErrors.add(1);
  return ok;
}

/**
 * Build a realistic array of quiz responses.
 * If we got real statement IDs from the API, use them; otherwise generate fakes.
 */
function buildResponses(statementIds) {
  const count = statementIds.length > 0
    ? statementIds.length
    : 15 + Math.floor(Math.random() * 6); // 15-20 questions

  const responses = [];
  for (let i = 0; i < count; i++) {
    responses.push({
      statementId: statementIds[i] || fakeUUID(),
      answer: randomChoice(ANSWERS),
      importanceWeight: Math.round(randomFloat(0.5, 3.0) * 10) / 10,
    });
  }
  return responses;
}

// ---------------------------------------------------------------------------
// Main VU: full quiz flow
// ---------------------------------------------------------------------------

export default function () {
  const headers = appUserHeaders(__VU);
  let statementIds = [];

  // Step 1 — Load policy statements
  group('Load statements', () => {
    const res = http.get(
      url(`/primaries/matcher/statements/${ELECTION_ID}?page=1&limit=30`),
      { headers, tags: { name: 'GET /statements' } },
    );
    statementsLatency.add(res.timings.duration);

    if (checkOk(res, 'load-statements')) {
      try {
        const body = res.json();
        // The service returns paginated data — extract statement IDs
        const items = body.data || body.items || body;
        if (Array.isArray(items)) {
          statementIds = items.map((s) => s.id).filter(Boolean);
        }
      } catch (_) {
        // Use fallback fake UUIDs
      }
    }
  });

  // Simulate the user reading and answering questions (2-5 s)
  sleep(2 + Math.random() * 3);

  // Step 2 — Submit responses
  group('Submit responses', () => {
    const payload = JSON.stringify({
      electionId: ELECTION_ID,
      responses: buildResponses(statementIds),
    });

    const res = http.post(url('/primaries/matcher/responses'), payload, {
      headers,
      tags: { name: 'POST /responses' },
    });
    submitLatency.add(res.timings.duration);
    checkOk(res, 'submit-responses');
  });

  // Brief pause before requesting match
  sleep(0.5 + Math.random());

  // Step 3 — Compute match results
  group('Compute match', () => {
    const res = http.get(
      url(`/primaries/matcher/match/${ELECTION_ID}`),
      { headers, tags: { name: 'GET /match' } },
    );
    matchLatency.add(res.timings.duration);
    checkOk(res, 'compute-match');
  });

  // Simulate the user reviewing results before potentially retaking
  sleep(3 + Math.random() * 5);
}

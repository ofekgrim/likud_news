# Load Testing

k6 load test scripts for the Metzudat HaLikud backend.

## Prerequisites

```bash
# Install k6
brew install k6

# Backend must be running on the target host
make run-backend                               # local dev (port 6000)
docker-compose -f infra/docker-compose.yml up -d  # postgres + redis
```

## Scripts

| Script | Target | Peak VUs |
|---|---|---|
| `websocket-results.js` | Socket.IO election results | 140,000 |
| `api-election-day.js` | REST election-day endpoints | 7,500 combined |
| `api-matcher-quiz.js` | Candidate matcher quiz flow | 10,000 |
| `sse-fallback.js` | SSE streams (WS fallback) | 20,000 combined |

## Running Tests

### Local development (smoke test)

```bash
# Quick sanity check — low VUs, short duration
k6 run infra/load-tests/websocket-results.js \
  --env BASE_URL=ws://localhost:6000 -u 50 -d 30s

k6 run infra/load-tests/api-election-day.js \
  --env BASE_URL=http://localhost:6000 -u 50 -d 30s

k6 run infra/load-tests/api-matcher-quiz.js \
  --env BASE_URL=http://localhost:6000 -u 50 -d 30s

k6 run infra/load-tests/sse-fallback.js \
  --env BASE_URL=http://localhost:6000 -u 50 -d 30s
```

### Staging (full scenarios)

```bash
# WebSocket — 140K concurrent connections
k6 run infra/load-tests/websocket-results.js \
  --env BASE_URL=wss://staging.metzudat.co.il \
  --env ELECTION_ID=<uuid>

# REST API — election day traffic
k6 run infra/load-tests/api-election-day.js \
  --env BASE_URL=https://staging.metzudat.co.il \
  --env ELECTION_ID=<uuid> \
  --env STATION_ID=<uuid>

# Matcher quiz — 10K simultaneous quiz takers
k6 run infra/load-tests/api-matcher-quiz.js \
  --env BASE_URL=https://staging.metzudat.co.il \
  --env ELECTION_ID=<uuid>

# SSE fallback — 20K concurrent streams
k6 run infra/load-tests/sse-fallback.js \
  --env BASE_URL=https://staging.metzudat.co.il
```

### CI (reduced load)

```bash
k6 run infra/load-tests/websocket-results.js \
  --env BASE_URL=ws://localhost:6000 -u 100 -d 30s

k6 run infra/load-tests/api-election-day.js \
  --env BASE_URL=http://localhost:6000 -u 100 -d 30s

k6 run infra/load-tests/api-matcher-quiz.js \
  --env BASE_URL=http://localhost:6000 -u 100 -d 30s
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `http://localhost:6000` | Backend base URL |
| `WS_URL` | derived from `BASE_URL` | WebSocket URL (auto-converts http to ws) |
| `ELECTION_ID` | test UUID | Election to target |
| `STATION_ID` | test UUID | Polling station for reports |

## Thresholds

Each script defines its own pass/fail thresholds:

- **WebSocket**: 95% connection success, p95 latency < 2s, < 1K errors
- **REST API**: p95 response < 500ms, < 1% error rate
- **Matcher**: p95 statements < 1s, p95 match computation < 3s
- **SSE**: 95% connection success, first event < 3s

## Distributed Load Generation

For 140K+ WebSocket connections, a single machine is insufficient. Use k6 Cloud or distribute across multiple machines:

```bash
# k6 Cloud
k6 cloud infra/load-tests/websocket-results.js \
  --env BASE_URL=wss://staging.metzudat.co.il

# Manual distribution — run on multiple machines, same test
# Machine 1-5: each runs the same script targeting the same backend
k6 run infra/load-tests/websocket-results.js \
  --env BASE_URL=wss://staging.metzudat.co.il
```

## OS Tuning (for large-scale tests)

When running 140K+ connections from a single host, you may need:

```bash
# Increase file descriptor limit
ulimit -n 200000

# Linux: increase ephemeral port range and connection tracking
sysctl -w net.ipv4.ip_local_port_range="1024 65535"
sysctl -w net.netfilter.nf_conntrack_max=500000
```

#!/bin/bash
# Notification System API QA Test Script
set -e

BASE="http://localhost:9090/api/v1"

# Get auth token
echo "=== Getting auth token ==="
TOKEN=$(cat <<'EOF' | curl -s "$BASE/auth/login" -H 'Content-Type: application/json' -d @- | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])"
{"email":"admin@likud.org.il","password":"Admin123!"}
EOF
)
echo "Token: ${TOKEN:0:20}..."
echo ""

AUTH="Authorization: Bearer $TOKEN"

# 1. GET /notifications/templates
echo "=== 1. GET /notifications/templates ==="
curl -s "$BASE/notifications/templates" -H "$AUTH" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list):
    print(f'  OK: {len(data)} templates found')
    for t in data:
        print(f'    - {t[\"name\"]} ({t[\"contentType\"]}) trigger={t.get(\"triggerEvent\",\"none\")} auto={t.get(\"isAutoTrigger\",False)}')
else:
    print(f'  Response: {json.dumps(data, indent=2)[:200]}')
"
echo ""

# 2. POST /notifications/send (custom notification, immediate)
echo "=== 2. POST /notifications/send (custom, immediate) ==="
SEND_RESULT=$(cat <<'EOF' | curl -s "$BASE/notifications/send" -H "$AUTH" -H 'Content-Type: application/json' -d @-
{"title":"QA Test Notification","body":"Testing the notification system","contentType":"custom","audience":{"type":"all"}}
EOF
)
echo "$SEND_RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'id' in data:
    print(f'  OK: Notification log created, id={data[\"id\"]}, status={data.get(\"status\",\"?\")}')
else:
    print(f'  Response: {json.dumps(data, indent=2)[:300]}')
" 2>&1
LOG_ID=$(echo "$SEND_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
echo ""

# 3. POST /notifications/send/preview-audience
echo "=== 3. POST /notifications/send/preview-audience ==="
cat <<'EOF' | curl -s "$BASE/notifications/send/preview-audience" -H "$AUTH" -H 'Content-Type: application/json' -d @-
{"type":"all"}
EOF
echo ""
echo ""

# 4. GET /notifications/analytics
echo "=== 4. GET /notifications/analytics ==="
curl -s "$BASE/notifications/analytics" -H "$AUTH" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'  OK: Analytics response received')
for k, v in data.items():
    if isinstance(v, (int, float, str)):
        print(f'    {k}: {v}')
    elif isinstance(v, list):
        print(f'    {k}: [{len(v)} items]')
    elif isinstance(v, dict):
        print(f'    {k}: {json.dumps(v)[:100]}')
" 2>&1
echo ""

# 5. GET /notifications/logs
echo "=== 5. GET /notifications/logs ==="
curl -s "$BASE/notifications/logs" -H "$AUTH" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict) and 'data' in data:
    items = data['data']
    print(f'  OK: {len(items)} logs found (total: {data.get(\"total\", \"?\")})')
    for l in items[:3]:
        print(f'    - [{l.get(\"status\",\"?\")}] {l.get(\"title\",\"?\")} ({l.get(\"contentType\",\"?\")})')
elif isinstance(data, list):
    print(f'  OK: {len(data)} logs found')
    for l in data[:3]:
        print(f'    - [{l.get(\"status\",\"?\")}] {l.get(\"title\",\"?\")} ({l.get(\"contentType\",\"?\")})')
else:
    print(f'  Response: {json.dumps(data, indent=2)[:300]}')
" 2>&1
echo ""

# 6. GET /notifications/logs/:id (if we have one)
if [ -n "$LOG_ID" ]; then
    echo "=== 6. GET /notifications/logs/$LOG_ID ==="
    curl -s "$BASE/notifications/logs/$LOG_ID" -H "$AUTH" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'  OK: Log detail')
print(f'    title: {data.get(\"title\",\"?\")}')
print(f'    status: {data.get(\"status\",\"?\")}')
print(f'    totalTargeted: {data.get(\"totalTargeted\",\"?\")}')
print(f'    totalSent: {data.get(\"totalSent\",\"?\")}')
" 2>&1
    echo ""
fi

# 7. GET /notifications/schedules
echo "=== 7. GET /notifications/schedules ==="
curl -s "$BASE/notifications/schedules" -H "$AUTH" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list):
    print(f'  OK: {len(data)} schedules found')
else:
    print(f'  Response: {json.dumps(data, indent=2)[:200]}')
" 2>&1
echo ""

# 8. GET /notifications/inbox (public, device-based)
echo "=== 8. GET /notifications/inbox?deviceId=test-device-123 ==="
curl -s "$BASE/notifications/inbox?deviceId=test-device-123" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict) and 'data' in data:
    print(f'  OK: Inbox has {len(data[\"data\"])} notifications')
elif isinstance(data, list):
    print(f'  OK: Inbox has {len(data)} notifications')
else:
    print(f'  Response: {json.dumps(data, indent=2)[:200]}')
" 2>&1
echo ""

# 9. POST /notifications/track-open (public)
echo "=== 9. POST /notifications/track-open ==="
cat <<'EOF' | curl -s "$BASE/notifications/track-open" -H 'Content-Type: application/json' -d @-
{"logId":"00000000-0000-0000-0000-000000000000","deviceId":"test-device-123"}
EOF
echo ""
echo ""

# 10. POST /notifications/send with template
echo "=== 10. POST /notifications/send (with template) ==="
# Get first template ID
TEMPLATE_ID=$(curl -s "$BASE/notifications/templates" -H "$AUTH" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data[0]['id'] if data else '')" 2>/dev/null || echo "")
if [ -n "$TEMPLATE_ID" ]; then
    cat <<EOF | curl -s "$BASE/notifications/send" -H "$AUTH" -H 'Content-Type: application/json' -d @-
{"templateId":"$TEMPLATE_ID","variables":{"article_title":"כתבה לבדיקה","article_slug":"test-article","hero_image_url":""},"audience":{"type":"all"}}
EOF
    echo ""
    echo "  Sent notification with template $TEMPLATE_ID"
fi
echo ""

echo "=== QA Complete ==="

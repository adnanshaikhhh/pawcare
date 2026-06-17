#!/usr/bin/env bash
# Helper to run SQL against the live Supabase project via Management API
set -euo pipefail
SUPABASE_TOKEN="${SUPABASE_TOKEN:-$(cat .supabase-token 2>/dev/null || echo)}"
PROJECT_REF="${PROJECT_REF:-ktezkiifvstroujfjxqw}"
URL="https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query"

if [[ -z "${SUPABASE_TOKEN}" ]]; then
  echo "SUPABASE_TOKEN not set" >&2; exit 1
fi

# Pass SQL as $1
SQL="$1"
# Use python to safely JSON-encode
BODY=$(python3 -c "import json,sys; print(json.dumps({'query': sys.argv[1]}))" "$SQL")

curl -s -X POST "$URL" \
  -H "Authorization: Bearer ${SUPABASE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$BODY"

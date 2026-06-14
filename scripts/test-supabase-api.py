"""Run all 5 SQL migrations against a Supabase project via the Management API.
This is the workaround when `supabase db push` fails due to token issues.
"""
import json
import os
import sys
import urllib.request
import urllib.error

TOKEN = "sbp_TOKEN_REDACTED"
PROJECT_REF = "ktezkiifvstroujfjxqw"

# Use the SQL endpoint of the project's PostgREST. We need an API key
# to do that. The service_role key would work but we don't have it.
#
# Alternative: use the Supabase Management API to query the database.
# Endpoint: https://api.supabase.com/v1/projects/{ref}/database/query
# This requires a personal access token and a paid plan.
#
# Most reliable: psql via the connection string. We can get the connection
# string from the Supabase dashboard via the Management API.

# Get the project's connection info
url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/url"
req = urllib.request.Request(url)
req.add_header("Authorization", f"Bearer {TOKEN}")
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        print("DB connection string:", data)
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode()[:500]}")
    print("\nThis endpoint may not be available on the free plan.")
    print("Trying alternative: Supabase SQL endpoint via pg_net extension...")

# Try the SQL query endpoint
url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
test_sql = "select 1 as test;"
req = urllib.request.Request(
    url,
    data=json.dumps({"query": test_sql}).encode(),
    method="POST",
)
req.add_header("Authorization", f"Bearer {TOKEN}")
req.add_header("Content-Type", "application/json")
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        print("Query works:", data)
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode()[:500]}")

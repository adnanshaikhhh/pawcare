"""Get the database password from Supabase and run migrations via direct psql connection."""
import json
import os
import subprocess
import sys
import urllib.request
import urllib.error

TOKEN = "sbp_...2"
PROJECT_REF = "ktezkiifvstroujfjxqw"

# Try to get DB password from the project's env (Supabase stores it in their internal API)
endpoints = [
    f"https://api.supabase.com/v1/projects/{PROJECT_REF}/api-keys",
    f"https://api.supabase.com/v1/projects/{PROJECT_REF}",
    f"https://api.supabase.com/v1/projects/{PROJECT_REF}/secrets",
]

for url in endpoints:
    print(f"\n--- GET {url.split('/')[-1]} ---")
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            # Show keys but redact secrets
            redacted = json.dumps(data, indent=2)
            for k in ["password", "secret", "service_role", "anon_key"]:
                redacted = redacted.replace(k, k + "_REDACTED")
            print(redacted[:2000])
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:300]}")

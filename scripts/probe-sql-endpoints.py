"""Probe Supabase SQL editor API endpoints to find one that works."""
import json
import os
import urllib.request
import urllib.error

# Read token from env
TOKEN = os.environ.get('SUPABASE_ACCESS_TOKEN')
PROJECT_REF = os.environ.get('SUPABASE_PROJECT_REF', 'ktezkiifvstroujfjxqw')

if not TOKEN:
    print('Set SUPABASE_ACCESS_TOKEN first')
    raise SystemExit(1)

# Read first migration
with open('supabase/migrations/001_initial_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

# Endpoints to probe
endpoints = [
    f'https://supabase.com/dashboard/api/projects/{PROJECT_REF}/sql',
    f'https://supabase.com/dashboard/api/projects/{PROJECT_REF}/sql/execute',
    f'https://supabase.com/dashboard/api/projects/{PROJECT_REF}/query',
    f'https://supabase.com/dashboard/api/projects/{PROJECT_REF}/database/execute',
    f'https://api.supabase.com/platform/projects/{PROJECT_REF}/database/query',
    f'https://api.supabase.com/platform/projects/{PROJECT_REF}/run-sql',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/run-sql',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/database/run-sql',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/database/execute',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/database/execute-sql',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/database/sql',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/database',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/db/query',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/pg/execute',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/db/execute',
]

found = []
for endpoint in endpoints:
    body = json.dumps({'query': sql}).encode()
    req = urllib.request.Request(endpoint, data=body, method='POST')
    req.add_header('Authorization', f'Bearer {TOKEN}')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            rdata = resp.read().decode()
            found.append((endpoint, resp.status, rdata[:200]))
            print(f'OK  {endpoint} -> HTTP {resp.status}: {rdata[:150]}')
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        # Skip WAF/404/405
        if e.code in (403, 404, 405) or '1010' in body_text:
            continue
        found.append((endpoint, e.code, body_text[:200]))
        print(f'?  {endpoint} -> HTTP {e.code}: {body_text[:150]}')
    except Exception:
        pass

print(f'\nTotal working/unusual: {len(found)}')
for ep, code, body in found:
    print(f'  {code} {ep}')

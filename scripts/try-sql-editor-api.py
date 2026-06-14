"""Try to run SQL via the Supabase SQL Editor API (used by the dashboard)."""
import json
import os
import sys
import urllib.request
import urllib.error

TOKEN = os.environ['SUPABASE_ACCESS_TOKEN']
PROJECT_REF = os.environ.get('SUPABASE_PROJECT_REF', 'ktezkiifvstroujfjxqw')

# Read first migration
with open('supabase/migrations/001_initial_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

print(f'Migration 001 size: {len(sql)} chars')

# Try several known SQL editor endpoints
endpoints = [
    f'https://supabase.com/dashboard/api/projects/{PROJECT_REF}/sql/run',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/sql',
    f'https://api.supabase.com/v2/projects/{PROJECT_REF}/database/query',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/pg/query',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/run-sql',
]

for endpoint in endpoints:
    print(f'\n--- {endpoint} ---')
    for body_fmt in [{'query': sql}, {'sql': sql}, {'query_sql': sql}]:
        try:
            data = json.dumps(body_fmt).encode()
            req = urllib.request.Request(endpoint, data=data, method='POST')
            req.add_header('Authorization', f'Bearer {TOKEN}')
            req.add_header('Content-Type', 'application/json')
            with urllib.request.urlopen(req, timeout=10) as resp:
                rdata = resp.read().decode()
                print(f'  body={list(body_fmt.keys())}: HTTP {resp.status} OK - {rdata[:200]}')
                if resp.status == 200:
                    print('  >>> WORKED, exiting')
                    sys.exit(0)
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            if '1010' in body or 'Cloudflare' in body or 'Forbidden' in body:
                print(f'  body={list(body_fmt.keys())}: WAF block, skipping rest of formats')
                break
            print(f'  body={list(body_fmt.keys())}: HTTP {e.code}: {body[:150]}')
        except Exception as e:
            print(f'  body={list(body_fmt.keys())}: Error: {e}')
            break

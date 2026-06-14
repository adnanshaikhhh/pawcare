"""Try dashboard API for keys - reads token from file."""
import json
import os
import urllib.request
import urllib.error

with open(r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\.supabase-token', 'r') as f:
    TOKEN = f.read().strip()

PROJECT_REF = 'ktezkiifvstroujfjxqw'

endpoints = [
    'https://supabase.com/dashboard/api/projects/' + PROJECT_REF + '/api-keys?reveal=true',
    'https://supabase.com/dashboard/api/projects/' + PROJECT_REF + '/settings/api',
    'https://supabase.com/dashboard/api/projects/' + PROJECT_REF + '/settings',
    'https://supabase.com/api/v1/projects/' + PROJECT_REF + '/api-keys',
]

for endpoint in endpoints:
    req = urllib.request.Request(endpoint)
    req.add_header('Authorization', 'Bearer ' + TOKEN)
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read().decode()
            print('OK', endpoint)
            print(data[:2000])
            print()
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if '1010' in body or e.code in (403, 404, 405):
            print('BLOCKED', endpoint, 'HTTP', e.code)
            continue
        print('?', endpoint, 'HTTP', e.code, ':', body[:300])
    except Exception as e:
        print('ERR', endpoint, ':', e)

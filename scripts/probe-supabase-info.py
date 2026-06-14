"""Get the real Supabase URL and anon key for the project, then update Vercel env."""
import json
import os
import urllib.request
import urllib.error

TOKEN=os.env..._REF = os.environ.get('SUPABASE_PROJECT_REF', 'ktezkiifvstroujfjxqw')

# Try the api-keys endpoint
endpoints = [
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/api-keys',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/api-keys?reveal=true',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}/settings',
    f'https://api.supabase.com/v1/projects/{PROJECT_REF}',
    f'https://supabase.com/dashboard/api/projects/{PROJECT_REF}/settings/api',
    f'https://supabase.com/dashboard/api/projects/{PROJECT_REF}/api-keys',
    f'https://supabase.com/dashboard/api/projects/{PROJECT_REF}',
    f'https://supabase.com/dashboard/api/organizations/{PROJECT_REF}',
]

for endpoint in endpoints:
    req = urllib.request.Request(endpoint)
    req.add_header('Authorization', f'Bearer {TOKEN}')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read().decode()
            print(f'\nOK  {endpoint}\n    {data[:500]}')
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if '1010' in body or '404' in str(e.code):
            continue
        print(f'\n?  {endpoint} -> HTTP {e.code}: {body[:200]}')
    except Exception as e:
        pass

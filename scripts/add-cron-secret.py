"""Add CRON_SECRET to Vercel and verify build."""
import json
import urllib.request
import urllib.error

with open(r'C:\Users\ADNAN\AppData\Roaming\xdg.data\com.vercel.cli\auth.json') as f:
    vercel_token = json.load(f)['token']

project_id = 'prj_lnT3x57NYMiqxo4V2Iw3LXfhlOyk'

env = {
    'key': 'CRON_SECRET',
    'value': 'pawcare_cron_secret_2025',
    'type': 'plain',
    'target': ['production', 'preview', 'development'],
}

url = f'https://api.vercel.com/v10/projects/{project_id}/env'
data = json.dumps(env).encode()
req = urllib.request.Request(url, data=data, method='POST')
req.add_header('Authorization', f'Bearer {vercel_token}')
req.add_header('Content-Type', 'application/json')
try:
    with urllib.request.urlopen(req) as resp:
        print(f'  + {env["key"]} (HTTP {resp.status})')
except urllib.error.HTTPError as e:
    body = e.read().decode()
    if 'already exists' in body or 'ENV_ALREADY_EXISTS' in body:
        print(f'  = {env["key"]} (already exists)')
    else:
        print(f'  ! {env["key"]}: HTTP {e.code}: {body[:200]}')

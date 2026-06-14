"""Add the new-format publishable key to Vercel as well, for full compatibility."""
import json
import os
import urllib.request
import urllib.error

with open(r'C:\Users\ADNAN\AppData\Roaming\xdg.data\com.vercel.cli\auth.json') as f:
    vercel_token = json.load(f)['token']

project_id = 'prj_lnT3x57NYMiqxo4V2Iw3LXfhlOyk'

# Add the new-format keys as alternative env vars
new_envs = [
    {'key': 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'value': 'sb_publishable_8f8EOyugePnuapOXAz7OZA_-IH35QMq', 'type': 'plain', 'target': ['production', 'preview', 'development']},
    {'key': 'SUPABASE_SECRET_KEY', 'value': 'sb_secret_REDACTED', 'type': 'plain', 'target': ['production', 'preview', 'development']},
]

for env in new_envs:
    url = f'https://api.vercel.com/v10/projects/{project_id}/env'
    data = json.dumps(env).encode()
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Authorization', f'Bearer {vercel_token}')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as resp:
            print(f'  + {env["key"]}')
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if 'already exists' in body or 'ENV_ALREADY_EXISTS' in body:
            print(f'  = {env["key"]} (already exists)')
        else:
            print(f'  ! {env["key"]}: HTTP {e.code}: {body[:200]}')

print('\nDone.')

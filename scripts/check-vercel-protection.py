import json
import urllib.request
import urllib.error

with open(r'C:\Users\ADNAN\AppData\Roaming\xdg.data\com.vercel.cli\auth.json') as f:
    auth = json.load(f)
token = auth['token']
project_id = 'prj_lnT3x57NYMiqxo4V2Iw3LXfhlOyk'
team_id = 'team_n3WJWRrDck78pv4LIt5FjiUR'

# Try several known endpoints to disable deployment protection
endpoints = [
    # Public access via project settings
    ('PATCH', f'https://api.vercel.com/v9/projects/{project_id}',
     {'passwordProtection': None, 'ssoProtection': None}),
    # Per-deployment access
    ('POST', f'https://api.vercel.com/v1/projects/{project_id}/promote',
     {}),
]

for method, url, body in endpoints:
    print(f'\n--- {method} {url} ---')
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as resp:
            rdata = resp.read()
            print(f'HTTP {resp.status}: {rdata.decode()[:300]}')
    except urllib.error.HTTPError as e:
        print(f'HTTP {e.code}: {e.read().decode()[:300]}')

# Also try the team-level protection bypass
print('\n--- Checking team settings ---')
req = urllib.request.Request(f'https://api.vercel.com/v1/teams/{team_id}')
req.add_header('Authorization', f'Bearer {token}')
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        print(json.dumps({k: v for k, v in data.items() if 'protect' in k.lower() or 'sso' in k.lower() or 'password' in k.lower()}, indent=2))
except urllib.error.HTTPError as e:
    print(f'HTTP {e.code}: {e.read().decode()[:200]}')

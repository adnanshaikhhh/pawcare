import json
import subprocess
import urllib.request

with open(r'C:\Users\ADNAN\AppData\Roaming\xdg.data\com.vercel.cli\auth.json') as f:
    auth = json.load(f)
token = auth['token']

# PATCH project settings to clear the buildCommand override on Vercel's side
url = 'https://api.vercel.com/v9/projects/prj_lnT3x57NYMiqxo4V2Iw3LXfhlOyk'
body = json.dumps({
    'framework': 'nextjs',
    'buildCommand': None,
    'installCommand': None,
    'outputDirectory': None,
    'rootDirectory': None,
}).encode()

req = urllib.request.Request(url, data=body, method='PATCH')
req.add_header('Authorization', f'Bearer {token}')
req.add_header('Content-Type', 'application/json')

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        print('OK project updated:')
        print(json.dumps({
            'name': data.get('name'),
            'framework': data.get('framework'),
            'buildCommand': data.get('buildCommand'),
            'installCommand': data.get('installCommand'),
            'outputDirectory': data.get('outputDirectory'),
            'rootDirectory': data.get('rootDirectory'),
        }, indent=2))
except urllib.error.HTTPError as e:
    print(f'HTTP {e.code}: {e.read().decode()}')

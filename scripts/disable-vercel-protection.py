import json
import urllib.request

with open(r'C:\Users\ADNAN\AppData\Roaming\xdg.data\com.vercel.cli\auth.json') as f:
    auth = json.load(f)
token = auth['token']
project_id = 'prj_lnT3x57NYMiqxo4V2Iw3LXfhlOyk'

# Disable deployment protection on the latest deployment
url = f'https://api.vercel.com/v13/deployments'
req = urllib.request.Request(url)
req.add_header('Authorization', f'Bearer {token}')

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())
    deployments = [d for d in data.get('deployments', []) if d.get('projectId') == project_id]
    if not deployments:
        print('No deployments found for this project')
    else:
        latest = deployments[0]
        print(f'Latest deployment: {latest["url"]} (id={latest["id"]})')
        print(f'  Protection: {latest.get("protectionBypass", {})}')

# Now disable protection
for d in deployments[:3]:
    deployment_id = d['id']
    body = json.dumps({
        'deploymentId': deployment_id,
        'protectionBypass': {
            'password': None,
            'all': None,
            'sso': None,
        }
    }).encode()
    # Use the project's auth settings endpoint to disable for the project
    proj_url = f'https://api.vercel.com/v9/projects/{project_id}'
    proj_body = json.dumps({
        'ssoProtection': None,
        'passwordProtection': None,
        'trustedIps': [],
    }).encode()
    proj_req = urllib.request.Request(proj_url, data=proj_body, method='PATCH')
    proj_req.add_header('Authorization', f'Bearer {token}')
    proj_req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(proj_req) as r:
            print(f'Project auth settings updated')
    except urllib.error.HTTPError as e:
        print(f'Project auth update failed: HTTP {e.code}: {e.read().decode()[:200]}')
    break

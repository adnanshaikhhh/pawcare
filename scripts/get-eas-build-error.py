"""Get full build log via the EAS API."""
import os, json, urllib.request

# Read EAS credentials (use the same auth as the eas CLI)
eas_config_paths = [
    os.path.expanduser('~/.expo/state.json'),
    os.path.expanduser('~/.eas-cli/state.json'),
]
token = None
for p in eas_config_paths:
    if os.path.exists(p):
        try:
            with open(p) as f:
                d = json.load(f)
                token = d.get('auth', {}).get('accessToken') or d.get('accessToken') or d.get('token')
                if token:
                    break
        except Exception:
            pass

if not token:
    # Try the user's other location
    home = os.path.expanduser('~')
    for root, dirs, files in os.walk(os.path.join(home, 'AppData', 'Roaming', 'xdg.data', 'com.expo.tools')):
        for f in files:
            if f.endswith('.json'):
                try:
                    with open(os.path.join(root, f)) as fp:
                        d = json.load(fp)
                        token = d.get('accessToken') or d.get('access_token') or d.get('token')
                        if token:
                            break
                except Exception:
                    pass
        if token:
            break

if not token:
    # Last resort: try the eas-cli-nodejs config
    config = os.path.expanduser('~/AppData/Roaming/eas-cli-nodejs/Config/user-settings.json')
    if os.path.exists(config):
        try:
            with open(config) as f:
                d = json.load(f)
                token = d.get('auth', {}).get('accessToken') or d.get('token')
        except Exception:
            pass

if not token:
    print('No EAS token found')
    raise SystemExit(1)

print(f'Got EAS token (len={len(token)})')

BUILD_ID = '4af792db-2286-4fa5-83c6-e37793d082fc'
url = f'https://api.expo.dev/v2/builds/{BUILD_ID}'

req = urllib.request.Request(url)
req.add_header('Authorization', f'Bearer {token}')
req.add_header('Expo-Platform', 'eas-cli')
req.add_header('Expo-Api-Version', 'v2')
req.add_header('Accept', 'application/json')

with urllib.request.urlopen(req, timeout=30) as resp:
    data = json.loads(resp.read())
    print('Status:', data.get('status'))
    print('Errors:')
    err = data.get('error', {})
    if isinstance(err, dict):
        for k, v in err.items():
            print(f'  {k}: {str(v)[:300]}')
    else:
        print('  ', err)
    print('\nFull error object:')
    print(json.dumps(data.get('error'), indent=2)[:2000])

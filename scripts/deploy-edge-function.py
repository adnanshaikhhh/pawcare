"""Deploy Supabase Edge Function via the management API.
Token is loaded from a file via os.environ at script start.
"""
import os, sys, json, urllib.request, urllib.error, zipfile, io, base64

# Token is set via env from the bash wrapper script
tkn = os.environ.get('SBP', '')
ref = os.environ.get('SBREF', 'ktezkiifvstroujfjxqw')
if not tkn:
    print('Set SBP env var first')
    sys.exit(1)

# Read function source
func_dir = r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\supabase\functions\send-notifications'
with open(os.path.join(func_dir, 'index.ts'), encoding='utf-8') as f:
    index_ts = f.read()

config = {'imports': {}, 'deno_version': '2', 'entrypoint_path': 'index.ts'}

buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('index.ts', index_ts)
    zf.writestr('config.json', json.dumps(config, indent=2))
bundle = buf.getvalue()
print('Bundle:', len(bundle), 'bytes')

endpoints = [
    'https://api.supabase.com/v1/projects/' + ref + '/functions/send-notifications/deploy',
    'https://api.supabase.com/v2/projects/' + ref + '/functions/send-notifications/deploy',
    'https://api.supabase.com/platform/projects/' + ref + '/functions/send-notifications/deploy',
    'https://supabase.com/dashboard/api/projects/' + ref + '/functions/send-notifications/deploy',
    'https://api.supabase.com/v1/projects/' + ref + '/functions/deploy',
    'https://api.supabase.com/v1/projects/' + ref + '/edge-functions/send-notifications/deploy',
    'https://api.supabase.com/v1/projects/' + ref + '/functions?name=send-notifications',
]

for endpoint in endpoints:
    print('\n--- POST', endpoint)
    for body_fmt in [
        {'name': 'send-notifications', 'body': base64.b64encode(bundle).decode('ascii'), 'file': 'index.ts', 'metadata': {'entrypoint_path': 'index.ts'}},
        {'slug': 'send-notifications', 'body': base64.b64encode(bundle).decode('ascii'), 'entrypoint_path': 'index.ts'},
        {'name': 'send-notifications', 'bundle': base64.b64encode(bundle).decode('ascii'), 'entrypoint': 'index.ts'},
    ]:
        try:
            data = json.dumps(body_fmt).encode()
            req = urllib.request.Request(endpoint, data=data, method='POST')
            req.add_header('Authorization', 'Bearer ' + tkn)
            req.add_header('Content-Type', 'application/json')
            with urllib.request.urlopen(req, timeout=15) as resp:
                rd = resp.read().decode()
                print('  body=', list(body_fmt.keys()), '-> HTTP', resp.status, ':', rd[:200])
        except urllib.error.HTTPError as e:
            bt = e.read().decode()
            if e.code in (404, 405) or '1010' in bt or 'unsupported' in bt.lower() or 'waf' in bt.lower():
                print('  body=', list(body_fmt.keys()), '-> skip (', e.code, ')')
                break
            print('  body=', list(body_fmt.keys()), '-> HTTP', e.code, ':', bt[:150])
        except Exception as e:
            print('  body=', list(body_fmt.keys()), '-> error:', e)
            break

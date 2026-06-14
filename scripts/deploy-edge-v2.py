"""Try the Supabase Functions deploy API directly. The CLI uses a different
endpoint depending on the project type. Try multiple."""
import os, json, urllib.request, urllib.error, zipfile, io, base64

TFILE = r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\.supabase-token'
RFILE = 'ktezkiifvstroujfjxqw'
with open(TFILE) as f:
    tkn = f.read().strip()
ref = RFILE

func_dir = r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\supabase\functions\send-notifications'
with open(os.path.join(func_dir, 'index.ts'), encoding='utf-8') as f:
    index_ts = f.read()

# Build the bundle as the CLI does
buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('index.ts', index_ts)
    zf.writestr('config.json', json.dumps({
        'deno_version': '2',
        'entrypoint_path': 'index.ts',
    }))
bundle = buf.getvalue()
b64 = base64.b64encode(bundle).decode()

# Endpoints to try
endpoints = [
    ('https://api.supabase.com/v1/projects/' + ref + '/functions/send-notifications/deploy', {'name': 'send-notifications', 'body': b64, 'metadata': {'entrypoint_path': 'index.ts'}}),
    ('https://api.supabase.com/v1/projects/' + ref + '/functions/send-notifications/deploy', {'slug': 'send-notifications', 'body': b64, 'entrypoint_path': 'index.ts'}),
    ('https://api.supabase.com/v2/projects/' + ref + '/functions/send-notifications/deploy', {'name': 'send-notifications', 'body': b64, 'metadata': {'entrypoint_path': 'index.ts'}}),
    ('https://api.supabase.com/platform/projects/' + ref + '/functions/send-notifications/deploy', {'name': 'send-notifications', 'body': b64, 'metadata': {'entrypoint_path': 'index.ts'}}),
    ('https://api.supabase.com/platform/projects/' + ref + '/functions/deploy', {'name': 'send-notifications', 'body': b64, 'metadata': {'entrypoint_path': 'index.ts'}}),
    ('https://api.supabase.com/v1/projects/' + ref + '/functions/deploy?slug=send-notifications', {'name': 'send-notifications', 'body': b64, 'metadata': {'entrypoint_path': 'index.ts'}}),
    ('https://api.supabase.com/v1/projects/' + ref + '/functions?name=send-notifications', {'name': 'send-notifications', 'body': b64, 'metadata': {'entrypoint_path': 'index.ts'}}),
]

# Try with different content types
for endpoint, body in endpoints:
    print('\n--- POST', endpoint[-80:])
    for ct in ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data']:
        try:
            if ct == 'application/json':
                data = json.dumps(body).encode()
                req = urllib.request.Request(endpoint, data=data, method='POST')
            elif ct == 'application/x-www-form-urlencoded':
                from urllib.parse import urlencode
                data = urlencode(body).encode()
                req = urllib.request.Request(endpoint, data=data, method='POST')
            else:
                # multipart
                boundary = '----PawCareBoundary'
                data = (
                    ('--' + boundary + '\r\n').encode() +
                    ('Content-Disposition: form-data; name="metadata"\r\n\r\n').encode() +
                    json.dumps(body.get('metadata', {})).encode() + ('\r\n').encode() +
                    ('--' + boundary + '\r\n').encode() +
                    ('Content-Disposition: form-data; name="body"\r\n\r\n').encode() +
                    b64.encode() + ('\r\n').encode() +
                    ('--' + boundary + '--\r\n').encode()
                )
                req = urllib.request.Request(endpoint, data=data, method='POST')
            req.add_header('Authorization', 'Bearer ' + tkn)
            if ct != 'multipart/form-data':
                req.add_header('Content-Type', ct)
            else:
                req.add_header('Content-Type', 'multipart/form-data; boundary=' + boundary)
            with urllib.request.urlopen(req, timeout=20) as resp:
                rd = resp.read().decode()
                print('  CT=' + ct + ' HTTP ' + str(resp.status) + ' OK: ' + rd[:300])
        except urllib.error.HTTPError as e:
            bt = e.read().decode()
            if e.code in (404, 405) or '1010' in bt or 'unsupported' in bt.lower() or 'waf' in bt.lower():
                print('  CT=' + ct + ' skip (' + str(e.code) + ')')
                continue
            print('  CT=' + ct + ' HTTP ' + str(e.code) + ': ' + bt[:200])
        except Exception as e:
            print('  CT=' + ct + ' error: ' + str(e)[:100])

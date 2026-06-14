"""Deploy edge functions via direct Supabase Management API."""
import os, json, urllib.request, urllib.error, base64, zipfile, io, time

# Read tokens
TFILE = r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\.supabase-token'
with open(TFILE) as f:
    LEGACY = f.read().strip()
NEW_SVC = 'sb_secret_REDACTED'
NEW_ANON = 'sb_publishable_8f8EOyugePnuapOXAz7OZA_-IH35QMq'
REF = 'ktezkiifvstroujfjxqw'

# Read function source
func_dir = r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\supabase\functions\send-notifications'
with open(os.path.join(func_dir, 'index.ts'), encoding='utf-8') as f:
    send_ts = f.read()

func_dir2 = r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\supabase\functions\process-reminders'
with open(os.path.join(func_dir2, 'index.ts'), encoding='utf-8') as f:
    process_ts = f.read()

endpoints = [
    'https://api.supabase.com/v1/projects/' + REF + '/functions/send-notifications/deploy',
    'https://api.supabase.com/v2/projects/' + REF + '/functions/send-notifications/deploy',
    'https://api.supabase.com/platform/projects/' + REF + '/functions/send-notifications/deploy',
]

tokens = [('LEGACY', LEGACY), ('NEW_SVC', NEW_SVC), ('NEW_ANON', NEW_ANON)]

for token_name, tkn in tokens:
    print('\n===== Token:', token_name, '=====')
    for endpoint in endpoints:
        for body_fmt in [
            {'slug': 'send-notifications', 'name': 'send-notifications', 'body': send_ts, 'verify_jwt': False, 'entrypoint_path': 'index.ts'},
            {'name': 'send-notifications', 'body': send_ts, 'metadata': {'entrypoint_path': 'index.ts'}},
            {'name': 'send-notifications', 'body': send_ts, 'verify_jwt': False},
        ]:
            try:
                data = json.dumps(body_fmt).encode()
                req = urllib.request.Request(endpoint, data=data, method='POST')
                req.add_header('Authorization', 'Bearer ' + tkn)
                req.add_header('Content-Type', 'application/json')
                with urllib.request.urlopen(req, timeout=15) as resp:
                    rd = resp.read().decode()
                    print('  ', endpoint[-60:], '-> HTTP', resp.status, ':', rd[:200])
            except urllib.error.HTTPError as e:
                bt = e.read().decode()
                if '1010' in bt or e.code in (403, 404, 405):
                    print('  skip', endpoint[-50:], '->', e.code)
                    continue
                print('  ', endpoint[-60:], '-> HTTP', e.code, ':', bt[:200])
            except Exception as e:
                print('  err:', e)
                continue

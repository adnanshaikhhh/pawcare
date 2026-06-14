"""Check what the token actually decodes to."""
import base64
import json

TOKEN=*** = "sbp_TOKEN_REDACTED"
# Strip prefix
body = TOKEN.split("_", 1)[1] if "_" in TOKEN else TOKEN
# Try base64 decode
for pad in ['', '=', '==', '===']:
    try:
        decoded = base64.b64decode(body + pad)
        print(f'OK with {len(pad)} pads: {decoded[:200]}')
        # If it looks like JSON, parse
        try:
            j = json.loads(decoded)
            print('JSON:', j)
        except Exception:
            pass
    except Exception as e:
        print(f'fail with {len(pad)} pads: {str(e)[:80]}')

# Maybe the token is the legacy format
# Try interpreting as JWT (3 parts)
parts = TOKEN.split('.')
print(f'\nToken segments: {len(parts)}')
if len(parts) == 3:
    for i, p in enumerate(parts):
        try:
            d = base64.b64decode(p + '==')
            print(f'Part {i}: {d[:200]}')
        except Exception as e:
            print(f'Part {i} decode fail: {e}')

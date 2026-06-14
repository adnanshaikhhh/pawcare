"""Write .env.local from token files."""
import os, re

ENV_PATH = r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\apps\web\.env.local'
SRC_PATH = r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\.supabase-env'

with open(SRC_PATH, 'r') as f:
    content = f.read()

def gv(k, d=''):
    m = re.search(r'^' + re.escape(k) + r'=(.+)$', content, re.MULTILINE)
    return m.group(1).strip() if m else d

url = gv('SUPABASE_URL', 'https://ktezkiifvstroujfjxqw.supabase.co')
anon = gv('SUPABASE_ANON_KEY', '')
svc = gv('SUPABASE_SERVICE_KEY', '')

env_lines = [
    f'NEXT_PUBLIC_SUPABASE_URL={url}',
    f'NEXT_PUBLIC_SUPABASE_ANON_KEY={anon}',
    f'SUPABASE_SERVICE_ROLE_KEY={svc}',
    'NEXT_PUBLIC_APP_URL=https://pawcare-omega.vercel.app',
    'NEXT_PUBLIC_APP_NAME=PawCare',
    'CRON_SECRET=pawcar...'open(ENV_PATH, 'w') as f:
    f.write('\n'.join(env_lines) + '\n')

print(f'Wrote {ENV_PATH}')
print(f'Anon key: {len(anon)} chars')
print(f'Service key: {len(svc)} chars')

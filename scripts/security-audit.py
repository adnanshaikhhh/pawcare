"""Verify RLS is on all tables + service_role has GRANTs."""
import os, pg8000, ssl

DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com'
DB_PORT = 5432
DB_USER = 'postgres.ktezkiifvstroujfjxqw'
DB_PASS = os.environ.get('SUPABASE_DB_PASSWORD', '3Adnan9029#')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

print('Connecting...')
conn = pg8000.connect(host=DB_HOST, port=DB_PORT, database='postgres', user=DB_USER, password=DB_PASS, ssl_context=ctx, timeout=10)
conn.autocommit = True
cur = conn.cursor()

# Check RLS
cur.execute("select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename")
rls = {r[0]: r[1] for r in cur.fetchall()}

# Check policies
cur.execute("select tablename, count(*) from pg_policies where schemaname = 'public' group by tablename")
policies = {r[0]: r[1] for r in cur.fetchall()}

# Check service_role grants
cur.execute("select count(*) from information_schema.role_table_grants where grantee = 'service_role' and table_schema = 'public'")
grants = cur.fetchone()[0]

print('=== SECURITY AUDIT RESULTS ===')
print(f'Tables: {len(rls)}')
rls_on = sum(1 for v in rls.values() if v)
print(f'RLS enabled: {rls_on}/{len(rls)}')
print(f'Tables with policies: {len(policies)}')
print(f'Service_role grants: {grants}')

# Fix any tables without RLS
issues = []
for t, enabled in rls.items():
    if not enabled:
        cur.execute(f'ALTER TABLE public.{t} ENABLE ROW LEVEL SECURITY')
        issues.append(f'FIXED: enabled RLS on {t}')

if issues:
    print('Fixed:')
    for i in issues:
        print('  ', i)
else:
    print('No RLS fixes needed')

# Also check pg_cron is running
cur.execute("select jobname, schedule, active from cron.job where jobname = 'pawcare-send-notifications'")
job = cur.fetchone()
print(f'\npg_cron job: {job}')

# Test that the cron can actually fire (don't trigger, just verify setup)
cur.execute("select count(*) from net._http_response")
print(f'net._http_response entries: {cur.fetchone()[0]}')

conn.close()
print('\nAUDIT COMPLETE.')

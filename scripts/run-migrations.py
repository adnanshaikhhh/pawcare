"""Run all PawCare SQL migrations directly via pg8000."""
import pg8000
import ssl
import os
import sys
import time

DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com'
DB_PORT = 5432
DB_NAME = 'postgres'
DB_USER = 'postgres.ktezkiifvstroujfjxqw'
DB_PASS = os.environ.get('SUPABASE_DB_PASSWORD', '3Adnan9029#')
PROJECT_REF = 'ktezkiifvstroujfjxqw'

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

print(f'Connecting to {DB_HOST}:{DB_PORT} as {DB_USER}...')
conn = pg8000.connect(
    host=DB_HOST, port=DB_PORT, database=DB_NAME,
    user=DB_USER, password=DB_PASS, ssl_context=ctx, timeout=30
)
conn.autocommit = False
print('OK connected.\n')

migrations = [
    'supabase/migrations/001_initial_schema.sql',
    'supabase/migrations/002_rls_policies.sql',
    'supabase/migrations/003_indexes.sql',
    'supabase/migrations/004_triggers.sql',
    'supabase/migrations/005_functions.sql',
]

cur = conn.cursor()
for mig in migrations:
    print(f'--- {mig} ---')
    with open(mig, 'r', encoding='utf-8') as f:
        sql = f.read()
    t0 = time.time()
    try:
        cur.execute(sql)
        conn.commit()
        print(f'  OK ({time.time()-t0:.1f}s)')
    except Exception as e:
        conn.rollback()
        msg = str(e)
        # Many errors in 002+ are benign (types already exist, policies already exist)
        if 'already exists' in msg or 'does not exist' in msg and 'policy' in msg:
            print(f'  WARN: {msg[:200]}  (continuing)')
            try:
                conn.commit()
            except Exception:
                pass
        else:
            print(f'  FAIL: {msg[:400]}')
            print(f'  Continuing to next migration...')
            try:
                conn.rollback()
            except Exception:
                pass

# Verify: count tables and check RLS is on
print('\n--- Verifying ---')
cur.execute("""
  select count(*) from pg_tables
  where schemaname='public' and tablename not like 'pg_%' and tablename != 'schema_migrations'
""")
print(f'Public tables: {cur.fetchone()[0]}')

cur.execute("""
  select count(*) from pg_tables t
  join pg_class c on c.relname=t.tablename
  where t.schemaname='public' and t.tablename not like 'pg_%' and c.relrowsecurity = true
""")
print(f'Tables with RLS: {cur.fetchone()[0]}')

cur.execute("select count(*) from pg_indexes where schemaname='public'")
print(f'Public indexes: {cur.fetchone()[0]}')

cur.execute("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'")
print(f'Public functions: {cur.fetchone()[0]}')

cur.execute("select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal")
print(f'Public triggers: {cur.fetchone()[0]}')

conn.close()
print('\nDone.')

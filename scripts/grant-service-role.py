"""Grant service_role permissions to all public tables. RLS is enabled but
the service_role needs explicit table-level grants to bypass RLS.
"""
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

# Grant service_role full access to all public tables
tables = [
    'profiles', 'family_groups', 'family_members', 'pets', 'pet_photos',
    'vet_visits', 'medications', 'medication_logs', 'vaccinations',
    'deworming_records', 'heat_cycles', 'weight_logs', 'mood_logs',
    'symptom_checks', 'inventory_items', 'inventory_purchases',
    'reminders', 'vet_contacts',
]

print('Granting privileges to service_role...')
for t in tables:
    for perm in ['SELECT', 'INSERT', 'UPDATE', 'DELETE']:
        try:
            cur.execute(f'GRANT {perm} ON public.{t} TO service_role')
        except Exception as e:
            print(f'  ! GRANT {perm} ON {t}: {str(e)[:100]}')

# Also grant on all sequences (for serial PKs)
print('Granting sequence privileges...')
cur.execute("""
  select sequence_name from information_schema.sequences
  where sequence_schema = 'public'
""")
for r in cur.fetchall():
    seq = r[0]
    try:
        cur.execute(f'GRANT USAGE, SELECT ON SEQUENCE public.{seq} TO service_role')
    except Exception as e:
        pass

# Also grant on storage.objects (for file uploads)
print('Granting storage privileges...')
try:
    cur.execute('GRANT ALL ON storage.objects TO service_role')
    cur.execute('GRANT ALL ON storage.buckets TO service_role')
except Exception as e:
    print(f'  storage: {e}')

# Verify
cur.execute("""
  select table_name, privilege_type
  from information_schema.role_table_grants
  where grantee = 'service_role'
    and table_schema = 'public'
  order by table_name, privilege_type
""")
grants = cur.fetchall()
print(f'\n✓ {len(grants)} grants applied to service_role')
for g in grants[:20]:
    print(f'  {g[0]}: {g[1]}')
if len(grants) > 20:
    print(f'  ... and {len(grants) - 20} more')

conn.close()
print('\nDone.')

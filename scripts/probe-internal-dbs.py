"""Try to read the actual anon/service_role keys from the supabase_internal DBs
or the gotrue settings table.
"""
import pg8000
import ssl
import os

DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com'
DB_PORT = 5432
DB_USER = 'postgres.ktezkiifvstroujfjxqw'
DB_PASS = os.environ.get('SUPABASE_DB_PASSWORD', '3Adnan9029#')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Try connecting to all available DBs and listing tables
databases_to_try = ['postgres', 'auth', 'storage', 'realtime', 'supabase_admin']
for db in databases_to_try:
    try:
        conn = pg8000.connect(
            host=DB_HOST, port=DB_PORT, database=db,
            user=DB_USER, password=DB_PASS, ssl_context=ctx, timeout=10
        )
        cur = conn.cursor()
        # List schemas
        cur.execute("select schema_name from information_schema.schemata where schema_name not in ('pg_catalog','information_schema','pg_toast')")
        schemas = [r[0] for r in cur.fetchall()]
        print(f'DB {db}: {len(schemas)} schemas: {schemas[:15]}')

        # List tables
        cur.execute("select schemaname, tablename from pg_tables where schemaname not in ('pg_catalog','information_schema') order by 1,2")
        tables = cur.fetchall()
        print(f'  {len(tables)} tables. First 20:')
        for s, t in tables[:20]:
            print(f'    {s}.{t}')

        # In auth DB, look for jwt_secret or key tables
        if db == 'auth':
            try:
                cur.execute("select name, value from _internal_config limit 20")
                for r in cur.fetchall():
                    val = str(r[1])[:80]
                    print(f'    _internal_config: {r[0]} = {val}')
            except Exception:
                pass
        conn.close()
        print()
    except Exception as e:
        print(f'DB {db}: {str(e)[:80]}')

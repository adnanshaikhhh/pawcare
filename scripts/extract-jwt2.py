"""Get auth.instances content."""
import pg8000
import ssl
import os
import json

DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com'
DB_PORT = 5432
DB_USER = 'postgres.ktezkiifvstroujfjxqw'
DB_PASS = os.environ.get('SUPABASE_DB_PASSWORD', '3Adnan9029#')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

conn = pg8000.connect(
    host=DB_HOST, port=DB_PORT, database='postgres',
    user=DB_USER, password=DB_PASS, ssl_context=ctx, timeout=10
)
conn.autocommit = True
cur = conn.cursor()

# Get the GoTrue base config which contains the JWT secret
cur.execute("select count(*) from auth.instances")
print(f'auth.instances count: {cur.fetchone()[0]}')

cur.execute("select id, uuid, raw_base_config from auth.instances")
rows = cur.fetchall()
for row in rows:
    instance_id, uuid_val, raw_config = row
    print(f'\nid={instance_id}')
    print(f'uuid={uuid_val}')
    print(f'raw_base_config type: {type(raw_config).__name__}')
    if raw_config:
        # raw_base_config is a JSONB which pg8000 may return as str or dict
        if isinstance(raw_config, (bytes, bytearray)):
            raw_config = raw_config.decode('utf-8', errors='replace')
        if isinstance(raw_config, str):
            print(f'first 500 chars: {raw_config[:500]}')
        elif isinstance(raw_config, dict):
            print(f'keys: {list(raw_config.keys())}')
            for k in raw_config.keys():
                v = raw_config[k]
                v_str = str(v) if not isinstance(v, str) else v
                print(f'  {k} = {v_str[:120]}')

conn.close()

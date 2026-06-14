"""Extract JWT secret from auth.instances.raw_base_config."""
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

# Get the GoTrue base config which contains the JWT secret + project ref
cur.execute("select id, uuid, raw_base_config from auth.instances")
for row in cur.fetchall():
    instance_id, uuid, raw_config = row
    if raw_config:
        try:
            cfg = raw_config if isinstance(raw_config, dict) else json.loads(raw_config)
        except Exception:
            cfg = {}
        print(f'Instance: id={instance_id} uuid={uuid}')
        # Look for jwt_secret / secret / external_url
        for k, v in cfg.items():
            v_str = str(v)
            if 'jwt' in k.lower() or 'secret' in k.lower() or 'url' in k.lower() or 'key' in k.lower():
                print(f'  {k} = {v_str[:100]}')
        # Also check nested
        if 'jwt_secret' in cfg:
            print(f'  JWT SECRET: {cfg["jwt_secret"]}')

# Supabase's anon and service_role keys are derived from the JWT secret
# using HS256. The "anon" key is the JWT with role=anon, and "service_role"
# is the JWT with role=service_role. Both use the same secret.

# To compute them, we need the JWT secret. The format is:
#   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.{"sub":"...","role":"anon","exp":...}.signature
# where the signature is HMAC-SHA256(base64url(header) + "." + base64url(payload), secret)

# We need:
# 1. JWT secret
# 2. Project ref (already have: ktezkiifvstroujfjxqw)
# 3. Standard claim structure

conn.close()

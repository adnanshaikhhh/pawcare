#!/usr/bin/env python3
"""Helper to run SQL against the live Supabase project via Management API."""
import json
import os
import subprocess
import sys
import urllib.request


def main():
    if len(sys.argv) < 2:
        print("usage: run_sql.py <sql-file-or-statement>", file=sys.stderr)
        sys.exit(1)
    arg = sys.argv[1]
    if os.path.isfile(arg):
        with open(arg, "r", encoding="utf-8") as f:
            sql = f.read()
    else:
        sql = arg

    # Read access token
    token_path = os.path.join(os.path.dirname(__file__), "..", ".supabase-token")
    token_path = os.path.normpath(token_path)
    with open(token_path, "r", encoding="utf-8") as f:
        token = f.read().strip()
    if not token:
        print("No SUPABASE token found", file=sys.stderr)
        sys.exit(1)

    project_ref = os.environ.get("PROJECT_REF", "ktezkiifvstroujfjxqw")
    url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"

    body = json.dumps({"query": sql}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read().decode("utf-8", errors="replace")
            print(data)
    except urllib.error.HTTPError as e:
        data = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code}: {data}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()

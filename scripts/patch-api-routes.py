"""Update all API routes to pass their Request parameter to requireUser().
Handles both `request` and `req` parameter names."""
import re
import os
from pathlib import Path

API_DIR = Path(r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\apps\web\app\api')
routes = list(API_DIR.rglob('route.ts'))
print(f'Found {len(routes)} route files')

patched = 0
for route in routes:
    try:
        content = route.read_text(encoding='utf-8')
    except Exception:
        continue

    original = content

    # Find function headers and check if they use requireUser() without passing the request
    # Pattern 1: function with `(req: Request)` or `(request: Request)` and `requireUser()` without args
    # Match: `function GET(req: Request) { ... await requireUser();`
    # Replace: `function GET(req: Request) { const { user, response, supabase: userSupabase } = await requireUser(req);`

    # Use a function-level scanner. For each function declaration, find the
    # first `requireUser()` and ensure it has the request arg.

    # Simple regex: match `await requireUser()` (no arg) inside a function that has req/request
    # This is a heuristic; we patch any `await requireUser();` to `await requireUser(req);`
    # when the function has a `req: Request` or `request: Request` param

    # Find all function declarations and their bodies
    fn_pat = re.compile(
        r'(export async function (GET|POST|PUT|PATCH|DELETE)\(([a-zA-Z_][a-zA-Z0-9_]*):\s*Request\)\s*\{)',
        re.DOTALL
    )

    new_content = content
    for m in fn_pat.finditer(content):
        param_name = m.group(2)
        # Find the function body's requireUser() call
        # Look from this match position
        start = m.end()
        # Find next `}` at column 0 (rough)
        # Better: find next `export async function` or end of file
        rest = content[start:]
        # Find matching `}` - simple heuristic: find first `requireUser()`
        # within next 500 chars
        for offset in range(0, min(2000, len(rest))):
            chunk = rest[offset:offset+50]
            if 'await requireUser()' in chunk:
                # Replace
                old = 'await requireUser()'
                new = f'await requireUser({param_name})'
                # Find absolute position
                abs_pos = start + offset + chunk.index(old)
                new_content = new_content[:abs_pos] + new + new_content[abs_pos+len(old):]
                break

    # Also handle the case where the function uses { user, response, supabase: userSupabase }
    # OR just { response }. Either way, we need `userSupabase` to be in scope.
    # After requireUser is called, the local const should be updated.
    # But for simplicity, just use `const supabase = req.headers.get('authorization') ? createSupabaseUserClient(token) : createSupabaseServerClient()`
    # approach is complex. For now, just make requireUser accept the request.

    if new_content != original:
        route.write_text(new_content, encoding='utf-8')
        patched += 1
        print(f'  ✓ {route.relative_to(API_DIR.parent.parent)}')
    else:
        pass

print(f'\nPatched: {patched} of {len(routes)}')

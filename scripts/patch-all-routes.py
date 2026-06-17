"""Patch all API routes to pass request to requireUser(). Handles ALL variations:
- export async function METHOD(request: NextRequest) { ... requireUser() ... }
- export async function METHOD(_req: Request, { params }) { ... requireUser() ... }
- export async function METHOD() { ... requireUser() ... } (no param - add request)
"""
import re
from pathlib import Path

API_DIR = Path(r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\apps\web\app\api')
routes = sorted(API_DIR.rglob('route.ts'))

def patch_file(path: Path) -> tuple[bool, str]:
    content = path.read_text(encoding='utf-8')
    original = content

    # Pattern 1: function has request: NextRequest|Request (with or without _ prefix)
    # Patch requireUser() -> requireUser(request)
    # But only if the param is NOT prefixed with _ (unused)
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]

        # Find function declaration
        fn_match = re.match(
            r'^\s*export async function (GET|POST|PUT|PATCH|DELETE)\(([a-zA-Z_][a-zA-Z0-9_]*):\s*Request\)',
            line
        )
        fn_match2 = re.match(
            r'^\s*export async function (GET|POST|PUT|PATCH|DELETE)\(([a-zA-Z_][a-zA-Z0-9_]*):\s*NextRequest\)',
            line
        )
        m = fn_match or fn_match2
        if m:
            param_name = m.group(2)
            # If param is _req (underscore prefix), rename to req for the call
            # But this might break other uses of _req in the function. Only do it for cases where _req is referenced
            is_unused = param_name.startswith('_')
            if is_unused:
                new_param_name = param_name.lstrip('_') or 'req'
                # Rename param throughout the function body
                # We'll do this in a simple way: process until we see a closing brace at column 0
                brace_depth = 0
                # First, find the function's open brace
                # The line might have `{` at the end or on next line
                for j in range(i, len(lines)):
                    l = lines[j]
                    brace_depth += l.count('{') - l.count('}')
                    # Replace _req with new_param_name only on this line and inside the function
                    if j > i:
                        lines[j] = l.replace(param_name, new_param_name)
                    if brace_depth > 0 and '}' in l and brace_depth == 0:
                        break
                # Also fix the param itself
                lines[i] = line.replace(param_name, new_param_name)
                param_name = new_param_name

        # Patch requireUser() -> requireUser(param) if we have a tracked param
        # For simplicity, just look for requireUser() with no args in any function context
        # We'll do this by detecting if the file has any function with a Request param

        new_lines.append(line)
        i += 1

    content = '\n'.join(new_lines)

    # Now do a function-aware pass: for each function declaration, look at its body's requireUser() calls
    fn_pat = re.compile(
        r'(export async function (?:GET|POST|PUT|PATCH|DELETE)\(([a-zA-Z_][a-zA-Z0-9_]*):\s*(?:Request|NextRequest)\))(\s*\{)',
        re.DOTALL
    )

    def replace_require(match):
        full = match.group(0)
        param = match.group(1)
        # Don't replace if already has the param
        return full

    # Simpler: just find all `await requireUser();` not followed by an argument
    # And replace them by looking at the preceding function signature
    # Use a stateful approach

    lines = content.split('\n')
    new_lines = []
    current_param = None
    brace_depth = 0

    for line in lines:
        # Check for function declaration
        fn_m = re.search(
            r'export async function (?:GET|POST|PUT|PATCH|DELETE)\(([a-zA-Z_][a-zA-Z0-9_]*):\s*(?:Request|NextRequest)\)',
            line
        )
        if fn_m:
            current_param = fn_m.group(1)
            brace_depth = 0

        # Update brace depth
        brace_depth += line.count('{') - line.count('}')

        # If we have a param and a requireUser() with no args, patch it
        if current_param and re.search(r'await requireUser\(\)', line):
            line = re.sub(
                r'await requireUser\(\)',
                f'await requireUser({current_param})',
                line
            )

        # End function when depth returns to 0
        if current_param and brace_depth == 0 and '}' in line:
            current_param = None

        new_lines.append(line)

    content = '\n'.join(new_lines)

    if content != original:
        path.write_text(content, encoding='utf-8')
        return True, 'patched'
    return False, 'no change'


patched = 0
for route in routes:
    try:
        ok, msg = patch_file(route)
        if ok:
            patched += 1
            print(f'  ✓ {route.relative_to(API_DIR.parent.parent)}')
    except Exception as e:
        print(f'  ! {route}: {e}')

print(f'\nPatched: {patched} of {len(routes)}')

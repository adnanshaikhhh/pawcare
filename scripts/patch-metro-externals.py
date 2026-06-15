"""Patch the Metro externals.js to skip the node:sea shim that crashes on Node 24.
This is a focused fix that makes `npx expo start` work on Node 20+."""
import re
import os
from pathlib import Path

TARGET = Path(r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\node_modules\@expo\cli\build\src\start\server\metro\externals.js')

if not TARGET.exists():
    print('File not found:', TARGET)
    raise SystemExit(1)

content = TARGET.read_text(encoding='utf-8')

# The bundled JS has a for-loop that iterates over node builtins
# and tries to mkdir each one. The 'node:sea' path crashes on Windows
# because ':' is not a valid filename char. Wrap the mkdir with try/catch.

# Find the specific mkdir call and wrap it
# Pattern: mkdirs the dir then writes index.js
# Simpler: just wrap the whole iteration body

# Look for: await fsExtra.mkdir(path.join(nodeModulesPath, name)
# or similar patterns in the bundled JS

# Try multiple known patterns
patterns_to_patch = [
    # Pattern 1: Specific call to 'node:sea'
    (r"await fsExtra\.mkdir\(path\.join\(nodeModulesPath, ['\"]node:sea['\"]\), \{ recursive: true \}\)",
     "try { await fsExtra.mkdir(path.join(nodeModulesPath, 'node:sea'), { recursive: true }); } catch (e) { /* Windows + Node 20+ invalid path */ }"),
    # Pattern 2: in a for-of loop, wrap the body
    (r"(for \(const name of nodeBuiltinsToStub\) \{[\s\S]*?)(await fsExtra\.mkdir\(path\.join\(nodeModulesPath, name\), \{ recursive: true \}\);)",
     r"\1try { \2 } catch (e) { /* Windows + Node 20+ invalid path */ }"),
]

patched = False
for pat, repl in patterns_to_patch:
    new_content = re.sub(pat, repl, content, count=1)
    if new_content != content:
        content = new_content
        patched = True
        print(f'Patched with pattern: {pat[:60]}...')
        break

if not patched:
    # Brute force: find the specific "node:sea" string and replace
    if "'node:sea'" in content or '"node:sea"' in content:
        # Just replace the string with a safer name
        content = content.replace("'node:sea'", "'node-sea-stub'")
        content = content.replace('"node:sea"', '"node-sea-stub"')
        patched = True
        print("Brute force patched: replaced 'node:sea' with 'node-sea-stub'")

if patched:
    TARGET.write_text(content, encoding='utf-8')
    print('Saved patched file')
else:
    print('No patch applied — file structure unknown')
    print('First 2000 chars of file:')
    print(content[:2000])

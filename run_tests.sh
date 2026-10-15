#!/bin/sh
# Run all Node tests. Usage: cd bh-source && sh run_tests.sh   (needs node >= 18, python3)
set -e
cd "$(dirname "$0")"
T=$(mktemp -d)
python3 build_base.py >/dev/null 2>&1 || true   # rebuilds base_v2.js (paths inside assume /home/claude/bh-build; see CONTEXT.md)
echo "== lens tables =="; node tests/lens_test.js | tail -3
echo "== flight / camera =="; python3 mk_node.py base_v2.js tests/flight2_body.js "$T/f.js" && node "$T/f.js" | tail -3
echo "== combat (swept collision, intercept, damage, bot sim) =="
python3 - "$T" << 'PY'
import sys
t = sys.argv[1]
base = open('base_v2.js', encoding='utf-8').read(); base = base[:base.find('window.addEventListener("DOMContentLoaded"')]
mods = ''.join(open(f, encoding='utf-8').read() + '\n' for f in ['lens_tables.js', 'mod_world.js', 'mod_combat.js'])
body = open('tests/combat_body.js', encoding='utf-8').read()
open(t + '/c.js', 'w', encoding='utf-8').write('global.window={addEventListener:()=>{}};global.TRACE=false;\n' + base + '\n' + mods + '\n' + body)
PY
node "$T/c.js" | tail -6 || true

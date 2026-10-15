import re, sys, os, shutil
base = open('base_v2.js', encoding='utf-8').read().split('\n')

def find_block(lines, start_regex):
    for i, l in enumerate(lines):
        if re.match(start_regex, l): s = i; break
    else: raise SystemExit('missing ' + start_regex)
    j = s
    while j > 0 and lines[j-1].startswith('//'): j -= 1
    for k in range(s, len(lines)):
        if lines[k] == '})();': e = k; break
    return j, e

def rd(name): return open(name, encoding='utf-8').read().rstrip('\n').split('\n')

lines = base
# 1. cut header: keep from 'const Game = {};'
gi = next(i for i, l in enumerate(lines) if l.startswith('const Game = {};'))
header = rd('header.txt') if os.path.exists('header.txt') else ['/* Black Hole Combat */']
shim = rd('babylon_shim.js') if os.path.exists('babylon_shim.js') else []
lines = header + [''] + shim + [''] + lines[gi:]

# 2. replace Boot block + the trailing DOMContentLoaded block
bj, be = find_block(lines, r'^Game\.Boot = ')
boot_new = rd('boot_final.js') if os.path.exists('boot_final.js') else rd('mod_boot1.js')
tail = rd('tail.js') if os.path.exists('tail.js') else []
lines = lines[:bj] + boot_new + [''] + tail

# 3. insert new modules before the RNG banner
rj, re_ = find_block(lines, r'^Game\.Rng = ')
extra = []
mod_list = ['lens_tables.js', 'mod_world.js']
if os.path.exists('extra_modules.txt'):
    mod_list += [n for n in open('extra_modules.txt').read().split() if os.path.exists(n)]
for name in mod_list:
    extra += rd(name) + ['']
lines = lines[:rj] + extra + lines[rj:]
script = '\n'.join(lines)

html = open('template.html', encoding='utf-8').read().replace('/*__SCRIPT__*/', script)
os.makedirs('site', exist_ok=True)
open('site/index.html', 'w', encoding='utf-8').write(html)
if os.path.exists('babylon_shim.js'):
    shutil.copy('babylon_shim.js', 'site/babylon.js')
print('assembled', len(script.split('\n')), 'script lines ->', 'site/index.html')

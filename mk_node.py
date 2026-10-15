import sys
# usage: mk_node.py <script.js> <test_body.js> <out.js>  -- strips the DOMContentLoaded boot block, prepends a window stub
src = open(sys.argv[1], encoding='utf-8').read()
i = src.find('window.addEventListener("DOMContentLoaded"')
if i >= 0: src = src[:i]
body = open(sys.argv[2], encoding='utf-8').read()
# drop a leading window stub in the body if present
open(sys.argv[3], 'w', encoding='utf-8').write('global.window = { addEventListener: () => {} };\n' + src + '\n' + body)

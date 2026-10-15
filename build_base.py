import re
src = open('base_script.js', encoding='utf-8').read()
qfb = open('qfb_snippet.js', encoding='utf-8').read()
old = '  return { qIdentity, qFromAxisAngle, qMultiply, qNormalize, qConjugate, qRotateVector, qSlerp, qLengthSq };'
assert old in src
src = src.replace(old, qfb)
lines = src.split('\n')
def block_range(regex):
    start = next(i for i,l in enumerate(lines) if re.match(regex,l))
    j = start
    while j > 0 and lines[j-1].startswith('//'): j -= 1
    for k in range(start, len(lines)):
        if lines[k] == '})();': return j,k
fj, fe = block_range(r'^Game\.FlightController = ')
cj, ce = block_range(r'^Game\.ChaseCamera = ')
flight2 = open('mod_flight2.js', encoding='utf-8').read().rstrip('\n').split('\n')
chase2 = open('mod_chase2.js', encoding='utf-8').read().rstrip('\n').split('\n')
lines = lines[:cj] + chase2 + lines[ce+1:]
lines = lines[:fj] + flight2 + lines[fe+1:]
open('base_v2.js','w',encoding='utf-8').write('\n'.join(lines))
print('base_v2 rebuilt')

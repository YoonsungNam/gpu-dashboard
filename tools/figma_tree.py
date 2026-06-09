#!/usr/bin/env python3
"""Dump a Figma frame's ELEMENT TREE (per-node layout/color/text), not just
aggregate tokens. This is the precise per-component ground truth we need to
rebuild screens faithfully.

Usage: FIGMA_TOKEN=... python3 figma_tree.py <FILE_KEY> <NODE_ID> [maxdepth] [out.txt]
"""
import json, os, sys, urllib.request, urllib.parse

def fetch(url, tok):
    return json.load(urllib.request.urlopen(
        urllib.request.Request(url, headers={"X-Figma-Token": tok}), timeout=180))

def hx(c, o=None):
    a = c.get('a', 1) * (o if o is not None else 1)
    h = f"#{round(c['r']*255):02X}{round(c['g']*255):02X}{round(c['b']*255):02X}"
    return h + (f"@{a:.2f}" if a < 0.999 else "")

def fills_str(n):
    out = []
    for f in (n.get('fills') or []):
        if not f.get('visible', True): continue
        if f.get('type') == 'SOLID' and 'color' in f:
            out.append(hx(f['color'], f.get('opacity')))
        elif str(f.get('type','')).startswith('GRADIENT'):
            out.append('grad(' + ','.join(hx(s['color']) for s in f.get('gradientStops', [])) + ')')
    return ','.join(out)

def size(n):
    bb = n.get('absoluteBoundingBox') or {}
    if 'width' in bb: return f"{round(bb['width'])}x{round(bb['height'])}"
    return ''

def line(n, depth):
    t = n.get('type', '')
    nm = (n.get('name') or '')[:30]
    parts = [f"{'  '*depth}{t} '{nm}' [{n.get('id')}]"]
    s = size(n)
    if s: parts.append(s)
    al = n.get('layoutMode')
    if al: parts.append(f"AL:{al[:1]} gap{n.get('itemSpacing','?')} pad{n.get('paddingTop','?')}/{n.get('paddingRight','?')}")
    fl = fills_str(n)
    if fl: parts.append(f"fill={fl}")
    if n.get('cornerRadius'): parts.append(f"r{n['cornerRadius']}")
    if t == 'TEXT':
        st = n.get('style', {})
        ch = (n.get('characters') or '').strip().replace('\n', ' ')[:34]
        parts.append(f"[{st.get('fontWeight','?')}/{round(st.get('fontSize',0))}px {hx(((n.get('fills') or [{}])[0]).get('color',{})) if n.get('fills') else ''}] \"{ch}\"")
    return '  '.join(parts)

COLLAPSE = 4  # show first N of identical-type siblings, then summarize

def walk(n, depth, maxd, buf):
    buf.append(line(n, depth))
    if depth >= maxd: return
    kids = n.get('children') or []
    # collapse only runs of IDENTICAL (type, name) siblings (e.g. repeated
    # table rows) — keep distinct sections visible.
    def sig(k): return (k.get('type'), k.get('name'))
    i = 0
    while i < len(kids):
        j = i
        while j < len(kids) and sig(kids[j]) == sig(kids[i]): j += 1
        run = kids[i:j]
        if len(run) > COLLAPSE:
            for k in run[:2]: walk(k, depth+1, maxd, buf)
            buf.append(f"{'  '*(depth+1)}… +{len(run)-2} more '{run[0].get('name')}' {run[0].get('type')}")
        else:
            for k in run: walk(k, depth+1, maxd, buf)
        i = j

def main():
    tok = os.environ['FIGMA_TOKEN']; key = sys.argv[1]; nid = sys.argv[2]
    maxd = int(sys.argv[3]) if len(sys.argv) > 3 else 6
    out = sys.argv[4] if len(sys.argv) > 4 else None
    q = urllib.parse.urlencode({'ids': nid, 'depth': maxd})
    data = fetch(f"https://api.figma.com/v1/files/{key}/nodes?{q}", tok)
    buf = []
    for k, p in data.get('nodes', {}).items():
        walk(p['document'], 0, maxd, buf)
    txt = '\n'.join(buf)
    if out:
        open(out, 'w').write(txt)
        print(f"wrote {out} ({len(buf)} lines)")
    print('\n'.join(buf[:int(sys.argv[5])] if len(sys.argv) > 5 else buf))

if __name__ == '__main__':
    main()

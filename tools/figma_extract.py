#!/usr/bin/env python3
"""Extract design tokens (colors, typography, spacing, radii, effects) from Figma frames.

Usage:
  FIGMA_TOKEN=figd_... python3 figma_extract.py <FILE_KEY> <NODE_ID>[,<NODE_ID>...] [out.json]

Reads token from env (never hard-coded). Fetches full node subtrees via the Figma
REST API and aggregates the real, exact design values so we can build tokens.ts
without eyeballing PNGs.
"""
import json
import os
import sys
import urllib.request
from collections import Counter, defaultdict


def fetch(url, token):
    req = urllib.request.Request(url, headers={"X-Figma-Token": token})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def hex_of(color, opacity=None):
    r = round(color.get("r", 0) * 255)
    g = round(color.get("g", 0) * 255)
    b = round(color.get("b", 0) * 255)
    a = color.get("a", 1)
    if opacity is not None:
        a = a * opacity
    h = f"#{r:02X}{g:02X}{b:02X}"
    if a < 0.999:
        return f"{h}@{a:.2f}"
    return h


def walk(node, agg):
    t = node.get("type")
    # fills
    for f in node.get("fills", []) or []:
        if not f.get("visible", True):
            continue
        if f.get("type") == "SOLID" and "color" in f:
            key = hex_of(f["color"], f.get("opacity"))
            bucket = "text_fill" if t == "TEXT" else "fill"
            agg[bucket][key] += 1
        elif f.get("type", "").startswith("GRADIENT"):
            stops = [hex_of(s["color"]) for s in f.get("gradientStops", [])]
            agg["gradient"]["->".join(stops)] += 1
    # strokes
    for s in node.get("strokes", []) or []:
        if s.get("type") == "SOLID" and "color" in s:
            agg["stroke"][hex_of(s["color"], s.get("opacity"))] += 1
    # text styles
    if t == "TEXT":
        st = node.get("style", {})
        sig = (
            st.get("fontFamily"),
            st.get("fontWeight"),
            round(st.get("fontSize", 0), 1),
            round(st.get("lineHeightPx", 0), 1),
            round(st.get("letterSpacing", 0), 2),
        )
        agg["text"][sig] += 1
        chars = (node.get("characters") or "").strip().replace("\n", " ")
        if chars:
            agg["samples"].setdefault(sig, [])
            if len(agg["samples"][sig]) < 6:
                agg["samples"][sig].append(chars[:40])
    # corner radius
    if "cornerRadius" in node and isinstance(node["cornerRadius"], (int, float)):
        agg["radius"][round(node["cornerRadius"], 1)] += 1
    if "rectangleCornerRadii" in node:
        agg["radius"][tuple(round(x, 1) for x in node["rectangleCornerRadii"])] += 1
    # effects (shadows)
    for e in node.get("effects", []) or []:
        if not e.get("visible", True):
            continue
        if "SHADOW" in e.get("type", ""):
            c = e.get("color", {})
            off = e.get("offset", {})
            sig = f"{e['type']} x{round(off.get('x',0))} y{round(off.get('y',0))} blur{round(e.get('radius',0))} spread{round(e.get('spread',0))} {hex_of(c)}"
            agg["shadow"][sig] += 1
    # auto-layout spacing / padding
    if node.get("layoutMode") in ("HORIZONTAL", "VERTICAL"):
        if "itemSpacing" in node:
            agg["spacing"][round(node["itemSpacing"], 1)] += 1
        for p in ("paddingLeft", "paddingRight", "paddingTop", "paddingBottom"):
            if p in node:
                agg["spacing"][round(node[p], 1)] += 1
    for child in node.get("children", []) or []:
        walk(child, agg)


def main():
    token = os.environ.get("FIGMA_TOKEN")
    if not token:
        sys.exit("FIGMA_TOKEN env var required")
    key = sys.argv[1]
    ids = sys.argv[2]
    out = sys.argv[3] if len(sys.argv) > 3 else "figma-extract.json"

    agg = {
        "fill": Counter(), "text_fill": Counter(), "stroke": Counter(),
        "gradient": Counter(), "text": Counter(), "radius": Counter(),
        "shadow": Counter(), "spacing": Counter(), "samples": {},
    }
    url = f"https://api.figma.com/v1/files/{key}/nodes?ids={ids}"
    data = fetch(url, token)
    for nid, payload in data.get("nodes", {}).items():
        doc = payload.get("document")
        if doc:
            walk(doc, agg)

    def top(counter, n=40):
        return counter.most_common(n)

    print("\n===== COLORS (fills / backgrounds) =====")
    for k, v in top(agg["fill"]):
        print(f"  {v:5d}  {k}")
    print("\n===== TEXT COLORS =====")
    for k, v in top(agg["text_fill"]):
        print(f"  {v:5d}  {k}")
    print("\n===== STROKES =====")
    for k, v in top(agg["stroke"]):
        print(f"  {v:5d}  {k}")
    print("\n===== GRADIENTS =====")
    for k, v in top(agg["gradient"], 15):
        print(f"  {v:5d}  {k}")
    print("\n===== TYPOGRAPHY (family, weight, size, lineHeight, letterSpacing) =====")
    for sig, v in top(agg["text"]):
        fam, wt, sz, lh, ls = sig
        samp = " | ".join(agg["samples"].get(sig, [])[:3])
        print(f"  {v:5d}  {fam} w{wt} {sz}px / lh{lh} / ls{ls}   e.g. {samp}")
    print("\n===== CORNER RADII =====")
    for k, v in top(agg["radius"], 20):
        print(f"  {v:5d}  {k}")
    print("\n===== SHADOWS =====")
    for k, v in top(agg["shadow"], 20):
        print(f"  {v:5d}  {k}")
    print("\n===== SPACING (auto-layout gaps & padding) =====")
    for k, v in sorted(agg["spacing"].items()):
        print(f"  {v:5d}  {k}px")

    serial = {k: (dict(v) if isinstance(v, Counter) else v) for k, v in agg.items()}
    serial["text"] = {" / ".join(map(str, sig)): n for sig, n in agg["text"].items()}
    serial["samples"] = {" / ".join(map(str, sig)): s for sig, s in agg["samples"].items()}
    serial["radius"] = {str(k): n for k, n in agg["radius"].items()}
    with open(out, "w") as f:
        json.dump(serial, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {out}")


if __name__ == "__main__":
    main()

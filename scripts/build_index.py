#!/usr/bin/env python3
# scripts/build_index.py
# Erstellt globalen EPG-Index aus allen Länder-Indizes

import os
import json
import subprocess

epg_base = "public/epg"

global_index = {
    "countries": [],
    "generated": subprocess.run(
        ["date", "-Iseconds"], capture_output=True, text=True
    ).stdout.strip(),
}

if not os.path.exists(epg_base):
    print("⚠️ public/epg nicht gefunden")
    exit(0)

for cc in sorted(os.listdir(epg_base)):
    idx_path = os.path.join(epg_base, cc, "index.json")
    if not os.path.exists(idx_path):
        continue
    with open(idx_path, encoding="utf-8") as f:
        data = json.load(f)
    global_index["countries"].append({
        "code": cc,
        "channels": len(data.get("channels", [])),
        "generated": data.get("generated", ""),
    })

with open(f"{epg_base}/index.json", "w", encoding="utf-8") as f:
    json.dump(global_index, f, ensure_ascii=False, indent=2)

print(f"✅ Globaler Index: {len(global_index['countries'])} Länder")

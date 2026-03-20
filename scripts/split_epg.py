#!/usr/bin/env python3
# scripts/split_epg.py
# Teilt große EPG XML.gz Dateien pro Sender auf

import os
import gzip
import re
import json
import subprocess
from xml.etree import ElementTree as ET

cc = os.environ.get("CC", "de")
base = f"output/epg/{cc}"

if not os.path.exists(base):
    print(f"⚠️ Verzeichnis {base} nicht gefunden")
    exit(0)

all_channels = {}
all_programs = {}

for fname in os.listdir(base):
    if not fname.endswith(".xml.gz"):
        continue
    fpath = os.path.join(base, fname)
    try:
        with gzip.open(fpath, "rb") as f:
            tree = ET.parse(f)
        root = tree.getroot()

        for ch in root.findall("channel"):
            cid = ch.get("id", "")
            if cid:
                all_channels[cid] = ET.tostring(ch, encoding="unicode")

        for prog in root.findall("programme"):
            cid = prog.get("channel", "")
            if cid:
                all_programs.setdefault(cid, []).append(
                    ET.tostring(prog, encoding="unicode")
                )

    except Exception as e:
        print(f"❌ Fehler in {fname}: {e}")

generated = subprocess.run(
    ["date", "-Iseconds"], capture_output=True, text=True
).stdout.strip()

index = {"country": cc, "generated": generated, "channels": []}

channels_dir = f"{base}/channels"
os.makedirs(channels_dir, exist_ok=True)

for cid, ch_xml in all_channels.items():
    progs = all_programs.get(cid, [])
    if not progs:
        continue

    safe_id = re.sub(r"[^a-zA-Z0-9._-]", "_", cid)
    xml_content = (
        '<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n'
        + ch_xml + "\n"
        + "\n".join(progs)
        + "\n</tv>"
    )

    out_path = f"{channels_dir}/{safe_id}.xml.gz"
    with gzip.open(out_path, "wt", encoding="utf-8", compresslevel=9) as f:
        f.write(xml_content)

    index["channels"].append({
        "id": cid,
        "file": f"channels/{safe_id}.xml.gz",
        "programs": len(progs),
        "size": os.path.getsize(out_path),
    })

with open(f"{base}/index.json", "w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False)

print(f"✅ {cc}: {len(index['channels'])} Sender gespeichert")

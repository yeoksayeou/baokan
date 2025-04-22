#!/usr/bin/env python3
import re
import json
from pathlib import Path

# Match directories that contain a 4-digit year, possibly followed by other characters
YEAR_DIR_RE = re.compile(r'^(\d{4})(.*)$')
# Match files named YYYY.MM.DD.html
DATE_HTML_RE = re.compile(r'^(\d{4})\.(\d{2})\.(\d{2})\.html$')

OUTPUT_FILE = 'shenbao-index.js'

def build_js_index(output_file=OUTPUT_FILE):
    base = Path('.')
    archive = {}

    # Scan each year directory
    for year_dir in sorted(base.iterdir()):
        if not year_dir.is_dir():
            continue
            
        # Check if directory name contains a year
        year_match = YEAR_DIR_RE.match(year_dir.name)
        if not year_match:
            continue
            
        # Use the full directory name as the year key
        year_key = year_dir.name
        
        for p in year_dir.iterdir():
            if not p.is_file():
                continue
            m = DATE_HTML_RE.match(p.name)
            if not m:
                continue
            _, month, day = m.groups()
            
            # Store each variant (like 1939SH) as its own separate entry
            archive.setdefault(year_key, {}).setdefault(month, []).append({
                'day': day,
                'path': f"{year_key}/{p.name}"
            })

    # Build sorted archive: each year variant is treated as a separate year
    sorted_archive = {
        year: {
            month: archive[year][month]
            for month in sorted(archive[year].keys())
        }
        for year in sorted(archive.keys())
    }

    # Emit JS object
    with open(output_file, 'w', encoding='utf-8') as out:
        out.write('window.ARCHIVE_INDEX = ')
        json.dump(sorted_archive, out, indent=2)
        out.write(';\n')

    print(f"Generated {output_file} with {len(sorted_archive)} years.")

if __name__ == '__main__':
    build_js_index()
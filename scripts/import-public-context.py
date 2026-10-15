"""Build the bundled Belfast context from official downloaded snapshots.
Usage: python scripts/import-public-context.py ../public-data
Requires openpyxl. No runtime requests or API credentials are needed by the app.
"""
import csv
import hashlib
import io
import json
from pathlib import Path
import sys
import zipfile
import openpyxl

source = Path(sys.argv[1])
root = Path(__file__).resolve().parents[1]
book = openpyxl.load_workbook(source / 'stops.xlsx', read_only=True, data_only=True)
rows = list(book.active.values)
stops = []
for code, name, locality, lat, lon, *_ in rows[1:]:
    if isinstance(lat, (int, float)) and isinstance(lon, (int, float)) and 54.585 <= lat <= 54.61 and -5.955 <= lon <= -5.9:
        stops.append({'id': str(code), 'name': name, 'lat': lat, 'lng': lon})
stops.sort(key=lambda s: s['id'])
archive = zipfile.ZipFile(source / 'routes.zip')
name = next(n for n in archive.namelist() if n.endswith('PtLinks_mtt.ptl.MIF'))
attributes = list(csv.reader(io.StringIO(archive.read(name[:-3] + 'MID').decode('cp1252'))))
lines = [line.strip() for line in archive.read(name).decode('cp1252').splitlines() if line.strip()]
index = next(i for i, line in enumerate(lines) if line.upper() == 'DATA') + 1
geometries = []
while index < len(lines):
    parts = lines[index].split()
    index += 1
    if parts[0].upper() == 'PLINE':
        assert len(parts) == 2, 'Unexpected multipart geometry; review importer'
        count = int(parts[1])
        points = [[round(float(p[1]), 6), round(float(p[0]), 6)] for p in (line.split() for line in lines[index:index + count])]
        geometries.append(points)
        index += count
    elif parts[0].upper() == 'LINE':
        geometries.append([[float(parts[2]), float(parts[1])], [float(parts[4]), float(parts[3])]])
    elif parts[0].upper() == 'NONE':
        geometries.append([])
    else:
        assert parts[0].upper() in ('PEN', 'SMOOTH'), f'Unexpected geometry {parts[0]}'
assert len(geometries) == len(attributes)
routes = []
for code, label, color in [('220G1', 'Glider G1', '#d946ef'), ('220G2', 'Glider G2', '#06b6d4'), ('1510A', 'Metro 10A', '#f59e0b')]:
    segments = []
    seen = set()
    for row, points in zip(attributes, geometries):
        key = json.dumps(points)
        if row[12].strip() == code and len(points) > 1 and key not in seen:
            seen.add(key)
            segments.append(points)
    assert segments, f'Missing {code}'
    routes.append({'id': code, 'name': label, 'color': color, 'segments': segments})
data = {'stops': stops, 'routes': routes, 'metadata': {
    'licence': 'Open Government Licence v3.0', 'attribution': 'Contains Translink data licensed under the Open Government Licence v3.0.',
    'stopCatalogueDate': '2026-10-02', 'stopExportFilename': 'bus-stop-export-20260923.xlsx',
    'routeSnapshotDate': '2025-09-23', 'importedDate': '2026-10-15', 'totalStopRecords': len(rows) - 1,
    'selection': 'Stop records within 54.585–54.610 latitude, −5.955–−5.900 longitude. Includes real and virtual records; not a complete Belfast network. Selected route links retain published geometry and may include variants.',
    'stopsUrl': 'https://www.data.gov.uk/dataset/495c6964-e8d2-4bf1-9942-8d950b3a0ceb/translink-bus-stop-list',
    'routesUrl': 'https://www.data.gov.uk/dataset/6f40b323-1933-40db-97f2-835382029a1f/translink-metro-bus-routes',
    'sha256': {file: hashlib.sha256((source / file).read_bytes()).hexdigest() for file in ['stops.xlsx', 'routes.zip']}}}
output = root / 'src/data/publicContext.json'
output.write_text(json.dumps(data, separators=(',', ':'), ensure_ascii=False), encoding='utf-8')
print(f'Wrote {len(stops)} stop records and {sum(len(r["segments"]) for r in routes)} route segments to {output}')

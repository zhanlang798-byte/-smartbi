"""Read-only XML check. Print whitelisted model/field metadata, never connections."""
from pathlib import Path
from hashlib import sha256
import json
import argparse
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('xml', nargs='?', type=Path, default=HERE / 'backups/migrate_CPI_PRE_REPAIR_20260904.xml')
parser.add_argument('--write', action='store_true', help='Write the whitelisted local verification report')
args = parser.parse_args()
XML = args.xml
root = ET.parse(XML).getroot()
models = [n for n in root.findall('AUGMENTED_DATASET')
          if (n.get('id') or n.findtext('id')) == '6b5dff57a4093ba3db07d2903905fe40']
assert len(models) == 1
model = models[0]
views = json.loads(model.findtext('define'))['views']
view = next(v for v in views if v.get('alias') == 'V50_country_monthly_risk')
fields = [dict(f.attrib) for f in model.find('fields')]
cpi = next(f for f in view['fields'] if f['name'] == 'cpi_index')
published = [f for f in fields if f.get('viewId') == view['id']
             and f.get('referenceFieldId') == cpi['id']]
report = {
    'file': XML.name, 'bytes': XML.stat().st_size,
    'sha256': sha256(XML.read_bytes()).hexdigest(),
    'modelId': model.get('id') or model.findtext('id'),
    'modelLastModified': model.get('lastModified') or model.findtext('lastModified'),
    'viewCount': len(views),
    'sourceView': {k: view.get(k) for k in ('id', 'name', 'alias', 'type')},
    'sourceFields': [{k: f.get(k) for k in ('id', 'name', 'valueType')} for f in view['fields']],
    'publishedCpiFields': [{k: f.get(k) for k in ('id', 'name', 'valueType', 'expression', 'referenceFieldId', 'viewId')} for f in published],
    'xmlElementTypes': sorted(set(n.tag for n in root)),
    'restoreTest': 'NOT_PERFORMED',
}
assert len(report['sourceFields']) == 18
print(json.dumps(report, ensure_ascii=False, indent=2))
if args.write:
    (HERE / 'BACKUP_VERIFICATION.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

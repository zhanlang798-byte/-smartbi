"""Read-only dependency audit of controlled XML, with whitelisted output only."""
from pathlib import Path
from hashlib import sha256
import json
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
A_ROOT = HERE.parents[2]
MODEL_ID = '6b5dff57a4093ba3db07d2903905fe40'
SOURCE_FIELD = 'Field-input-input-null-v50_country_monthly_risk-cpi_index'
MODEL_FIELD = f'AUGMENTED_DATASET_FIELD.{MODEL_ID}.{SOURCE_FIELD}'
BASE = HERE.parent / 'A03_CPI_REPAIR_PREFLIGHT_20260904/backups/migrate_CPI_AFTER_TRIAL_20260904.xml'

def walk(value, path='$'):
    if isinstance(value, dict):
        for k, v in value.items():
            yield from walk(v, path + '.' + k)
    elif isinstance(value, list):
        for i, v in enumerate(value):
            yield from walk(v, f'{path}[{i}]')
    elif isinstance(value, str):
        yield path, value

def refs(value):
    return [{'path': p, 'reference': v} for p, v in walk(value) if SOURCE_FIELD in v]

root = ET.parse(BASE).getroot()
model = next(n for n in root.findall('AUGMENTED_DATASET') if n.get('id') == MODEL_ID)
define = json.loads(model.findtext('define'))
view = next(v for v in define['views'] if v['alias'] == 'V50_country_monthly_risk')
field = next(n for n in model.find('fields') if n.get('id') == MODEL_FIELD)
model_references = []
for section in model:
    if section.tag in ('define', 'fields'):
        continue
    for item in section:
        hits = {k: v for k, v in item.attrib.items() if SOURCE_FIELD in v}
        if hits or SOURCE_FIELD in (item.text or ''):
            model_references.append({'section': section.tag, 'id': item.get('id'),
                                     'name': item.get('name'), 'references': hits})

pages = []
for filename in ('A07_PAGES_DB01_DB02_DB04_WITH_MODEL_20260831.xml',
                 'A07_PAGES_DB03_DB05_DB06_WITH_MODEL_20260831.xml'):
    path = A_ROOT / '04_XML恢复' / filename
    page_root = ET.parse(path).getroot()
    for page in page_root.findall('SMARTBIX_PAGE'):
        data = json.loads(page.findtext('define'))
        portlets = []
        for portlet in data.get('portlets', []):
            hits = refs(portlet)
            if hits:
                portlets.append({'id': portlet['id'], 'type': portlet.get('type'),
                                 'title': portlet.get('extended', {}).get('title'), 'references': hits})
        pages.append({'pageId': page.get('id'), 'name': page.get('name'),
                      'lastModified': page.get('lastModified'),
                      'sourceFile': filename, 'sourceSha256': sha256(path.read_bytes()).hexdigest(),
                      'portlets': portlets, 'allReferencePaths': refs(data)})

report = {
    'scope': 'Current 2026-09-04 model export and historical controlled six-page export; not a complete live tenant reference scan',
    'modelId': MODEL_ID, 'modelLastModified': model.get('lastModified'),
    'sourceViewId': view['id'], 'sourceViewType': view['type'],
    'sourceFieldId': SOURCE_FIELD, 'modelFieldId': MODEL_FIELD,
    'publishedField': {k: field.get(k) for k in ('id', 'name', 'alias', 'valueType', 'referenceFieldId', 'viewId')},
    'sourceFieldCount': len(view['fields']),
    'sourceFieldIds': [{'id': f['id'], 'name': f['name']} for f in view['fields']],
    'relationsInvolvingSource': [r for r in define['relationGraph']['relations'] if view['id'] in json.dumps(r)],
    'modelReferences': model_references,
    'pages': pages,
    'preservationRequirements': ['Source view ID', 'All 18 field reference IDs', 'Relationship edges',
                               'Existing private measures and filters', 'NULLs and row grain'],
    'applied': False,
}
(HERE / 'REFERENCE_AUDIT.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
print(json.dumps({'modelView': view['id'], 'modelReferences': len(model_references),
                  'pages': [{'name': p['name'], 'affectedPortlets': len(p['portlets'])} for p in pages]}, ensure_ascii=False, indent=2))

"""Verify controlled trial boundaries from local XML and captured UI metadata."""
from pathlib import Path
from hashlib import sha256
import json
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
MODEL_ID = '6b5dff57a4093ba3db07d2903905fe40'
paths = [HERE / 'backups' / n for n in (
    'migrate_CPI_PRE_REPAIR_20260904.xml', 'migrate_CPI_AFTER_TRIAL_20260904.xml')]
models = []
for p in paths:
    matches = [n for n in ET.parse(p).getroot().findall('AUGMENTED_DATASET')
               if (n.get('id') or n.findtext('id')) == MODEL_ID]
    assert len(matches) == 1
    models.append(matches[0])

before, after = models
different_tags = [tag for tag in sorted({n.tag for m in models for n in m})
                  if [ET.tostring(n, encoding='unicode') for n in before.findall(tag)]
                  != [ET.tostring(n, encoding='unicode') for n in after.findall(tag)]]
assert not different_tags, different_tags
assert before.attrib == after.attrib
assert ET.tostring(before, encoding='unicode') == ET.tostring(after, encoding='unicode')
original = json.loads((HERE / '01_SOURCE_FIELD_METADATA.json').read_text(encoding='utf-8'))['fields']
trial = json.loads((HERE / '06_CATALOG_AFTER_REOPEN.json').read_text(encoding='utf-8'))
restored = json.loads((HERE / '08_CATALOG_ROLLBACK_REOPEN.json').read_text(encoding='utf-8'))
expected = [[f[k] for k in ('id', 'name', 'alias', 'type', 'format')] for f in original]
assert len(expected) == len(trial) == len(restored) == 18
assert restored == expected, 'Catalog rollback differs from original metadata'
changes = [(a[1], a[3:], b[3:]) for a, b in zip(expected, trial) if a != b]
assert len(changes) == 1 and changes[0][0] == 'cpi_index', changes
assert trial[3][3] == 'BIGDECIMAL' and restored[3][3] == 'STRING'
max_dom = (HERE / '07_NATIVE_MAX_AFTER_CATALOG_TRIAL.txt').read_text(encoding='utf-8')
assert '"993.56"' in max_dom and '最大值' in max_dom
fresh_model_dom = (HERE / '09_FRESH_MODEL_REOPEN.txt').read_text(encoding='utf-8')
assert 'cpi_index cpi_index 长浮点型 <浮点型-默认值>' in fresh_model_dom
report = {
    'modelId': MODEL_ID,
    'formalModelSubtreeUnchanged': True,
    'differentModelTags': different_tags,
    'modelLastModified': after.get('lastModified') or after.findtext('lastModified'),
    'sourceCatalogFieldCount': len(restored),
    'trialChanges': changes,
    'sourceCatalogRollbackMatchesOriginal': True,
    'freshModelSessionCpiType': '长浮点型',
    'nativeMaxAfterCatalogTrial': '993.56',
    'expectedNumericMaxDisplay': '47954.24',
    'acceptance': 'FAIL_MAX_PENDING_REPAIR',
    'restoreTest': 'NOT_PERFORMED',
    'exports': [{'file': p.name, 'bytes': p.stat().st_size,
                 'sha256': sha256(p.read_bytes()).hexdigest()} for p in paths],
}
(HERE / 'TRIAL_VERIFICATION.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))

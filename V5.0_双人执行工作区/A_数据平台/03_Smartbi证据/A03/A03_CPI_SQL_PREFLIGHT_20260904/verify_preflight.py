"""Verify captured UI evidence, not a live database or deployment test."""
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import json
import re
import sys

HERE = Path(__file__).resolve().parent


def read(name):
    return (HERE / name).read_text(encoding='utf-8')


def normalized(sql):
    return re.sub(r'\s+', ' ', sql).strip().rstrip(';')


def captured_row(filename, expected, headers):
    text = read(filename)
    # Exact native data row, not a parent row containing column headings.
    rows = re.findall(r'^\s*- row "([^"]+)":\s*$', text, flags=re.M)
    assert expected in rows, (filename, 'native row not found')
    assert ' '.join(headers) in rows, (filename, 'header row not found')
    return dict(zip(headers, expected.split()))


def verify():
    refs = json.loads(read('REFERENCE_AUDIT.json'))
    live = json.loads(read('LIVE_IMPACT_SUMMARY.json'))
    source_fields = [x['name'] for x in refs['sourceFieldIds']]
    assert len(source_fields) == len(set(source_fields)) == 18
    cast = "CAST(NULLIF(TRIM(cpi_index), '') AS DECIMAL(30,12)) AS cpi_index"
    expected_select = ('SELECT ' + ', '.join(cast if x == 'cpi_index' else x for x in source_fields)
                       + ' FROM input.v50_country_monthly_risk')
    assert normalized(read('04_FULL_18_COLUMN_EXECUTED.sql')) == normalized(expected_select)
    for query, copied in [('CPI_FULL_QUERY_CHECK.sql', '02_EXECUTED_SQL.txt'),
                          ('CPI_KEY_NULL_CHECK.sql', '06_KEY_NULL_EXECUTED.sql')]:
        assert normalized(read(query)) == normalized(read(copied)), (query, 'copy mismatch')
        assert not re.search(r'\b(UPDATE|DELETE|INSERT|ALTER|DROP|CREATE|TRUNCATE)\b', read(query), re.I)

    metrics = captured_row('01_SQL_FULL_QUERY_RESULT.txt',
        '7,680 7,616 64 2,862,057.90 375.80 47,954.24',
        ['total_rows', 'non_null_rows', 'null_rows', 'numeric_sum', 'numeric_avg', 'numeric_max'])
    keys = captured_row('05_KEY_NULL_RESULT.txt',
        '7,680 40 2010-01-31 2025-12-31 0 64 0 64 0 0',
        ['total_rows', 'country_count', 'first_month', 'last_month', 'null_key_rows',
         'raw_null_rows', 'blank_string_rows', 'cast_null_rows', 'duplicate_key_groups', 'extra_duplicate_rows'])
    preview = read('03_FULL_18_COLUMN_PREVIEW.txt')
    assert '共 7680 行' in preview
    assert all(f'generic: {name}' in preview for name in source_fields)
    baseline_path = HERE.parent / 'A03_TYPE_PERSISTENCE_20260904/CPI_SOURCE_BASELINE.json'
    baseline = json.loads(baseline_path.read_text(encoding='utf-8'))
    for key, source_key in [('numeric_sum', 'sum'), ('numeric_avg', 'average'), ('numeric_max', 'max')]:
        rounded = format(Decimal(baseline[source_key]).quantize(Decimal('.01'), rounding=ROUND_HALF_UP), ',.2f')
        assert metrics[key] == rounded
    for key, source_key in [('total_rows', 'rows'), ('non_null_rows', 'nonNull'), ('null_rows', 'null')]:
        assert int(metrics[key].replace(',', '')) == baseline[source_key]
    assert keys['raw_null_rows'] == keys['cast_null_rows'] == metrics['null_rows']
    assert all(keys[key] == '0' for key in ['blank_string_rows', 'null_key_rows', 'duplicate_key_groups', 'extra_duplicate_rows'])

    assert len(refs['relationsInvolvingSource']) == 2
    assert all(x['cardinalityType'] == 'ONE2MANY' and x['filterDirection'] == 'SINGLE'
               for x in refs['relationsInvolvingSource'])
    assert {p['pageId'] for p in refs['pages']} == {p['id'] for p in live['pages']}
    direct = [p for p in refs['pages'] if p['portlets']]
    assert len(direct) == 1 and direct[0]['name'].startswith('DB02_')
    assert len(direct[0]['portlets']) == 1
    assert direct[0]['portlets'][0]['id'] == '50069196dac827c6732e076784c7fd80'
    assert not refs['applied'] and not live['modified']
    native = json.loads(read('07_NATIVE_EDIT_ENTRY.json'))
    assert any('disabled' in x['class'].split() for x in native['editItem'])
    discarded = json.loads(read('08_QUERY_DISCARD.json'))
    assert discarded['action'] == '点击“不保存”'
    assert not discarded['sqlTabPresent'] and not discarded['formalModelSaveClicked']

    # Confirm protected local workbook bytes still match the established baselines.
    a_root = HERE.parents[2]
    source_file = a_root / '01_输入只读镜像/D0-D12_数据交付_V4.2/data/smartbi/country_monthly_risk.xlsx'
    type_book = HERE.parent / 'SMARTBI_TYPE_AUDIT_V50.xlsx'
    expected_type_hash = '5cd12fe8d507258156f422d74011b467829b94a8e15aad435f346191f8d9eaed'
    source_hash = hashlib.sha256(source_file.read_bytes()).hexdigest()
    type_hash = hashlib.sha256(type_book.read_bytes()).hexdigest()
    assert source_hash == baseline['sourceSha256']
    assert type_hash == expected_type_hash
    evidence_names = ['01_SQL_FULL_QUERY_RESULT.txt', '02_EXECUTED_SQL.txt',
                      '03_FULL_18_COLUMN_PREVIEW.txt', '04_FULL_18_COLUMN_EXECUTED.sql',
                      '05_KEY_NULL_RESULT.txt', '06_KEY_NULL_EXECUTED.sql',
                      '07_NATIVE_EDIT_ENTRY.json', '08_QUERY_DISCARD.json',
                      'REFERENCE_AUDIT.json', 'LIVE_IMPACT_SUMMARY.json']
    return {
        'date': '2026-09-04',
        'verificationScope': 'Offline assertions over captured live SQL UI results and controlled XML references; does not run SQL or validate deployment.',
        'sqlPreflight': 'PASS', 'formalRepairStatus': 'FAIL_MAX_PENDING_REPAIR',
        'nativeAggregateObservedThisTurn': False,
        'metrics': metrics, 'grainAndNullCheck': keys,
        'sourceColumnCount': 18, 'sourceRelations': 2,
        'resourceDependentPagesLive': 6,
        'historicalDirectCpiPortlet': direct[0]['portlets'][0]['id'],
        'referenceAuditCaveat': refs['scope'],
        'comparisonPrecision': 'SQL UI aggregation compared with prior independent source baseline at 2 decimal places; no full-precision equality claim.',
        'sourceWorkbookSha256': source_hash, 'typeWorkbookSha256': type_hash,
        'queryDiscardedWithoutSaving': True, 'formalModelPublished': False,
        'bSigned': False,
        'evidenceSha256': {n: hashlib.sha256((HERE / n).read_bytes()).hexdigest() for n in evidence_names},
        'nextBlocker': 'No verified reference-preserving replacement entry. Native BASIC_TABLE Edit menu is disabled; this is not proof of an account-permission cause.'
    }


if __name__ == '__main__':
    report = verify()
    output = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    print(output)
    if '--write' in sys.argv:
        (HERE / 'PREFLIGHT_VERIFICATION.json').write_text(output, encoding='utf-8', newline='\n')

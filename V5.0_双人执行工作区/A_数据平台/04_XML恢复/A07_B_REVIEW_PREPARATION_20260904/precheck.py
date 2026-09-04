"""Read-only handoff precheck. This is A-assisted evidence review, not B signoff.

Requires controlled local XML originals. Existing reports, workbooks, platform
objects and signatures are never rewritten. Only this folder receives a report.
"""
import contextlib
import hashlib
import importlib.util
import io
import json
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
WORK = HERE.parents[2]
REPO = WORK.parent
A03 = WORK / 'A_数据平台/03_Smartbi证据/A03'
RESTORE = HERE.parent
manifest = {}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def record(path):
    path = path.resolve()
    manifest[path.relative_to(WORK).as_posix()] = digest(path)
    return path


def read_json(path):
    return json.loads(record(path).read_text(encoding='utf-8-sig'))


def main():
    original_audit = read_json(RESTORE / 'A07_CURRENT_EXPORT_20260904/EXPORT_AUDIT.json')
    audit_script = record(RESTORE / 'A07_CURRENT_EXPORT_20260904/audit_export.py')
    spec = importlib.util.spec_from_file_location('native_package_audit', audit_script)
    audit = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(audit)
    for path in [audit.PACKAGE, audit.BASELINE, *[RESTORE / n for n in audit.OLD]]:
        record(path)
    # Replay the reviewed package audit into an isolated temporary directory.
    # Suppress full metadata output; publish only bounded results below.
    with tempfile.TemporaryDirectory(prefix='smartbi-review-') as folder:
        audit.HERE = Path(folder)
        with contextlib.redirect_stdout(io.StringIO()):
            audit.main()
        replay = json.loads((audit.HERE / 'EXPORT_AUDIT.json').read_text(encoding='utf-8'))
    assert replay == original_audit, 'Package audit no longer agrees with recorded evidence'
    assert subprocess.run(['git', 'check-ignore', '-q', '--', str(audit.PACKAGE)], cwd=REPO).returncode == 0

    pk = A03 / 'A03_PK_AUDIT_20260904'
    packet = read_json(pk / 'A03_PK_PLATFORM_RESULTS_20260904.json')
    targets = read_json(pk / 'A03_PK_TARGETS_20260904.json')
    sql = record(pk / 'A03_PK_ALL_TABLES_20260904.sql')
    dom = record(pk / 'A03_PK_PLATFORM_DOM_20260904.txt').read_text(encoding='utf-8')
    assert digest(sql) == packet['sqlSha256']
    assert len(packet['rows']) == packet['platformReportedTotal'] == len(targets) == 21
    assert len({r[1] for r in packet['rows']}) == 21 and 'generic: 共 21 行' in dom
    formal_rows, auxiliary_rows = 0, []
    for target in targets:
        row = next(r for r in packet['rows'] if r[1] == target['object'])
        assert len(row) == 8 and '- row "' + ' '.join(row) + '"' in dom
        assert int(row[0]) == target['order']
        nums = [int(v.replace(',', '')) for v in row[2:]]
        assert nums[:2] == [target['expectedRows']] * 2 and nums[2:] == [0] * 4
        if target['order'] <= 18:
            formal_rows += nums[0]
        else:
            auxiliary_rows.append(nums[0])
    assert formal_rows == 313593 and auxiliary_rows == [40, 20, 660]

    # Bind current files to change records without interpreting or editing Excel.
    recon_log = read_json(pk / 'A03_RECON_CHANGELOG_20260904.json')
    assert len(recon_log['changes']) == 21 and recon_log['sqlSha256'] == digest(sql)
    recon = record(A03 / 'SMARTBI_IMPORT_RECONCILIATION_V50.xlsx')
    assert digest(recon) == 'd5e0f30ef0b22385f37f0c4bc24a5d3a794f3d3a679b6e643f706f4146133d36'
    waiver = read_json(A03 / 'A03_RECHECK_20260904/A03_TYPE_WAIVER_CHANGELOG_20260904.json')
    notes = read_json(A03 / 'A03_TYPE_PERSISTENCE_20260904/TYPE_NOTES_CHANGELOG.json')
    last_note = read_json(A03 / 'A03_CPI_RUNTIME_RECHECK_20260904/LEDGER_CHANGELOG.json')
    assert len(waiver['audit']) == 4 and len(notes['changes']) == 59
    assert notes['outputSha256'] == last_note['inputSha256']
    assert last_note['cell'] == 'F88'
    assert next(c['after'] for c in notes['changes'] if c['cell'] == 'F88') == last_note['before']
    types = record(A03 / 'SMARTBI_TYPE_AUDIT_V50.xlsx')
    assert digest(types) == last_note['outputSha256']
    assert waiver['counts'] == notes['counts'] == {'PASS': 383, 'FAIL': 59}

    risk = read_json(A03 / 'A03_RISK_DISPOSITION_20260904/RISK_EVIDENCE.json')
    for entry in list(risk['sourceWorkbooks'].values()) + list(risk['documentSources'].values()):
        assert digest(record(WORK / entry['path'])) == entry['sha256']
    record(WORK / '00_共享/每日协调/A_RISK_DISPOSITION_20260904.md')
    record(WORK / '00_共享/每日协调/A_CPI_REPAIR_STOPPED_BY_USER_20260904.md')

    perf_dir = WORK / 'A_数据平台/03_Smartbi证据/性能'
    perf_manifest = record(perf_dir / 'A07_PERFORMANCE_SHA256_20260831.txt').read_text(encoding='utf-8')
    perf_entries = re.findall(r'^([0-9A-Fa-f]{64})\s+(.+)$', perf_manifest, re.M)
    assert len(perf_entries) == 4
    perf_hash_checks = []
    for expected, rel in perf_entries:
        path = record(perf_dir / rel.strip())
        raw = path.read_bytes()
        git_path = path.relative_to(REPO).as_posix()
        blob = subprocess.check_output(['git', 'show', 'HEAD:' + git_path], cwd=REPO)
        hash_bytes = lambda value: hashlib.sha256(value).hexdigest()
        normalized = raw.replace(b'\r\n', b'\n')
        # A separate text-only equivalence check, NEVER a raw XML/Excel hash waiver.
        assert hash_bytes(blob) == expected.lower()
        assert normalized == blob and hash_bytes(normalized) == expected.lower()
        perf_hash_checks.append({'path':path.relative_to(WORK).as_posix(),
            'historicalExpectedSha256':expected.lower(), 'currentRawSha256':hash_bytes(raw),
            'gitBlobSha256':hash_bytes(blob), 'lfNormalizedSha256':hash_bytes(normalized),
            'rawByteHashMatches':hash_bytes(raw)==expected.lower(),
            'onlyCrLfToLfDifference':True, 'fileRewritten':False})
    perf_text = (perf_dir / 'A07_PERFORMANCE_STATUS_V50.txt').read_text(encoding='utf-8')
    timing_lines = re.findall(r'^(冷态|热态|冷缓存|热缓存)：([0-9./]+)秒。$', perf_text, re.M)
    assert len(timing_lines) == 8
    timings = [[float(v) for v in line.split('/')] for _, line in timing_lines]
    assert all(len(line) == 3 for line in timings)
    samples = [v for line in timings for v in line]
    assert len(samples) == 24 and all(0 < v <= 10 for v in samples)

    for rel, expected in manifest.items():
        assert digest(WORK / rel) == expected, f'Input mutated: {rel}'
    output = {
        'checkedAt': datetime.now(timezone(timedelta(hours=8))).isoformat(timespec='seconds'),
        'reviewBasisCommit': subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip(),
        'status': 'A_TECHNICAL_PRECHECK_COMPLETE_TEXT_EOL_DISCLOSED_B_REVIEW_PENDING',
        'package': {'sha256': replay['package']['sha256'], 'bytes': replay['package']['bytes'],
                    'pageCount': 6, 'modelCount': 1, 'viewCount': 22, 'fieldCount': 460, 'relationCount': 19,
                    'matchesPreviousAuditExactly': True, 'rawXmlGitIgnored': True,
                    'securityClassification': replay['security']['classification']},
        'pkCapturedEvidence': {'capturedAt': packet['capturedAt'], 'tables': 21,
                    'formalRows': formal_rows, 'auxiliaryRows': auxiliary_rows,
                    'sqlHashMatches': True, 'allRowsCorroboratedByCapturedDom': True,
                    'exceptionCountsAllZero': True, 'newLiveQuery': False},
        'ledgerFileBinding': {'reconciliationSha256': digest(recon), 'typeAuditSha256': digest(types),
                    'reconciliationChangeRows':21, 'booleanExceptionRows':4,
                    'typeNoteChanges':59, 'lastNoteCell':'F88', 'recordedStatusCounts':notes['counts'],
                    'hashAndChangeRecordChainOnly':True, 'workbookCellsReaudited':False},
        'performanceCapturedEvidence': {'lockedFiles':4, 'recordedSamples':24,
                    'recordedMaximumSeconds':max(samples), 'thresholdSeconds':10,
                    'allRecordedSamplesWithinThreshold':True, 'newPerformanceTest':False,
                    'hashChecks':perf_hash_checks},
        'riskSourceHashesStillMatch':True, 'allInputsUnchanged':True,
        'boundaries': {'bIndependentReviewExecuted':False,'bSigned':False,'finalRiskAccepted':False,
                    'platformModified':False,'cpiRepairedOrRetested':False,'skippedAiRetested':False,
                    'independentRestoreExecuted':False,'finalFreezeCreated':False},
        'inputSha256': manifest,
    }
    (HERE / 'TECHNICAL_PRECHECK.json').write_text(json.dumps(output, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({k:v for k,v in output.items() if k!='inputSha256'},ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()

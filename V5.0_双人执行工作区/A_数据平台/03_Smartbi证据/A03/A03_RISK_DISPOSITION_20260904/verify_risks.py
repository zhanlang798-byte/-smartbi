"""Recompute three bounded governance risks; never write source workbooks/XML.

Run inspect_risks.mjs first. The extracted rows are local intermediates, while
this script publishes only hashes, mappings and bounded aggregate evidence.
No live query, CPI test, policy assessment or final acceptance is performed.
"""
import ast
import hashlib
import json
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORK = HERE.parents[3]
SHARED = WORK / "00_共享"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def counted(values):
    return dict(sorted(Counter(str(v) for v in values).items()))


def evaluate():
    extracted = json.loads((HERE / 'outputs/READ_ONLY_INPUTS.json').read_text(encoding='utf-8'))
    inputs = extracted['inputs']
    for item in inputs.values():
        assert sha(WORK / item['path']) == item['sha256'], 'Source changed after extraction'
    lock = inputs['lock']
    assert lock['sha256'] == '79f0f5a2bce965f15f09fb6559407d48ebb7141e2454a2151011d218ac9bb205'
    assert len(lock['rows']) == 21
    assert all(r[3] == '无法追溯（截图仅证当前对象存在）' for r in lock['rows'])
    identity_path = HERE.parent / 'A03_RESOURCE_RECONCILIATION_20260904/RESOURCE_AND_PACKAGE_RECONCILIATION.json'
    identities = json.loads(identity_path.read_text(encoding='utf-8'))
    targets = {t['object']: t for t in identities['targets']}
    assert len(targets) == 21
    mappings = []
    for r in lock['rows']:
        order, actual, source_file = int(r[0]), r[1], r[2]
        stem = Path(source_file).stem
        specified = 'TB_XH202612_V50_' + stem
        assert actual == 'V50_' + stem
        match = targets[actual]
        assert match['sourceFile'] == source_file and match['modelAliasMatchCount'] == 1
        mappings.append({'order': order, 'sourceFile': source_file, 'specifiedName': specified,
                         'actualAlias': actual, 'specifiedLength': len(specified), 'actualLength': len(actual),
                         'viewId': match['viewId'], 'physical': match['physical'],
                         'historicalSameNameStatus': r[3]})
    assert len({m['actualAlias'] for m in mappings}) == 21
    assert len({m['viewId'] for m in mappings}) == 21

    source_contract_path = HERE.parents[1] / 'A00/A00_step45_results.json'
    source_contract = json.loads(source_contract_path.read_text(encoding='utf-8'))
    contract = {t['file']: t for t in source_contract['formal']}
    for key in ('policy', 'years'):
        assert inputs[key]['sha256'] == contract[Path(inputs[key]['path']).name]['exp_sha']
    policy = [dict(zip(inputs['policy']['headers'], r)) for r in inputs['policy']['rows']]
    years = [dict(zip(inputs['years']['headers'], r)) for r in inputs['years']['rows']]
    year_counts = Counter(int(r['year_key']) for r in years)
    assert len(years) == len(year_counts) == 16
    assert set(year_counts) == set(range(2010, 2026))
    assert len(policy) == 2744
    assert len({(r['iso3'], int(r['year']), r['policy_code']) for r in policy}) == 2744
    unmatched = [r for r in policy if int(r['year']) not in year_counts]
    inner_rows = sum(year_counts[int(r['year'])] for r in policy)
    left_rows = sum(max(1, year_counts[int(r['year'])]) for r in policy)
    assert len(unmatched) == 40 and inner_rows == 2704 and left_rows == 2744
    assert {int(r['year']) for r in unmatched} == {2026}
    assert len({r['iso3'] for r in unmatched}) == 40
    assert {r['policy_code'] for r in unmatched} == {'SANCTIONS_OFAC_PROGRAM'}
    assert {r['quality_flag'] for r in unmatched} == {'review'}
    assert {r['manual_review_status'] for r in unmatched} == {'机提待核(生效日待人工确认)'}
    audit_a = next(r for r in inputs['auditA']['rows'] if int(r[0]) == 14)
    audit_shared = next(r for r in inputs['auditShared']['rows'] if int(r[0]) == 14)
    assert audit_a == audit_shared
    assert audit_a[3:8] == [2744, 2704, '40(已核验)', '无', 'PASS']

    prepare_path = HERE.parent / 'a03_prepare.py'
    prepare = prepare_path.read_text(encoding='utf-8-sig')
    tree = ast.parse(prepare)
    assignments = [n for n in ast.walk(tree) if isinstance(n, ast.Assign)
                   and any(isinstance(t, ast.Name) and t.id == 'PFX' for t in n.targets)]
    assert len(assignments) == 1 and ast.literal_eval(assignments[0].value) == 'V50_'
    assert 'ARCHIVED_GENERATOR_BLOCKED' in prepare and 'A03_ALLOW_ARCHIVE_REBUILD' in prepare
    assert 'SystemExit' in prepare and prepare.index('SystemExit') < prepare.index('os.makedirs')
    read_only_entry = HERE.parent / 'A03_RECHECK_20260904/a03_preflight.mjs'
    assert read_only_entry.exists()

    export_audit_path = WORK / 'A_数据平台/04_XML恢复/A07_CURRENT_EXPORT_20260904/EXPORT_AUDIT.json'
    export_audit = json.loads(export_audit_path.read_text(encoding='utf-8'))
    assert export_audit['model']['exactlyMatchesSeptember4HeldSnapshot']
    assert export_audit['model']['canonicalXmlSha256'] == identities['currentSnapshot']['modelCanonicalXmlSha256']
    raw_package = WORK / export_audit['package']['path']
    assert sha(raw_package) == export_audit['package']['sha256']

    docs = {
        'importExecutionLog': HERE.parent / 'A03_EXECUTION_LOG_V50.txt',
        'signedG2StartDecision': SHARED / '每日协调/G2_START_RELEASE_20260828.md',
        'historicalBReview': SHARED / '每日协调/B_REVIEW_A03_A04_20260827.md',
        'currentModelIdentityAudit': identity_path, 'currentPackageAudit': export_audit_path,
        'archiveGenerator': prepare_path, 'readOnlyLedgerEntry': read_only_entry,
    }
    report = {
        'date': '2026-09-04', 'scope': 'A_DISPOSITION_EVIDENCE_ONLY_NOT_FINAL_RISK_ACCEPTANCE',
        'sourceWorkbooks': {k: {x: v[x] for x in ('path', 'sha256', 'sheet', 'rowCount')} for k, v in inputs.items()},
        'documentSources': {k: {'path': p.relative_to(WORK).as_posix(), 'sha256': sha(p)} for k, p in docs.items()},
        'resourceHistory': {'targetCount': 21, 'historicallyUntraceable': 21, 'currentSnapshotIdentityMatches': 21,
                            'preImportNoOverwriteProven': False, 'wholeTenantUniquenessProven': False,
                            'originalLockWorkbookModified': False},
        'naming': {'specifiedPrefix': 'TB_XH202612_V50_', 'specifiedPrefixLength': 16,
                   'actualPrefix': 'V50_', 'actualPrefixLength': 4,
                   'historicallyReportedLengthLimit': 30, 'platformLimitRetestedToday': False,
                   'specifiedOver30': sum(m['specifiedLength'] > 30 for m in mappings),
                   'actualOver30': sum(m['actualLength'] > 30 for m in mappings),
                   'maximumSpecifiedLength': max(m['specifiedLength'] for m in mappings),
                   'maximumActualLength': max(m['actualLength'] for m in mappings),
                   'archiveGeneratorGuardStaticallyPresent': True, 'generatorExecuted': False,
                   'readOnlyEntryExists': True, 'mapping': mappings},
        'relation14': {'factRows': len(policy), 'factGrain': ['iso3', 'year', 'policy_code'],
                       'dimensionRows': len(years), 'dimensionYearMin': min(year_counts), 'dimensionYearMax': max(year_counts),
                       'sourceInnerJoinRows': inner_rows, 'sourceLeftJoinRows': left_rows,
                       'sourceJoinInflation': left_rows-len(policy), 'unmatchedRows': len(unmatched),
                       'unmatchedFractionOfAllFactRows': len(unmatched)/len(policy),
                       'unmatchedFractionOf2026Rows': len(unmatched)/sum(int(r['year']) == 2026 for r in policy),
                       'unmatchedDistinctCountries': len({r['iso3'] for r in unmatched}),
                       'unmatchedYears': counted(int(r['year']) for r in unmatched),
                       'unmatchedPolicyCodes': counted(r['policy_code'] for r in unmatched),
                       'unmatchedQualityFlags': counted(r['quality_flag'] for r in unmatched),
                       'unmatchedReviewStatus': counted(r['manual_review_status'] for r in unmatched),
                       'unmatchedValueNullCount': sum(r['value'] is None or r['value'] == '' for r in unmatched),
                       'historicalAuditCellRange': '关系审计!A15:H15', 'historicalAuditRow': audit_a,
                       'historicalPassDoesNotProveNoOmission': True, 'liveJoinRetestedToday': False,
                       'sourceOrRelationshipModified': False},
        'boundaries': {'aEvidenceStatementPrepared': True, 'bSigned': False, 'finalWaiverGranted': False,
                       'finalFreezeCreated': False, 'independentRestoreExecuted': False,
                       'cpiRepairOrRetest': False, 'skippedAiRetested': False},
    }
    for item in inputs.values():
        assert sha(WORK / item['path']) == item['sha256'], 'Input mutated during audit'
    return report


if __name__ == '__main__':
    report = evaluate()
    (HERE / 'RISK_EVIDENCE.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'resourceHistory': report['resourceHistory'],
                      'naming': {k:v for k,v in report['naming'].items() if k!='mapping'},
                      'relation14': report['relation14']}, ensure_ascii=False, indent=2))

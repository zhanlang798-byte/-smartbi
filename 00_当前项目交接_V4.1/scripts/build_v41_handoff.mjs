import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const handoffRoot = path.dirname(path.dirname(scriptPath));
const projectRoot = path.dirname(handoffRoot);
const archiveRoot = path.join(projectRoot, '调研资料归档_V1.0');
const planDir = path.join(projectRoot, '计划书');
const v40Tex = path.join(planDir, '05_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书.tex');
const v40Pdf = path.join(planDir, '05_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书.pdf');
const v41Tex = path.join(planDir, '06_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.1.tex');
const v41Pdf = path.join(planDir, '06_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.1.pdf');
const qaDir = path.join(handoffRoot, 'qa');
const deliveryDir = path.join(handoffRoot, 'delivery');

for (const dir of [handoffRoot, qaDir, deliveryDir]) fs.mkdirSync(dir, { recursive: true });

const relProject = (p) => path.relative(projectRoot, p).replaceAll('\\', '/');
const relHandoff = (p) => path.relative(handoffRoot, p).replaceAll('\\', '/');

function csvParse(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).filter((r) => r.some((v) => v !== '')).map((r) =>
    Object.fromEntries(headers.map((h, idx) => [h, r[idx] ?? '']))
  );
}

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  return `"${s.replaceAll('"', '""')}"`;
}

function csvWrite(file, rows, headers) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  fs.writeFileSync(file, `\uFEFF${lines.join('\r\n')}\r\n`, 'utf8');
}

function jsonlWrite(file, rows) {
  fs.writeFileSync(file, `${rows.map((r) => JSON.stringify(r)).join('\n')}\n`, 'utf8');
}

async function sha256File(file) {
  const hash = crypto.createHash('sha256');
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', resolve);
    stream.on('error', reject);
  });
  return hash.digest('hex');
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

async function walkFiles(root, exclude = () => false) {
  const output = [];
  async function visit(current) {
    const entries = await fs.promises.readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (exclude(full, entry)) continue;
      if (entry.isDirectory()) await visit(full);
      else if (entry.isFile()) output.push(full);
    }
  }
  await visit(root);
  return output;
}

async function hashEntries(files, scope, base) {
  const rows = [];
  for (const file of files) {
    const stat = fs.statSync(file);
    rows.push({
      scope,
      relative_path: path.relative(base, file).replaceAll('\\', '/'),
      size_bytes: stat.size,
      mtime_utc: stat.mtime.toISOString(),
      sha256: await sha256File(file),
    });
  }
  return rows;
}

function combinedHash(rows) {
  const body = [...rows]
    .sort((a, b) => `${a.scope}/${a.relative_path}`.localeCompare(`${b.scope}/${b.relative_path}`, 'en'))
    .map((r) => `${r.scope}|${r.relative_path}|${r.size_bytes}|${r.sha256}`)
    .join('\n');
  return sha256Text(body);
}

async function baseline() {
  const beforeCsv = path.join(qaDir, 'protected_hashes_before.csv');
  if (fs.existsSync(beforeCsv)) throw new Error(`Baseline already exists: ${beforeCsv}`);
  const planRows = await hashEntries([v40Tex, v40Pdf], 'V4.0_PLAN', planDir);
  const archiveFiles = await walkFiles(archiveRoot);
  const archiveRows = await hashEntries(archiveFiles, 'ARCHIVE_V1.0', archiveRoot);
  const rows = [...planRows, ...archiveRows];
  csvWrite(beforeCsv, rows, ['scope', 'relative_path', 'size_bytes', 'mtime_utc', 'sha256']);
  const summary = {
    snapshot_id: '20260816_v41_prechange_protected_baseline',
    captured_at: new Date().toISOString(),
    v40_file_count: planRows.length,
    archive_file_count: archiveRows.length,
    total_file_count: rows.length,
    combined_sha256: combinedHash(rows),
  };
  fs.writeFileSync(path.join(qaDir, 'protected_baseline_summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const readCsv = (p) => csvParse(fs.readFileSync(p, 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function targetTable(category) {
  const map = {
    '01_比赛与项目基线': 'source_registry',
    '02_方案演进与调研报告': 'source_registry',
    '03_案例库与证据': 'case_evidence|historical_crisis_event',
    '04_国别货币与中国出海': 'country_exposure|country_monthly_risk|country_policy_year|country_event',
    '05_全球周期与历史危机': 'global_cycle_month|historical_crisis_event|country_event',
    '06_黄金美元与储备配置': 'asset_monthly_return|portfolio_scenario',
    '07_会计合规与制裁': 'country_policy_year|portfolio_scenario|source_registry',
    '08_企业案例与公开披露': 'company_overseas_exposure|case_evidence',
    '09_Smartbi与比赛平台': 'source_registry',
    '10_数据集原件与说明': 'source_registry|country_monthly_risk|asset_monthly_return|global_cycle_month',
  };
  return map[category] ?? 'source_registry';
}

function reuseDecision(row) {
  const status = row.download_status;
  if (status === 'EXCLUDED_SECRET') return 'EXCLUDE_FROM_ALL_PACKAGES';
  if (status === 'DUPLICATE_CONTENT') return 'USE_CANONICAL_ASSET';
  if (status === 'METADATA_ONLY_LICENSE') return 'METADATA_ONLY_DO_NOT_REDISTRIBUTE';
  if (status === 'MANUAL_ACTION_REQUIRED') return 'USER_ACTION_BEFORE_USE';
  if (status === 'PAYWALL_OR_AUTH') return 'DO_NOT_FETCH_WITHOUT_AUTHORIZATION';
  if (status === 'BROKEN_OR_UNREACHABLE' || status === 'FETCH_FAILED') {
    return row.replacement_source ? 'USE_REPLACEMENT_SOURCE' : 'OPEN_GAP';
  }
  if (row.redistribution_scope === 'private_only') return 'LOCAL_ONLY_REUSE_AFTER_FIELD_CHECK';
  if (row.evidence_grade === 'A' || row.evidence_grade === 'B') return 'REUSE_AFTER_FIELD_AND_CLAIM_CHECK';
  return 'REUSE_AS_CONTEXT_AFTER_CHECK';
}

async function evidenceSha(relativePath) {
  const clean = relativePath.split('#')[0];
  const full = path.join(projectRoot, ...clean.split('/'));
  return fs.existsSync(full) && fs.statSync(full).isFile() ? await sha256File(full) : 'PENDING_OR_SECTION_REFERENCE';
}

async function buildStatusRows() {
  const planEvidence = relProject(v41Tex);
  const archiveRun = '调研资料归档_V1.0/12_复现脚本与运行记录/run_manifest.json';
  const caseIndex = '调研资料归档_V1.0/03_案例库与证据/case_index.csv';
  const rows = [
    ['ARCHIVE-R0', '调研归档', 'COMPLETE_VERIFIED', archiveRun, '2026-08-16', 'A/D', '把归档V1.0作为不可变证据快照，不重复扫描旧项目。', '688项资产全部取得唯一终态且包QA通过。', 'NONE', 'NONE'],
    ['ARCHIVE-R1', '来源闭包', 'COMPLETE_VERIFIED', '调研资料归档_V1.0/00_交接入口/研究资料总清单.jsonl', '2026-08-16', 'B/D', '正式使用前按证据等级、许可和字段需要逐项复核。', '688项终态之和等于资产总数。', 'NONE', 'ARCHIVE-R0'],
    ['ARCHIVE-R2', '案例索引', 'COMPLETE_VERIFIED', caseIndex, '2026-08-16', 'D/A', '把45份来源链接索引转换为V4.1 case_evidence字段并复核页码。', '45个case_id均有事件簇、原文件和来源数量。', 'NONE', 'ARCHIVE-R1'],
    ['EXT-01', '受限来源人工路由', 'EXTERNAL_ACTION', '调研资料归档_V1.0/00_交接入口/缺失受限与待办清单.csv', '2026-08-16', 'A/B', '按正式字段需要处理16项人工动作和15项登录或付费限制；未获授权则使用替代源或缩小承诺。', '每项受限来源均有负责人、合法操作、替代源或明确排除决定。', 'USER_AUTHORIZATION_OR_LICENSE_REQUIRED', 'ARCHIVE-R1'],
    ['SMARTBI-S0', '平台只读盘点', 'COMPLETE_VERIFIED', '计划书/05_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书.tex#主办方Smartbi实例实测', '2026-08-16', 'A', '取得写入范围确认后执行P0四表小样。', '实例版本、可见模块、共享环境边界已经记录。', 'WRITE_SCOPE_NOT_APPROVED', 'NONE'],
    ['D0', '研究口径冻结', 'PARTIAL_REUSABLE', `${planEvidence}#D0`, '2026-08-16', 'A', '签署G0并生成V4.1配置文件、变更单和首个正式run_manifest。', '配置、阈值、主键、时期和责任人签字完成。', 'FORMAL_SIGNOFF_NOT_COMPLETED', 'ARCHIVE-R0'],
    ['D1', '130国主数据', 'NOT_STARTED', `${planEvidence}#D1`, 'NOT_APPLICABLE', 'B/D', 'G0通过后建立恰好130个唯一ISO3的国家主表。', '区域45/51/34及必填字段完整率100%。', 'D0_NOT_SIGNED', 'D0'],
    ['D2', '来源登记与原始层', 'PARTIAL_REUSABLE', '00_当前项目交接_V4.1/SOURCE_REUSE_CROSSWALK_V4.1.csv', '2026-08-16', 'B/D', '先导入688项跨表映射，再只补采正式字段仍缺少的来源。', '688项全部映射且新增来源有许可、哈希和运行号。', 'FORMAL_SOURCE_REGISTRY_NOT_BUILT', 'D0|ARCHIVE-R1'],
    ['D3', '130国投资覆盖', 'NOT_STARTED', `${planEvidence}#D3`, 'NOT_APPLICABLE', 'B/A', '基于D1和D2构建country_exposure。', '国家年份主键无重复，存在性判断来源覆盖100%。', 'D1_D2_NOT_COMPLETE', 'D1|D2'],
    ['D4', '候选国月度宏观', 'NOT_STARTED', `${planEvidence}#D4`, 'NOT_APPLICABLE', 'B/C', '采集汇率与CPI等真实月度候选序列。', '覆盖矩阵能够独立复算。', 'D3_NOT_COMPLETE', 'D3'],
    ['D5', '40国筛选冻结', 'NOT_STARTED', `${planEvidence}#D5`, 'NOT_APPLICABLE', 'B/C/A', '按15/14/11、完整率和对照规则冻结样本。', 'G2通过且选择分数与配置哈希齐全。', 'D4_NOT_COMPLETE', 'D4'],
    ['D6A', '年度政策与资本约束', 'NOT_STARTED', `${planEvidence}#D6A`, 'NOT_APPLICABLE', 'B/D', '从归档线索和正式来源构建country_policy_year。', '年度频率、有效期、原文和人工复核状态完整。', 'D5_NOT_COMPLETE', 'D2|D5'],
    ['D6B', '20家企业披露', 'NOT_STARTED', `${planEvidence}#D6B`, 'NOT_APPLICABLE', 'D/B', '采集20家年报并执行关键数字双复核。', '量化画像满足披露资格且保留真实粒度。', 'ANNUAL_REPORT_DATABASE_NOT_BUILT', 'D2'],
    ['D6C', '资产成本与案例证据', 'PARTIAL_REUSABLE', caseIndex, '2026-08-16', 'B/D/C', '复用现有工作簿和45案例索引，补齐价格、成本、页码和证据角色。', '案例证据已字段化复核，资产序列完整率达标。', 'SOURCE_LINKS_INDEXED_NOT_FULLY_VERIFIED', 'D2|D5|ARCHIVE-R2'],
    ['D6D', '全球周期月度数据', 'NOT_STARTED', `${planEvidence}#D6D`, 'NOT_APPLICABLE', 'B/C', '建立1971—2025真实月度与按截至期关联的季度序列。', '核心指标适用期完整率不低于90%。', 'GLOBAL_CYCLE_PANEL_NOT_BUILT', 'D2'],
    ['D6E', '历史危机制度表', 'PARTIAL_REUSABLE', '调研资料归档_V1.0/05_全球周期与历史危机', '2026-08-16', 'D/C/A', '把17份宏观案例作为种子，完成字段化、页码和制度可比性复核。', '17个锚点全部进入historical_crisis_event并通过复核。', 'SEEDS_EXIST_STRUCTURED_TABLE_NOT_BUILT', 'D2|ARCHIVE-R2'],
    ['D7', '标准化与质量门', 'NOT_STARTED', `${planEvidence}#D7`, 'NOT_APPLICABLE', 'B/C/D', '完成11表主键、频率、单位、来源和许可QA。', 'G3通过且问题行进入拒绝表。', 'D3_D6_NOT_COMPLETE', 'D3|D4|D5|D6A|D6B|D6C|D6D|D6E'],
    ['D8', '国别事件识别', 'NOT_STARTED', `${planEvidence}#D8`, 'NOT_APPLICABLE', 'C/D', '在G3数据上按冻结阈值识别并合并事件。', '不少于20个独立事件且每区不少于5个。', 'G3_NOT_PASSED', 'D7'],
    ['D8B', '全球周期与历史类比', 'NOT_STARTED', `${planEvidence}#D8B`, 'NOT_APPLICABLE', 'C/A/D', '运行多标签、主状态、复合危机和制度可比性。', '预期历史阶段与无前视测试通过。', 'G3_NOT_PASSED', 'D6D|D6E|D7'],
    ['D9', '资产收益与组合情景', 'NOT_STARTED', `${planEvidence}#D9`, 'NOT_APPLICABLE', 'C/B/A', '完成收益分解、成本、对称剔除和企业情景。', 'G4通过且全部结果可复算。', 'D8_D8B_NOT_COMPLETE', 'D8|D8B'],
    ['P0', 'Smartbi小样门', 'NOT_STARTED', `${planEvidence}#P0`, 'NOT_APPLICABLE', 'A/B/D', '获批后在隔离前缀下执行四表小样、五问和XML导出。', '类型、连接、指标、问数和恢复证据通过。', 'WRITE_SCOPE_NOT_APPROVED', 'SMARTBI-S0|D0'],
    ['D10', 'Smartbi数据包', 'NOT_STARTED', `${planEvidence}#D10`, 'NOT_APPLICABLE', 'B/A', '导出18个数据工作簿和3个控制工作簿。', '行数、主键、类型和哈希一致。', 'G4_P0_NOT_PASSED', 'D9|P0'],
    ['D11', '六页看板与AIChat', 'NOT_STARTED', `${planEvidence}#D11`, 'NOT_APPLICABLE', 'A/B/D', '建立星座模型、六页看板和25问测试。', 'G5、性能、数值容差和来源追溯通过。', 'D10_NOT_COMPLETE', 'D10'],
    ['D12', '恢复报告视频提交', 'NOT_STARTED', `${planEvidence}#D12`, 'NOT_APPLICABLE', 'A/D/B/C', '完成XML隔离恢复、分析报告、视频和最终提交包。', 'G6通过且提交清单、哈希、合规材料齐全。', 'D11_NOT_COMPLETE', 'D11'],
  ];
  const headers = ['work_item_id', 'stage', 'status', 'evidence_path', 'completed_at', 'owner', 'next_action', 'acceptance_rule', 'blocker', 'dependency'];
  const output = [];
  for (const row of rows) {
    const item = Object.fromEntries(headers.map((h, i) => [h, row[i]]));
    item.evidence_sha256 = await evidenceSha(item.evidence_path);
    output.push({
      work_item_id: item.work_item_id,
      stage: item.stage,
      status: item.status,
      evidence_path: item.evidence_path,
      evidence_sha256: item.evidence_sha256,
      completed_at: item.completed_at,
      owner: item.owner,
      next_action: item.next_action,
      acceptance_rule: item.acceptance_rule,
      blocker: item.blocker,
      dependency: item.dependency,
    });
  }
  return output;
}

async function build() {
  const run = readJson(path.join(archiveRoot, '12_复现脚本与运行记录', 'run_manifest.json'));
  const packageVerification = readJson(path.join(archiveRoot, 'delivery', 'package_verification.json'));
  const registry = readCsv(path.join(archiveRoot, '00_交接入口', '研究资料总清单.csv'));
  const citations = readCsv(path.join(archiveRoot, '00_交接入口', '引用与结论关系.csv'));
  const cases = readCsv(path.join(archiveRoot, '03_案例库与证据', 'case_index.csv'));
  assert(registry.length === 688, `Expected 688 registry rows, got ${registry.length}`);
  assert(citations.length === 1478, `Expected 1478 citation rows, got ${citations.length}`);
  assert(cases.length === 45, `Expected 45 cases, got ${cases.length}`);
  assert(run.terminal_status_closure_pass === true, 'Archive terminal status closure is not true');
  assert(cases.every((c) => c.verification_status === 'SOURCE_LINKS_INDEXED'), 'Case status is not uniformly SOURCE_LINKS_INDEXED');
  const failed = registry.filter((r) => ['BROKEN_OR_UNREACHABLE', 'FETCH_FAILED'].includes(r.download_status));
  assert(failed.length === 11 && failed.every((r) => r.replacement_source), 'Failed/broken replacement closure is not 11/11');
  const ji = registry.find((r) => r.asset_id === 'WEB-0115');
  assert(ji && ji.sha256 === '696a7249e4992eaa6a94f61f66daae76184226e42b9bda0015d6b33da9b8e4eb', 'WEB-0115 recovery hash mismatch');

  const statusCounts = Object.fromEntries(Object.entries(run.status_counts));
  const scopeCounts = registry.reduce((acc, r) => {
    acc[r.redistribution_scope] = (acc[r.redistribution_scope] ?? 0) + 1;
    return acc;
  }, {});

  const crosswalk = registry.map((r) => ({
    archive_asset_id: r.asset_id,
    archive_run_id: run.run_id,
    download_status: r.download_status,
    evidence_grade: r.evidence_grade,
    redistribution_scope: r.redistribution_scope,
    local_path: r.local_path,
    sha256: r.sha256,
    replacement_source: r.replacement_source || r.duplicate_of_asset_id || '',
    target_table: targetTable(r.category),
    reuse_decision: reuseDecision(r),
    revalidation_required: r.download_status === 'EXCLUDED_SECRET' ? 'NOT_APPLICABLE' : 'YES_BEFORE_FORMAL_MODEL_USE',
  }));
  csvWrite(path.join(handoffRoot, 'SOURCE_REUSE_CROSSWALK_V4.1.csv'), crosswalk, [
    'archive_asset_id', 'archive_run_id', 'download_status', 'evidence_grade', 'redistribution_scope',
    'local_path', 'sha256', 'replacement_source', 'target_table', 'reuse_decision', 'revalidation_required',
  ]);

  const statusRows = await buildStatusRows();
  const statusHeaders = [
    'work_item_id', 'stage', 'status', 'evidence_path', 'evidence_sha256', 'completed_at', 'owner',
    'next_action', 'acceptance_rule', 'blocker', 'dependency',
  ];
  csvWrite(path.join(handoffRoot, 'PROJECT_STATUS_V4.1.csv'), statusRows, statusHeaders);
  jsonlWrite(path.join(handoffRoot, 'PROJECT_STATUS_V4.1.jsonl'), statusRows);

  const planTexHash = fs.existsSync(v41Tex) ? await sha256File(v41Tex) : null;
  const planPdfHash = fs.existsSync(v41Pdf) ? await sha256File(v41Pdf) : null;
  const context = {
    context_version: 'V4.1',
    as_of: '2026-08-16',
    project_name: '面向中国出海企业的国别风险与应急储备智能决策平台',
    competition_code: 'XH-202612',
    document_status: '调研成果同步与执行交接稿',
    current_authoritative_plan: relProject(v41Pdf),
    current_authoritative_plan_source: relProject(v41Tex),
    plan_pdf_sha256: planPdfHash,
    plan_tex_sha256: planTexHash,
    authority_order: [
      '00_当前项目交接_V4.1/README_先读我.md',
      relProject(v41Pdf),
      '调研资料归档_V1.0/00_交接入口/研究资料总清单.jsonl',
      '计划书/05_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书.pdf',
      'V1.1-V3.1历史计划书',
    ],
    supersedes_for_current_status: '调研资料归档_V1.0/00_交接入口/AI_CONTEXT.json（保留为V4.0归档快照，不修改）',
    current_direction: '亚非拉国别风险、全球经济周期、多币种流动性与黄金战略储备的周期协同决策；美元与黄金对称检验，不预设单一胜者。',
    archive_snapshot: {
      run_id: run.run_id,
      overall_state: run.overall_state,
      registry_sha256: run.registry_sha256,
      total_asset_count: run.total_asset_count,
      local_asset_count: run.local_asset_count,
      external_source_count: run.external_source_count,
      external_url_source_count: run.external_url_source_count,
      no_url_reference_count: run.no_url_reference_count,
      citation_relation_count: citations.length,
      case_count: cases.length,
      status_counts: statusCounts,
      redistribution_scope_counts: scopeCounts,
      historical_files_unchanged: run.historical_files_unchanged,
      report_pdf_pages: run.report_pdf_pages,
      report_visual_qa: run.report_visual_qa,
      failed_or_broken_with_replacement: failed.length,
      shared_package_roundtrip: packageVerification[0]?.roundtrip,
      shared_package_offline_test: packageVerification[0]?.offline_handoff_test,
      recovered_paper: {
        asset_id: 'WEB-0115',
        file_name: 'Ji_et_al_2026_Entropy_CNN-QRLSTM.pdf',
        sha256: ji.sha256,
      },
    },
    status_enum: ['COMPLETE_VERIFIED', 'PARTIAL_REUSABLE', 'NOT_STARTED', 'EXTERNAL_ACTION'],
    completed_verified: [
      '调研资料归档与688项终态闭包',
      '1478条引用关系索引',
      '45份案例来源链接索引',
      'Smartbi认证后只读能力盘点',
      '共享归档包回环、秘密扫描和25问离线交接测试',
    ],
    partially_reusable: [
      'D0研究口径已有V4.0/V4.1文字合同，但尚未签署配置',
      'D2已有来源发现、原件、许可和哈希快照，但尚未生成正式项目source_registry',
      'D6C已有案例链接和部分资产工作簿，但尚未完成字段化与证据复核',
      'D6E已有17份宏观案例种子，但尚未形成historical_crisis_event权威表',
    ],
    not_completed: [
      '130国正式覆盖表', '40国月度量化面板', '20家企业全量年报库', '1971-2025全球周期正式数据',
      '危机事件与组合模型', 'Smartbi数据写入和六页看板', 'AIChat数值验收', 'XML恢复与最终提交包',
    ],
    do_not_claim: [
      '调研归档完成等同于正式数据工程完成', '45份案例已经全部核验', '130国、40国或20家企业数据库已经完成',
      '模型、看板、AIChat或XML恢复已经完成', 'metadata_only资料已下载全文', '美元或黄金被预设为单一胜者',
    ],
    next_action_order: [
      'D0：签署G0并冻结V4.1配置和新run_id',
      'D2：导入SOURCE_REUSE_CROSSWALK_V4.1.csv，建立正式source_registry种子',
      'D1：建立130国唯一ISO3主表',
      'D3-D7：按门槛推进正式数据工程',
      'P0：取得写入批准后执行Smartbi四表小样',
    ],
    machine_files: {
      status_csv: '00_当前项目交接_V4.1/PROJECT_STATUS_V4.1.csv',
      status_jsonl: '00_当前项目交接_V4.1/PROJECT_STATUS_V4.1.jsonl',
      source_crosswalk: '00_当前项目交接_V4.1/SOURCE_REUSE_CROSSWALK_V4.1.csv',
      archive_registry: '调研资料归档_V1.0/00_交接入口/研究资料总清单.jsonl',
      archive_gaps: '调研资料归档_V1.0/00_交接入口/缺失受限与待办清单.csv',
    },
  };
  fs.writeFileSync(path.join(handoffRoot, 'AI_CONTEXT_V4.1.json'), `${JSON.stringify(context, null, 2)}\n`, 'utf8');

  const readme = `# XH-202612 当前项目交接 V4.1\n\n` +
    `这是团队成员和下一位AI的唯一首读入口。状态截止日期为 **2026-08-16**。除本目录内的文件名外，文中路径均相对于解压后的交接包根目录。\n\n` +
    `## 十分钟阅读顺序\n\n` +
    `1. 读取 \`AI_CONTEXT_V4.1.json\`，确认完成、部分可复用和未开始事项。\n` +
    `2. 读取 \`PROJECT_STATUS_V4.1.csv\`，按 \`work_item_id\` 找到责任人、证据和下一动作。\n` +
    `3. 阅读 \`${relProject(v41Pdf)}\`，它是当前权威计划书。\n` +
    `4. 用 \`SOURCE_REUSE_CROSSWALK_V4.1.csv\` 判断资料能否直接复用，禁止重新盲目下载。\n` +
    `5. 需要原件时再进入 \`调研资料归档_V1.0/00_交接入口/研究资料总清单.jsonl\`；先核对状态、许可和哈希。\n\n` +
    `## 当前一句话状态\n\n` +
    `调研证据归档已经完成并通过验证；正式的130国、40国、20家企业、全球周期、模型和Smartbi产品尚未建设。\n\n` +
    `## 已完成并核验\n\n` +
    `- 688项资料取得唯一终态：180项本地资产、508项外部来源。\n` +
    `- 1,478条引用关系和45份案例来源链接已经索引。\n` +
    `- 11项失效或抓取失败来源全部登记替代来源。\n` +
    `- 201个历史文件哈希未改变；归档报告96页并通过视觉QA。\n` +
    `- Smartbi实例只读能力盘点已经完成；上传、建模、看板、AIChat和XML恢复尚未执行。\n\n` +
    `## 下一步前三件事\n\n` +
    `1. A牵头签署D0/G0，生成V4.1配置与新的正式运行号。\n` +
    `2. B与D把688项交叉表导入正式source_registry种子，只补采缺口。\n` +
    `3. B建立130国ISO3主表；C独立复核，未通过不得进入40国筛选。\n\n` +
    `## 禁止重复劳动和禁止误述\n\n` +
    `- 不重新扫描或覆盖调研资料归档V1.0。\n` +
    `- 不把SOURCE_LINKS_INDEXED写成案例事实已全部核验。\n` +
    `- 不把metadata_only、paywall或manual_action写成已取得全文。\n` +
    `- 不把既有黄金工作簿写成11张正式权威表。\n` +
    `- 不向共享包写入账号、密码、Cookie、令牌或private_only原件。\n\n` +
    `## 权威文件关系\n\n` +
    `V4.1当前交接入口 > V4.1计划书 > 调研归档V1.0机器清单与原件 > V4.0及更早历史版本。归档内部的旧AI_CONTEXT.json是V4.0时点快照，保留不改，由本文件接替当前状态。\n`;
  fs.writeFileSync(path.join(handoffRoot, 'README_先读我.md'), readme, 'utf8');

  await writeManifest();
  process.stdout.write(`${JSON.stringify({ built: true, registry: registry.length, citations: citations.length, cases: cases.length, status_rows: statusRows.length }, null, 2)}\n`);
}

async function writeManifest() {
  const exclude = (full) => {
    const rel = relHandoff(full);
    return rel.startsWith('delivery/package_stage/') || rel.endsWith('.zip') ||
      rel === 'HANDOFF_MANIFEST_V4.1.json' || rel === 'checksums_sha256.txt';
  };
  const files = await walkFiles(handoffRoot, exclude);
  const entries = [];
  for (const file of files) {
    const stat = fs.statSync(file);
    entries.push({ path: relHandoff(file), size_bytes: stat.size, sha256: await sha256File(file) });
  }
  entries.sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'));
  const manifest = {
    version: 'V4.1',
    as_of: '2026-08-16',
    project: 'XH-202612',
    authority_order: ['README_先读我.md', relProject(v41Pdf), '调研资料归档_V1.0', 'V4.0及更早历史版本'],
    file_count: entries.length,
    combined_sha256: combinedHash(entries.map((e) => ({ scope: 'HANDOFF_V4.1', relative_path: e.path, size_bytes: e.size_bytes, sha256: e.sha256 }))),
    files: entries,
  };
  fs.writeFileSync(path.join(handoffRoot, 'HANDOFF_MANIFEST_V4.1.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(handoffRoot, 'checksums_sha256.txt'), `${entries.map((e) => `${e.sha256}  ${e.path}`).join('\n')}\n`, 'utf8');
}

async function verifyProtected() {
  const beforePath = path.join(qaDir, 'protected_hashes_before.csv');
  assert(fs.existsSync(beforePath), 'Protected baseline is missing');
  const before = readCsv(beforePath);
  const planRows = await hashEntries([v40Tex, v40Pdf], 'V4.0_PLAN', planDir);
  const archiveRows = await hashEntries(await walkFiles(archiveRoot), 'ARCHIVE_V1.0', archiveRoot);
  const after = [...planRows, ...archiveRows];
  const beforeMap = new Map(before.map((r) => [`${r.scope}|${r.relative_path}`, r]));
  const afterMap = new Map(after.map((r) => [`${r.scope}|${r.relative_path}`, r]));
  const keys = [...new Set([...beforeMap.keys(), ...afterMap.keys()])].sort();
  const comparison = keys.map((key) => {
    const b = beforeMap.get(key);
    const a = afterMap.get(key);
    return {
      key,
      before_sha256: b?.sha256 ?? '',
      after_sha256: a?.sha256 ?? '',
      status: b && a && b.sha256 === a.sha256 && String(b.size_bytes) === String(a.size_bytes) ? 'UNCHANGED' : !b ? 'ADDED' : !a ? 'MISSING' : 'CHANGED',
    };
  });
  csvWrite(path.join(qaDir, 'protected_hash_comparison.csv'), comparison, ['key', 'before_sha256', 'after_sha256', 'status']);
  const summary = {
    verified_at: new Date().toISOString(),
    before_count: before.length,
    after_count: after.length,
    unchanged_count: comparison.filter((r) => r.status === 'UNCHANGED').length,
    differences: comparison.filter((r) => r.status !== 'UNCHANGED'),
    pass: comparison.every((r) => r.status === 'UNCHANGED'),
    before_combined_sha256: combinedHash(before),
    after_combined_sha256: combinedHash(after),
  };
  fs.writeFileSync(path.join(qaDir, 'protected_verification.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  assert(summary.pass, `Protected files changed: ${JSON.stringify(summary.differences.slice(0, 5))}`);
  return summary;
}

async function verify() {
  await build();
  const context = readJson(path.join(handoffRoot, 'AI_CONTEXT_V4.1.json'));
  const statuses = readCsv(path.join(handoffRoot, 'PROJECT_STATUS_V4.1.csv'));
  const crosswalk = readCsv(path.join(handoffRoot, 'SOURCE_REUSE_CROSSWALK_V4.1.csv'));
  const registry = readCsv(path.join(archiveRoot, '00_交接入口', '研究资料总清单.csv'));
  const cases = readCsv(path.join(archiveRoot, '03_案例库与证据', 'case_index.csv'));
  const citations = readCsv(path.join(archiveRoot, '00_交接入口', '引用与结论关系.csv'));
  const tex = fs.readFileSync(v41Tex, 'utf8');
  const mandatory = ['work_item_id', 'stage', 'status', 'evidence_path', 'next_action', 'acceptance_rule'];
  assert(statuses.every((r) => mandatory.every((f) => String(r[f] ?? '').trim() !== '')), 'Status ledger contains blank mandatory fields');
  assert(crosswalk.length === 688, 'Crosswalk does not contain 688 rows');
  assert(new Set(crosswalk.map((r) => r.archive_asset_id)).size === 688, 'Crosswalk asset_id is not unique');
  const requiredTex = ['V4.1', '688', '1,478', '45 份案例', 'COMPLETE_VERIFIED', 'PARTIAL_REUSABLE', 'SOURCE_LINKS_INDEXED', 'archive_asset_id', 'revalidation_required'];
  for (const marker of requiredTex) assert(tex.includes(marker), `V4.1 TeX missing marker: ${marker}`);
  const forbiddenClaims = ['130 国正式覆盖表已完成', '40 国月度量化面板已完成', '20 家企业全量年报库已完成', 'Smartbi 看板已经完成', '45 份案例已经全部核验'];
  for (const marker of forbiddenClaims) assert(!tex.includes(marker), `Forbidden completion claim found: ${marker}`);
  const protectedSummary = await verifyProtected();

  const status = (id) => statuses.find((r) => r.work_item_id === id)?.status;
  const ji = registry.find((r) => r.asset_id === 'WEB-0115');
  const broken = registry.filter((r) => ['BROKEN_OR_UNREACHABLE', 'FETCH_FAILED'].includes(r.download_status));
  const tests = [
    ['当前权威计划书是什么？', context.current_authoritative_plan.endsWith('_V4.1.pdf'), context.current_authoritative_plan],
    ['状态截止日期是什么？', context.as_of === '2026-08-16', context.as_of],
    ['归档资产总数是多少？', context.archive_snapshot.total_asset_count === 688, String(context.archive_snapshot.total_asset_count)],
    ['本地资产数是多少？', context.archive_snapshot.local_asset_count === 180, String(context.archive_snapshot.local_asset_count)],
    ['外部来源数是多少？', context.archive_snapshot.external_source_count === 508, String(context.archive_snapshot.external_source_count)],
    ['URL或DOI来源数是多少？', context.archive_snapshot.external_url_source_count === 507, String(context.archive_snapshot.external_url_source_count)],
    ['无URL题录数是多少？', context.archive_snapshot.no_url_reference_count === 1, String(context.archive_snapshot.no_url_reference_count)],
    ['引用关系数是多少？', citations.length === 1478, String(citations.length)],
    ['案例文件数是多少？', cases.length === 45, String(cases.length)],
    ['来源终态是否闭包？', context.archive_snapshot.overall_state === 'ARCHIVE_COMPLETE_WITH_EXPLICIT_GAPS', context.archive_snapshot.overall_state],
    ['归档工作状态是什么？', status('ARCHIVE-R0') === 'COMPLETE_VERIFIED', status('ARCHIVE-R0')],
    ['D0状态是什么？', status('D0') === 'PARTIAL_REUSABLE', status('D0')],
    ['D1状态是什么？', status('D1') === 'NOT_STARTED', status('D1')],
    ['D2状态是什么？', status('D2') === 'PARTIAL_REUSABLE', status('D2')],
    ['D6C状态是什么？', status('D6C') === 'PARTIAL_REUSABLE', status('D6C')],
    ['D6E状态是什么？', status('D6E') === 'PARTIAL_REUSABLE', status('D6E')],
    ['D12状态是什么？', status('D12') === 'NOT_STARTED', status('D12')],
    ['130国正式表完成了吗？', context.not_completed.includes('130国正式覆盖表'), '未完成'],
    ['40国月度面板完成了吗？', context.not_completed.includes('40国月度量化面板'), '未完成'],
    ['20家企业年报库完成了吗？', context.not_completed.includes('20家企业全量年报库'), '未完成'],
    ['Smartbi完成了什么？', status('SMARTBI-S0') === 'COMPLETE_VERIFIED' && status('P0') === 'NOT_STARTED', '只读盘点完成，P0未开始'],
    ['Ji论文是否恢复？', ji?.sha256 === '696a7249e4992eaa6a94f61f66daae76184226e42b9bda0015d6b33da9b8e4eb', ji?.asset_id ?? 'missing'],
    ['失效或失败来源是否有替代？', broken.length === 11 && broken.every((r) => r.replacement_source), `${broken.length}/11`],
    ['人工处理来源数是多少？', context.archive_snapshot.status_counts.MANUAL_ACTION_REQUIRED === 16, String(context.archive_snapshot.status_counts.MANUAL_ACTION_REQUIRED)],
    ['登录或付费限制数是多少？', context.archive_snapshot.status_counts.PAYWALL_OR_AUTH === 15, String(context.archive_snapshot.status_counts.PAYWALL_OR_AUTH)],
    ['秘密排除数是多少？', context.archive_snapshot.status_counts.EXCLUDED_SECRET === 4, String(context.archive_snapshot.status_counts.EXCLUDED_SECRET)],
    ['复用交叉表是否覆盖全部资产？', crosswalk.length === 688, String(crosswalk.length)],
    ['案例能否声称全部核验？', cases.every((c) => c.verification_status === 'SOURCE_LINKS_INDEXED'), '不能，仅来源链接已索引'],
    ['下一步第一项是什么？', context.next_action_order[0].startsWith('D0'), context.next_action_order[0]],
    ['旧V4.0和归档是否保持不变？', protectedSummary.pass, `${protectedSummary.unchanged_count}/${protectedSummary.after_count}`],
    ['是否允许把metadata_only写成已下载？', context.do_not_claim.some((x) => x.includes('metadata_only')), '不允许'],
    ['后续是否从已有清单复用？', crosswalk.every((r) => r.reuse_decision), '688项均有复用路由'],
  ].map(([question, pass, answer], i) => ({ test_id: `HO-${String(i + 1).padStart(2, '0')}`, question, pass: Boolean(pass), answer }));
  const offline = {
    tested_at: new Date().toISOString(),
    test_count: tests.length,
    passed: tests.filter((t) => t.pass).length,
    failed: tests.filter((t) => !t.pass).length,
    overall: tests.every((t) => t.pass) ? 'PASS' : 'FAIL',
    tests,
  };
  fs.writeFileSync(path.join(qaDir, 'offline_handoff_test_V4.1.json'), `${JSON.stringify(offline, null, 2)}\n`, 'utf8');
  assert(offline.overall === 'PASS' && offline.test_count >= 30, 'Offline handoff test did not pass at least 30 tests');

  const content = {
    verified_at: new Date().toISOString(),
    registry_rows: registry.length,
    citation_rows: citations.length,
    case_rows: cases.length,
    status_rows: statuses.length,
    crosswalk_rows: crosswalk.length,
    mandatory_status_fields_complete: true,
    failed_broken_replacements: `${broken.filter((r) => r.replacement_source).length}/${broken.length}`,
    protected_files_unchanged: protectedSummary.pass,
    offline_handoff_tests: `${offline.passed}/${offline.test_count}`,
    pass: true,
  };
  fs.writeFileSync(path.join(qaDir, 'content_verification_V4.1.json'), `${JSON.stringify(content, null, 2)}\n`, 'utf8');
  await writeManifest();
  process.stdout.write(`${JSON.stringify(content, null, 2)}\n`);
}

function rewriteVersionTokens() {
  let tex = fs.readFileSync(v41Tex, 'utf8');
  tex = tex.replaceAll('V40', 'V41').replaceAll('v40', 'v41');
  tex = tex.replaceAll('_V4.0.xlsx', '_V4.1.xlsx');
  fs.writeFileSync(v41Tex, tex, 'utf8');
  process.stdout.write(`${JSON.stringify({ rewritten: true, file: v41Tex }, null, 2)}\n`);
}

const mode = process.argv[2] ?? 'build';
if (mode === 'baseline') await baseline();
else if (mode === 'build') await build();
else if (mode === 'verify') await verify();
else if (mode === 'rewrite-version') rewriteVersionTokens();
else throw new Error(`Unknown mode: ${mode}`);

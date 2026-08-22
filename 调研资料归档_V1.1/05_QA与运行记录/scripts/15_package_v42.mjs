import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse as parseCsv } from 'csv-parse/sync';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '../../..');
const archiveV11 = path.join(projectRoot, '调研资料归档_V1.1');
const deliveryDir = path.join(archiveV11, 'delivery');
const stagingDir = path.join(deliveryDir, '_staging_V4.2_shared');
const roundtripDir = path.join(deliveryDir, '_roundtrip_V4.2_shared');
const handoffDir = path.join(projectRoot, '00_当前项目交接_V4.2');
const zipPath = path.join(projectRoot, 'XH-202612_计划调研与数据可用化交接包_V4.2.zip');

function assertWithin(target, parent) {
  const resolvedTarget = path.resolve(target);
  const resolvedParent = `${path.resolve(parent)}${path.sep}`;
  if (!`${resolvedTarget}${path.sep}`.startsWith(resolvedParent)) {
    throw new Error(`拒绝操作非受控路径：${resolvedTarget}`);
  }
}

async function resetControlledDir(target) {
  assertWithin(target, deliveryDir);
  await fsp.rm(target, { recursive: true, force: true });
  await fsp.mkdir(target, { recursive: true });
}

async function sha256(file) {
  const hash = crypto.createHash('sha256');
  return await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function copyFileToStage(source, relative) {
  const destination = path.join(stagingDir, relative.replaceAll('/', path.sep));
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  await fsp.copyFile(source, destination);
}

async function copyTree(sourceDir, relativeDestination, filter = () => true) {
  for (const entry of await fsp.readdir(sourceDir, { withFileTypes: true })) {
    const source = path.join(sourceDir, entry.name);
    const relative = path.posix.join(relativeDestination, entry.name);
    if (!filter(source, relative, entry)) continue;
    if (entry.isDirectory()) {
      await copyTree(source, relative, filter);
    } else if (entry.isFile()) {
      await copyFileToStage(source, relative);
    }
  }
}

async function listFiles(root) {
  const files = [];
  async function walk(current) {
    for (const entry of await fsp.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) files.push(full);
    }
  }
  await walk(root);
  return files.sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function relativePosix(file, root = stagingDir) {
  return path.relative(root, file).split(path.sep).join('/');
}

function isTextFile(file) {
  return /\.(?:md|json|jsonl|csv|tex|mmd|txt|mjs|js|xml|html|htm|yaml|yml|toml)$/i.test(file);
}

async function secretScan(files) {
  const findings = [];
  const patterns = [
    { id: 'CHINESE_MOBILE_OR_ACCOUNT', regex: /(?<![0-9a-f])1[3-9]\d{9}(?![0-9a-f])/i, controlOnly: true },
    { id: 'AUTH_HEADER', regex: /authorization\s*[:=]\s*(?:bearer|basic)\s+[A-Za-z0-9._~+\/-]{8,}/i },
    { id: 'COOKIE_HEADER', regex: /(?:^|[\r\n])\s*cookie\s*:\s*[^\r\n]{8,}/i },
    { id: 'PASSWORD_ASSIGNMENT', regex: /(?:password|passwd|pwd)\s*[:=]\s*["'][^"'\r\n]{4,}["']/i },
    { id: 'TOKENIZED_URL', regex: /[?&](?:access_token|auth_token|api_key|signature|sig|token)=[^&\s"']{6,}/i },
  ];

  for (const file of files) {
    const buffer = await fsp.readFile(file);
    if (!isTextFile(file)) continue;
    const text = buffer.toString('utf8');
    const relative = relativePosix(file);
    const controlPlane = /^(?:00_当前项目交接_V4\.2\/|计划书\/|流程图\/|README_交接包\.md$|调研资料归档_V1\.1\/05_QA与运行记录\/scripts\/)/.test(relative);
    for (const pattern of patterns) {
      if (pattern.controlOnly && !controlPlane) continue;
      if (pattern.regex.test(text)) findings.push({ path: relative, rule: pattern.id });
    }
  }
  return findings;
}

await fsp.mkdir(deliveryDir, { recursive: true });
await resetControlledDir(stagingDir);
await resetControlledDir(roundtripDir);

const registryPath = path.join(archiveV11, '00_交接入口', 'source_action_registry_V1.1.csv');
const registry = parseCsv(await fsp.readFile(registryPath, 'utf8'), {
  columns: true,
  bom: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true,
});
const scopeByAsset = new Map(registry.map((row) => [row.asset_id, row.redistribution_scope]));
const sharedAssetIds = new Set(registry.filter((row) => row.redistribution_scope === 'shared').map((row) => row.asset_id));

const handoffFilter = (_source, relative, entry) => {
  if (entry.isDirectory()) return true;
  return !/(?:HANDOFF_MANIFEST_V4\.2\.json|checksums_sha256\.txt|PACKAGE_VERIFICATION_V4\.2\.json)$/i.test(relative);
};
await copyTree(handoffDir, '00_当前项目交接_V4.2', handoffFilter);

const planFiles = [
  '07_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.2.tex',
  '07_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.2.pdf',
  'v42_operational_chapters.tex',
  'v42_generated_appendices.tex',
];
for (const name of planFiles) {
  await copyFileToStage(path.join(projectRoot, '计划书', name), `计划书/${name}`);
}
await copyFileToStage(
  path.join(projectRoot, '流程图', 'V4.2_来源获取至Smartbi交付全流程.mmd'),
  '流程图/V4.2_来源获取至Smartbi交付全流程.mmd',
);

await copyTree(path.join(archiveV11, '00_交接入口'), '调研资料归档_V1.1/00_交接入口');
await copyTree(path.join(archiveV11, '06_人工任务卡'), '调研资料归档_V1.1/06_人工任务卡');
await copyTree(
  path.join(archiveV11, '05_QA与运行记录'),
  '调研资料归档_V1.1/05_QA与运行记录',
  (source, relative, entry) => {
    const normalized = relative.replaceAll('\\', '/');
    if (entry.isDirectory() && /\/(?:node_modules|pdf_render_V4\.2|pdf_contact_sheets_V4\.2)(?:\/|$)/i.test(`/${normalized}/`)) return false;
    if (/\/(?:node_modules|pdf_render_V4\.2|pdf_contact_sheets_V4\.2)(?:\/|$)/i.test(`/${normalized}`)) return false;
    return true;
  },
);

for (const topName of ['01_新增原件', '02_提取正文', '03_提取表格', '04_替代来源']) {
  const sourceTop = path.join(archiveV11, topName);
  for (const entry of await fsp.readdir(sourceTop, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (scopeByAsset.get(entry.name) !== 'shared') continue;
    await copyTree(path.join(sourceTop, entry.name), `调研资料归档_V1.1/${topName}/${entry.name}`);
  }
}

const sharedV10Zip = path.join(projectRoot, '调研资料归档_V1.0', 'delivery', 'XH-202612_调研资料AI交接包_V1.0.zip');
await copyFileToStage(sharedV10Zip, '历史调研归档_V1.0/XH-202612_调研资料AI交接包_V1.0.zip');

const packageReadme = `# XH-202612 计划调研与数据可用化交接包 V4.2

首读入口：\`00_当前项目交接_V4.2/README_先读我.md\`。

- V4.2计划书与PDF位于\`计划书/\`。
- 688项来源动作、159项HTML矩阵、提取结果和QA位于\`调研资料归档_V1.1/\`。
- V1.0已验证共享归档以原ZIP形式位于\`历史调研归档_V1.0/\`，本包不包含本机冷备份。
- V1.1原件和提取结果只收录\`redistribution_scope=shared\`的资产；\`private_only\`与\`metadata_only\`仅保留动作元数据。
- 正式130国、40国、20家企业、模型、Smartbi、AIChat与XML仍未建设。
- 本包不含账号、密码、Cookie、令牌、认证头、Office锁文件或私有冷备份。
`;
await fsp.writeFile(path.join(stagingDir, 'README_交接包.md'), packageReadme, 'utf8');

let stagedFiles = await listFiles(stagingDir);
const preManifestEntries = [];
for (const file of stagedFiles) {
  const stat = await fsp.stat(file);
  preManifestEntries.push({ path: relativePosix(file), size: stat.size, sha256: await sha256(file) });
}

const scopeCounts = Object.fromEntries(
  ['shared', 'private_only', 'metadata_only'].map((scope) => [scope, registry.filter((row) => row.redistribution_scope === scope).length]),
);
const manifest = {
  manifest_version: 'V4.2',
  generated_at: new Date().toISOString(),
  package_name: path.basename(zipPath),
  authority_order: [
    '00_当前项目交接_V4.2/README_先读我.md',
    '00_当前项目交接_V4.2/AI_CONTEXT_V4.2.json',
    '计划书/07_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.2.pdf',
    '调研资料归档_V1.1/00_交接入口/source_action_registry_V1.1.jsonl',
    '历史调研归档_V1.0/XH-202612_调研资料AI交接包_V1.0.zip',
  ],
  source_action_count: registry.length,
  redistribution_scope_counts: scopeCounts,
  included_shared_asset_id_count: sharedAssetIds.size,
  private_and_metadata_originals_excluded: true,
  v10_shared_archive_sha256: await sha256(sharedV10Zip),
  content_file_count_before_manifest: preManifestEntries.length,
  content_bytes_before_manifest: preManifestEntries.reduce((sum, row) => sum + row.size, 0),
  exclusions: ['node_modules', 'PDF逐页渲染PNG', '联系表PNG', 'V1.0本机冷备份', 'private_only原件', 'metadata_only原件', '账号密码及认证材料'],
  files: preManifestEntries,
};
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
await fsp.writeFile(path.join(stagingDir, '00_当前项目交接_V4.2', 'HANDOFF_MANIFEST_V4.2.json'), manifestText, 'utf8');
await fsp.writeFile(path.join(handoffDir, 'HANDOFF_MANIFEST_V4.2.json'), manifestText, 'utf8');

stagedFiles = await listFiles(stagingDir);
const secretFindings = await secretScan(stagedFiles);
if (secretFindings.length > 0) {
  throw new Error(`秘密扫描失败：${JSON.stringify(secretFindings.slice(0, 20))}`);
}

const checksumRows = [];
for (const file of stagedFiles) checksumRows.push(`${await sha256(file)}  ${relativePosix(file)}`);
const checksumText = `${checksumRows.join('\n')}\n`;
await fsp.writeFile(path.join(stagingDir, '00_当前项目交接_V4.2', 'checksums_sha256.txt'), checksumText, 'utf8');
await fsp.writeFile(path.join(handoffDir, 'checksums_sha256.txt'), checksumText, 'utf8');

if (fs.existsSync(zipPath)) await fsp.rm(zipPath, { force: true });
execFileSync('tar.exe', ['-a', '-c', '-f', zipPath, '-C', stagingDir, '.'], { stdio: 'ignore' });
execFileSync('tar.exe', ['-xf', zipPath, '-C', roundtripDir], { stdio: 'ignore' });

let verifiedRows = 0;
for (const line of checksumRows) {
  const expected = line.slice(0, 64);
  const relative = line.slice(66);
  const extracted = path.join(roundtripDir, relative.replaceAll('/', path.sep));
  if (!fs.existsSync(extracted)) throw new Error(`回环解压缺失：${relative}`);
  const actual = await sha256(extracted);
  if (actual !== expected) throw new Error(`回环哈希不一致：${relative}`);
  verifiedRows += 1;
}

const extractedFiles = await listFiles(roundtripDir);
const stagedFilesFinal = await listFiles(stagingDir);
if (extractedFiles.length !== stagedFilesFinal.length) {
  throw new Error(`回环文件数不一致：staged=${stagedFilesFinal.length}, extracted=${extractedFiles.length}`);
}

const verification = {
  verified_at: new Date().toISOString(),
  status: 'PASS',
  zip_path: path.basename(zipPath),
  zip_size: (await fsp.stat(zipPath)).size,
  zip_sha256: await sha256(zipPath),
  staged_file_count: stagedFilesFinal.length,
  extracted_file_count: extractedFiles.length,
  checksum_rows_verified: verifiedRows,
  secret_scan_findings: secretFindings.length,
  v10_shared_archive_hash_verified: true,
  redistribution_filter: 'only V1.1 originals/extractions with redistribution_scope=shared',
  excluded_scopes: { private_only: scopeCounts.private_only, metadata_only: scopeCounts.metadata_only },
};
await fsp.writeFile(path.join(handoffDir, 'PACKAGE_VERIFICATION_V4.2.json'), `${JSON.stringify(verification, null, 2)}\n`, 'utf8');
await fsp.writeFile(path.join(deliveryDir, 'package_verification_V4.2.json'), `${JSON.stringify(verification, null, 2)}\n`, 'utf8');

await fsp.rm(stagingDir, { recursive: true, force: true });
await fsp.rm(roundtripDir, { recursive: true, force: true });

process.stdout.write(`${JSON.stringify({
  status: verification.status,
  package: zipPath,
  zip_size: verification.zip_size,
  zip_sha256: verification.zip_sha256,
  staged_file_count: verification.staged_file_count,
  checksum_rows_verified: verification.checksum_rows_verified,
  secret_scan_findings: verification.secret_scan_findings,
  shared_asset_ids: sharedAssetIds.size,
  excluded_private_only: scopeCounts.private_only,
  excluded_metadata_only: scopeCounts.metadata_only,
}, null, 2)}\n`);

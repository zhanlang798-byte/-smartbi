import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../../../");
const qaRoot = path.resolve(scriptDir, "../");
const phase = process.argv.includes("--verify") ? "verify" : "baseline";

const protectedRoots = [
  path.join(projectRoot, "调研资料归档_V1.0"),
  path.join(projectRoot, "00_当前项目交接_V4.1"),
];

const protectedFiles = [
  path.join(projectRoot, "计划书", "06_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.1.tex"),
  path.join(projectRoot, "计划书", "06_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.1.pdf"),
];

async function walk(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    const entries = await fsp.readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`保护目录存在链接，停止哈希：${full}`);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) out.push(full);
    }
  }
  return out;
}

async function sha256(file) {
  return await new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(file);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function buildManifest() {
  const files = [];
  for (const root of protectedRoots) {
    if (!(await exists(root))) throw new Error(`保护目录不存在：${root}`);
    files.push(...(await walk(root)));
  }
  for (const file of protectedFiles) {
    if (!(await exists(file))) throw new Error(`保护文件不存在：${file}`);
    files.push(file);
  }
  const planDir = path.join(projectRoot, "计划书");
  for (const file of await walk(planDir)) {
    if (/\.mmd$/i.test(file) && !/V4\.2/i.test(file)) files.push(file);
  }
  const unique = [...new Set(files.map((x) => path.resolve(x)))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const rows = [];
  let totalBytes = 0;
  for (let i = 0; i < unique.length; i += 1) {
    const file = unique[i];
    const stat = await fsp.stat(file);
    totalBytes += stat.size;
    rows.push({
      relative_path: path.relative(projectRoot, file).replaceAll("\\", "/"),
      size_bytes: stat.size,
      mtime_utc: stat.mtime.toISOString(),
      sha256: await sha256(file),
    });
    if ((i + 1) % 100 === 0) process.stdout.write(`hashed ${i + 1}/${unique.length}\n`);
  }
  return { rows, totalBytes };
}

async function exists(file) {
  try { await fsp.access(file); return true; } catch { return false; }
}

async function writeManifest(baseName, manifest) {
  await fsp.mkdir(qaRoot, { recursive: true });
  const csv = ["relative_path,size_bytes,mtime_utc,sha256", ...manifest.rows.map((r) =>
    [r.relative_path, r.size_bytes, r.mtime_utc, r.sha256].map(csvCell).join(",")
  )].join("\r\n") + "\r\n";
  await fsp.writeFile(path.join(qaRoot, `${baseName}.csv`), csv, "utf8");
  await fsp.writeFile(path.join(qaRoot, `${baseName}.json`), JSON.stringify({
    generated_at: new Date().toISOString(),
    file_count: manifest.rows.length,
    total_bytes: manifest.totalBytes,
    protected_roots: protectedRoots.map((p) => path.relative(projectRoot, p).replaceAll("\\", "/")),
    protected_files: protectedFiles.map((p) => path.relative(projectRoot, p).replaceAll("\\", "/")),
    rows: manifest.rows,
  }, null, 2), "utf8");
}

const current = await buildManifest();
if (phase === "baseline") {
  await writeManifest("legacy_hashes_before_V4.2", current);
  console.log(JSON.stringify({ phase, files: current.rows.length, bytes: current.totalBytes }, null, 2));
} else {
  const beforePath = path.join(qaRoot, "legacy_hashes_before_V4.2.json");
  if (!(await exists(beforePath))) throw new Error("缺少修改前哈希基线");
  const before = JSON.parse(await fsp.readFile(beforePath, "utf8"));
  const oldMap = new Map(before.rows.map((r) => [r.relative_path, r]));
  const newMap = new Map(current.rows.map((r) => [r.relative_path, r]));
  const changed = [];
  for (const [key, oldRow] of oldMap) {
    const newRow = newMap.get(key);
    if (!newRow) changed.push({ relative_path: key, state: "MISSING", before_sha256: oldRow.sha256, after_sha256: "" });
    else if (oldRow.sha256 !== newRow.sha256) changed.push({ relative_path: key, state: "CHANGED", before_sha256: oldRow.sha256, after_sha256: newRow.sha256 });
  }
  for (const [key, newRow] of newMap) {
    if (!oldMap.has(key)) changed.push({ relative_path: key, state: "ADDED_TO_PROTECTED_SET", before_sha256: "", after_sha256: newRow.sha256 });
  }
  await writeManifest("legacy_hashes_after_V4.2", current);
  const result = {
    verified_at: new Date().toISOString(),
    status: changed.length === 0 ? "PASS" : "FAIL",
    before_count: before.rows.length,
    after_count: current.rows.length,
    changed,
  };
  await fsp.writeFile(path.join(qaRoot, "legacy_hash_verification_V4.2.json"), JSON.stringify(result, null, 2), "utf8");
  console.log(JSON.stringify(result, null, 2));
  if (changed.length) process.exitCode = 2;
}

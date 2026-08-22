import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parse as parseCsv } from "csv-parse/sync";
import { stringify as stringifyCsv } from "csv-stringify/sync";
import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import iconv from "iconv-lite";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(scriptDir, "../../../");
export const archiveV10 = path.join(projectRoot, "调研资料归档_V1.0");
export const archiveV11 = path.join(projectRoot, "调研资料归档_V1.1");
const manifestPath = path.join(archiveV10, "00_交接入口", "研究资料总清单.csv");
const statePath = path.join(archiveV11, "05_QA与运行记录", "pipeline_state_V1.1.json");
const auditPath = path.join(archiveV11, "05_QA与运行记录", "web_asset_audit_V1.1.csv");
const candidatePath = path.join(archiveV11, "05_QA与运行记录", "resource_candidates_V1.1.csv");
const downloadPath = path.join(archiveV11, "05_QA与运行记录", "download_results_V1.1.csv");
const extractionPath = path.join(archiveV11, "05_QA与运行记录", "extraction_records_V1.1.jsonl");
const registryCsvPath = path.join(archiveV11, "00_交接入口", "source_action_registry_V1.1.csv");
const registryJsonlPath = path.join(archiveV11, "00_交接入口", "source_action_registry_V1.1.jsonl");

const runId = "20260816_web_usability_v11";
const asOf = "2026-08-16";
const directExtensions = new Set([".csv", ".xlsx", ".xls", ".json", ".xml", ".zip", ".pdf", ".txt"]);
const blockedStatuses = new Set(["METADATA_ONLY_LICENSE", "PAYWALL_OR_AUTH", "MANUAL_ACTION_REQUIRED", "EXCLUDED_SECRET", "NOT_PUBLIC"]);
const retryStatuses = new Set(["FETCH_FAILED", "BROKEN_OR_UNREACHABLE", "MISSING_DECLARED"]);
const blockPatterns = [
  /access denied/i,
  /akamai/i,
  /captcha/i,
  /verify you are human/i,
  /request unsuccessful/i,
  /bot[_ -]?check/i,
  /EO_Bot_Ssid/i,
  /__tst_status/i,
  /document\.cookie\s*=/i,
  /enable javascript and cookies/i,
  /cf-chl-/i,
];
const execFile = promisify(execFileCb);

async function exists(file) {
  try { await fsp.access(file); return true; } catch { return false; }
}

async function ensureDirs() {
  for (const dir of [
    "00_交接入口", "01_新增原件", "02_提取正文", "03_提取表格", "04_替代来源",
    "05_QA与运行记录", "06_人工任务卡", "delivery",
  ]) await fsp.mkdir(path.join(archiveV11, dir), { recursive: true });
}

async function readCsv(file) {
  return parseCsv(await fsp.readFile(file, "utf8"), { columns: true, bom: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });
}

async function writeCsv(file, rows, columns) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, stringifyCsv(rows, { header: true, columns, bom: true, record_delimiter: "windows" }), "utf8");
}

async function writeJson(file, value) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

async function appendJsonl(file, rows) {
  if (!rows.length) return;
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.appendFile(file, rows.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
}

function normalizeText(value) {
  return String(value ?? "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

function slug(value, max = 90) {
  return normalizeText(value).replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").replace(/\s+/g, "_").slice(0, max) || "asset";
}

function absoluteV10Local(row) {
  if (!row.local_path) return "";
  return path.join(archiveV10, row.local_path.replaceAll("/", path.sep));
}

function extractUrls(text) {
  const out = [];
  for (const match of String(text ?? "").matchAll(/https?:\/\/[^\s|<>"']+/g)) {
    try { out.push(new URL(match[0].replace(/[),.;]+$/, "")).href); } catch { /* ignore */ }
  }
  return [...new Set(out)];
}

function grade(row) {
  const g = String(row.evidence_grade || "").toUpperCase();
  if (g.startsWith("A")) return "A";
  if (g.startsWith("B")) return "B";
  if (g.startsWith("C")) return "C";
  if (g.startsWith("D")) return "D";
  return "INTERNAL";
}

function targetContract(row) {
  const text = `${row.category} ${row.title} ${row.purpose} ${row.supported_claim}`.toLowerCase();
  const contracts = [];
  const push = (table, fields, page) => contracts.push({ table, fields, page });
  if (/smartbi|比赛|评分|平台/.test(text)) push("source_registry", "平台版本、导入能力、ETL、模型、AIChat、XML、评分条款", "通用交付与评分证据");
  if (/企业|年报|财报|汇兑|收入|子公司|华为|海尔|比亚迪|中兴|传音|紫金/.test(text)) push("company_overseas_exposure", "企业、财年、海外收入、披露地区、汇兑损益、外币资产负债、套保、现金、授信、页码", "DB03 中国企业海外风险");
  if (/商务部|对外投资|odi|境外企业|投资存量|投资流量/.test(text)) push("country_exposure", "ISO3、国家、年份、中国投资流量、存量、企业存在、表号、页码", "DB01 亚非拉风险全景");
  if (/汇率|通胀|cpi|外汇储备|平行市场|世界银行|gem|wdi|货币/.test(text)) push("country_monthly_risk", "ISO3、月份、官方汇率、CPI、储备、平行汇率、发布日期、质量标记", "DB01/DB02 国别风险与危机下钻");
  if (/areaer|chinn|资本管制|汇出|兑换限制|制裁|法律|法规|合规/.test(text)) push("country_policy_year", "ISO3、年份、汇率制度、资本限制、汇出限制、制裁主体、有效期、原文定位", "DB02/DB05 政策与约束");
  if (/冻结|危机事件|银行中断|恶性通胀|货币崩溃/.test(text)) push("country_event", "事件ID、国家、类型、起止月、触发值、证据等级、决策时可知性", "DB02 国别与危机下钻");
  if (/黄金|美元|短债|国债|利率|sge|fred|treasury|套保|ndf|资产配置/.test(text)) push("asset_monthly_return", "月份、资产、计价口径、价格、收益、成本、来源版本", "DB04 多币种—黄金周期实验室");
  if (/组合|情景|储备配置|压力测试|cvar|回撤/.test(text)) push("portfolio_scenario", "情景、周期、权重、成本、流动性、CVaR、回撤、合法可用比例", "DB04/DB05 配置与约束");
  if (/案例库|案例档案|证据|反例/.test(text)) push("case_evidence", "案例ID、事件簇、命题角色、关键事实、来源等级、页码、复核状态", "DB05 决策、约束与证据中心");
  if (/大萧条|互联网泡沫|日本泡沫|广场协议|金融危机|历史危机|失去的/.test(text)) push("historical_crisis_event", "历史事件、制度环境、政策节点、起止期、可比性、黄金与美元表现", "DB06 全球周期与历史危机");
  if (/工业生产|失业|期限利差|信用利差|vix|股指|房地产|全球周期|滞胀|衰退|紧缩/.test(text)) push("global_cycle_month", "月份、工业生产、失业、CPI、利率、利差、美元、金融条件、市场回撤、周期标签", "DB06 全球周期与历史危机");
  if (!contracts.length) push("source_registry", "来源机构、标题、URL、许可、版本、抓取日期、哈希、用途与限制", "DB05 证据中心");
  const dedup = [...new Map(contracts.map((c) => [c.table, c])).values()];
  return {
    target_table: dedup.map((c) => c.table).join(" | "),
    required_fields: dedup.map((c) => `${c.table}: ${c.fields}`).join("；"),
    smartbi_page: [...new Set(dedup.map((c) => c.page))].join(" | "),
  };
}

function decodeHtml(buffer, contentType = "") {
  const head = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("ascii");
  const match = `${contentType} ${head}`.match(/charset\s*=\s*["']?([\w-]+)/i);
  const encoding = match?.[1]?.toLowerCase() || "utf-8";
  try { return iconv.decode(buffer, encoding); } catch { return buffer.toString("utf8"); }
}

function analyzeHtml(html, baseUrl = "") {
  const $ = cheerio.load(html);
  $("script,style,noscript,template").remove();
  const title = normalizeText($("title").first().text() || $("h1").first().text());
  const visible = normalizeText($("body").text());
  const tables = $("table").length;
  const iframes = $("iframe").length;
  const forms = $("form").length;
  const direct = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    let url;
    try { url = new URL(href, baseUrl || "file:///archive/"); } catch { return; }
    if (!/^https?:$/.test(url.protocol)) return;
    const ext = path.extname(url.pathname).toLowerCase();
    const anchor = normalizeText($(el).text());
    if (directExtensions.has(ext) || /下载|download|csv|excel|xlsx|xml|json|数据文件|全文|报告/i.test(anchor)) {
      direct.push({ url: url.href, extension: ext, anchor_text: anchor, locator: $(el).parents("table").length ? "table-link" : "anchor" });
    }
  });
  const uniqueDirect = [...new Map(direct.map((d) => [d.url, d])).values()];
  const blockMarker = blockPatterns.some((p) => p.test(html));
  const spaShell = /<div[^>]+id=["'](?:app|root)["'][^>]*>\s*<\/div>/i.test(html) && visible.length < 300;
  let content_state;
  if (visible.length < 120 && spaShell) content_state = "EMPTY_SHELL";
  else if (visible.length < 1200 && blockMarker) content_state = "BLOCK_PAGE";
  else if (visible.length < 300) content_state = "LOW_CONTENT";
  else if (tables > 0 && visible.length >= 2000) content_state = "MIXED_CONTENT";
  else if (tables > 0) content_state = "STRUCTURED_DATA";
  else if (uniqueDirect.length > 0 && visible.length < 2500) content_state = "DOWNLOAD_LANDING";
  else content_state = "NARRATIVE_CONTENT";
  return { $, title, visible, tables, iframes, forms, direct: uniqueDirect, content_state, blockMarker, spaShell };
}

function fetchEligibility(row, url, kind) {
  if (!url) return { allowed: false, reason: "NO_URL" };
  if (row.redistribution_scope === "metadata_only" || blockedStatuses.has(row.download_status)) return { allowed: false, reason: `LICENSE_OR_ACCESS_${row.download_status}` };
  let parsed;
  try { parsed = new URL(url); } catch { return { allowed: false, reason: "INVALID_URL" }; }
  if (!/^https?:$/.test(parsed.protocol)) return { allowed: false, reason: "NON_HTTP_URL" };
  if (/token=|access_token=|signature=|sig=|auth=/i.test(parsed.search)) return { allowed: false, reason: "POSSIBLE_SECRET_QUERY" };
  if (kind === "replacement" && !retryStatuses.has(row.download_status)) return { allowed: false, reason: "NOT_RETRY_STATUS" };
  return { allowed: true, reason: "PUBLIC_GET_NO_AUTH" };
}

function extensionFromType(type, fallbackUrl) {
  const t = String(type || "").toLowerCase();
  if (t.includes("pdf")) return ".pdf";
  if (t.includes("csv")) return ".csv";
  if (t.includes("vnd.ms-excel") && !t.includes("openxml")) return ".xls";
  if (t.includes("spreadsheet") || t.includes("excel")) return ".xlsx";
  if (t.includes("json")) return ".json";
  if (t.includes("xml")) return ".xml";
  if (t.includes("zip")) return ".zip";
  if (t.includes("html")) return ".html";
  try { return path.extname(new URL(fallbackUrl).pathname).toLowerCase() || ".bin"; } catch { return ".bin"; }
}

async function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function fileSha256(file) {
  const hash = crypto.createHash("sha256");
  return await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

function columnIndexFromRef(ref) {
  const letters = String(ref || "").match(/^[A-Z]+/i)?.[0]?.toUpperCase() || "A";
  let index = 0;
  for (const char of letters) index = index * 26 + char.charCodeAt(0) - 64;
  return Math.max(0, index - 1);
}

function columnLetters(index) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    n -= 1;
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}

async function listArchiveEntries(file) {
  const { stdout } = await execFile("tar", ["-tf", file], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  const entries = stdout.split(/\r?\n/).filter(Boolean);
  if (entries.length > 5000) throw new Error(`ARCHIVE_ENTRY_LIMIT:${entries.length}`);
  for (const entry of entries) {
    const normalized = entry.replaceAll("\\", "/");
    if (normalized.startsWith("/") || /^[A-Za-z]:\//.test(normalized) || normalized.split("/").includes("..")) throw new Error(`UNSAFE_ARCHIVE_PATH:${entry}`);
  }
  return entries;
}

async function extractArchive(file, destination) {
  const entries = await listArchiveEntries(file);
  await fsp.mkdir(destination, { recursive: true });
  await execFile("tar", ["-xf", file, "-C", destination], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  return entries;
}

async function inspectXlsx(file, assetId, resourceId) {
  const tempDir = path.join(archiveV11, "05_QA与运行记录", "working_xlsx", resourceId);
  await fsp.rm(tempDir, { recursive: true, force: true });
  await extractArchive(file, tempDir);
  const workbookFile = path.join(tempDir, "xl", "workbook.xml");
  const relFile = path.join(tempDir, "xl", "_rels", "workbook.xml.rels");
  if (!(await exists(workbookFile)) || !(await exists(relFile))) throw new Error("XLSX_WORKBOOK_XML_MISSING");
  const workbookXml = await fsp.readFile(workbookFile, "utf8");
  const relXml = await fsp.readFile(relFile, "utf8");
  const $wb = cheerio.load(workbookXml, { xmlMode: true });
  const $rel = cheerio.load(relXml, { xmlMode: true });
  const relMap = new Map();
  $rel("Relationship").each((_, el) => relMap.set($rel(el).attr("Id"), $rel(el).attr("Target")));
  let shared = [];
  const sharedFile = path.join(tempDir, "xl", "sharedStrings.xml");
  if (await exists(sharedFile)) {
    const $ss = cheerio.load(await fsp.readFile(sharedFile, "utf8"), { xmlMode: true });
    shared = $ss("si").map((_, el) => normalizeText($ss(el).find("t").map((__, t) => $ss(t).text()).get().join(""))).get();
  }
  const sheets = [];
  for (const sheet of $wb("sheet").toArray()) {
    const name = $wb(sheet).attr("name") || `sheet_${sheets.length + 1}`;
    const relId = $wb(sheet).attr("r:id") || $wb(sheet).attr("id");
    const target = relMap.get(relId);
    if (!target) continue;
    const worksheetFile = path.resolve(path.join(tempDir, "xl"), target.replaceAll("/", path.sep));
    if (!(await exists(worksheetFile))) continue;
    const xml = await fsp.readFile(worksheetFile, "utf8");
    const $ws = cheerio.load(xml, { xmlMode: true });
    const matrix = [];
    let maxCol = -1;
    $ws("sheetData row").each((_, rowEl) => {
      const rowNumber = Number($ws(rowEl).attr("r") || matrix.length + 1);
      const values = [];
      $ws(rowEl).find("c").each((__, cell) => {
        const ref = $ws(cell).attr("r") || "A1";
        const col = columnIndexFromRef(ref);
        maxCol = Math.max(maxCol, col);
        const type = $ws(cell).attr("t") || "n";
        let value = $ws(cell).find("v").first().text();
        if (type === "s") value = shared[Number(value)] ?? value;
        else if (type === "inlineStr") value = normalizeText($ws(cell).find("is t").map((___, t) => $ws(t).text()).get().join(""));
        else if (type === "b") value = value === "1" ? "TRUE" : "FALSE";
        values[col] = value;
      });
      matrix.push({ rowNumber, values });
    });
    const columns = ["excel_row", ...Array.from({ length: maxCol + 1 }, (_, i) => `col_${columnLetters(i)}`)];
    const rows = matrix.map((r) => Object.fromEntries(columns.map((c, i) => [c, i === 0 ? r.rowNumber : r.values[i - 1] ?? ""])));
    const outDir = path.join(archiveV11, "03_提取表格", assetId, resourceId);
    await fsp.mkdir(outDir, { recursive: true });
    const outFile = path.join(outDir, `${slug(name, 70)}.csv`);
    await fsp.writeFile(outFile, stringifyCsv(rows, { header: true, columns, bom: true, record_delimiter: "windows" }), "utf8");
    sheets.push({
      object_name: name,
      row_count: rows.length,
      column_count: columns.length - 1,
      output_path: path.relative(archiveV11, outFile).replaceAll("\\", "/"),
    });
  }
  await fsp.rm(tempDir, { recursive: true, force: true });
  return sheets;
}

async function inspectStructuredFile(file, assetId, resourceId) {
  const ext = path.extname(file).toLowerCase();
  const stat = await fsp.stat(file);
  const base = {
    parent_asset_id: assetId,
    resource_id: resourceId,
    source_file: path.relative(archiveV11, file).replaceAll("\\", "/"),
    source_extension: ext,
    source_size_bytes: stat.size,
    source_sha256: await fileSha256(file),
  };
  if (ext === ".xlsx") {
    const sheets = await inspectXlsx(file, assetId, resourceId);
    return sheets.map((s) => ({ ...base, object_type: "xlsx_sheet", ...s, extraction_state: "EXTRACTED", failure_reason: "" }));
  }
  if (ext === ".xls") return [{ ...base, object_type: "legacy_xls", object_name: "workbook", row_count: "", column_count: "", output_path: "", extraction_state: "MANUAL_CONVERSION_REQUIRED", failure_reason: "旧二进制XLS已校验并保存；为避免高危依赖，本轮不自动解析。" }];
  if (ext === ".csv" || ext === ".txt") {
    const text = await fsp.readFile(file, "utf8");
    const lines = text.split(/\r?\n/).filter((x) => x.length > 0);
    const columns = lines.length ? parseCsv(lines[0], { relax_quotes: true, relax_column_count: true })[0]?.length || 1 : 0;
    return [{ ...base, object_type: ext === ".csv" ? "csv" : "text", object_name: path.basename(file), row_count: Math.max(0, lines.length - (ext === ".csv" ? 1 : 0)), column_count: columns, output_path: base.source_file, extraction_state: "INSPECTED", failure_reason: "" }];
  }
  if (ext === ".xml") {
    const xml = await fsp.readFile(file, "utf8");
    const $ = cheerio.load(xml, { xmlMode: true });
    const root = $.root().children().first().prop("tagName") || "unknown";
    return [{ ...base, object_type: "xml", object_name: root, row_count: $("*").length, column_count: "", output_path: base.source_file, extraction_state: "INSPECTED", failure_reason: "" }];
  }
  if (ext === ".json") {
    const data = JSON.parse(await fsp.readFile(file, "utf8"));
    const rows = Array.isArray(data) ? data.length : 1;
    const cols = Array.isArray(data) && data[0] && typeof data[0] === "object" ? Object.keys(data[0]).length : data && typeof data === "object" ? Object.keys(data).length : 1;
    return [{ ...base, object_type: "json", object_name: path.basename(file), row_count: rows, column_count: cols, output_path: base.source_file, extraction_state: "INSPECTED", failure_reason: "" }];
  }
  if (ext === ".html") {
    const html = decodeHtml(await fsp.readFile(file));
    const audit = analyzeHtml(html);
    return [{ ...base, object_type: "html_response", object_name: audit.title, row_count: audit.tables, column_count: "", output_path: base.source_file, extraction_state: ["BLOCK_PAGE", "EMPTY_SHELL"].includes(audit.content_state) ? "FAILED" : "SUPPLEMENT_ONLY", failure_reason: audit.content_state }];
  }
  return [{ ...base, object_type: "binary_or_document", object_name: path.basename(file), row_count: "", column_count: "", output_path: base.source_file, extraction_state: "INSPECTED", failure_reason: "" }];
}

export async function inspectDownloadedResources() {
  const downloads = await readCsv(downloadPath);
  const inventory = [];
  for (const download of downloads.filter((r) => r.acquisition_state === "ACQUIRED" && r.local_path_v11)) {
    const source = path.join(archiveV11, download.local_path_v11.replaceAll("/", path.sep));
    const ext = path.extname(source).toLowerCase();
    try {
      if (ext === ".zip") {
        const dest = path.join(path.dirname(source), "expanded", download.resource_id);
        await fsp.rm(dest, { recursive: true, force: true });
        const entries = await extractArchive(source, dest);
        let total = 0;
        const files = [];
        const stack = [dest];
        while (stack.length) {
          const current = stack.pop();
          for (const entry of await fsp.readdir(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) stack.push(full);
            else if (entry.isFile()) { files.push(full); total += (await fsp.stat(full)).size; }
          }
        }
        if (total > 500 * 1024 * 1024) throw new Error(`UNCOMPRESSED_SIZE_LIMIT:${total}`);
        inventory.push({ parent_asset_id: download.parent_asset_id, resource_id: download.resource_id, source_file: download.local_path_v11, source_extension: ".zip", source_size_bytes: download.size_bytes, source_sha256: download.sha256, object_type: "zip_archive", object_name: `${entries.length} entries`, row_count: files.length, column_count: "", output_path: path.relative(archiveV11, dest).replaceAll("\\", "/"), extraction_state: "EXPANDED", failure_reason: "" });
        for (let i = 0; i < files.length; i += 1) {
          const nestedExt = path.extname(files[i]).toLowerCase();
          if (![".xlsx", ".xls", ".csv", ".txt", ".xml", ".json"].includes(nestedExt)) continue;
          inventory.push(...await inspectStructuredFile(files[i], download.parent_asset_id, `${download.resource_id}-E${String(i + 1).padStart(3, "0")}`));
        }
      } else {
        inventory.push(...await inspectStructuredFile(source, download.parent_asset_id, download.resource_id));
      }
    } catch (error) {
      inventory.push({ parent_asset_id: download.parent_asset_id, resource_id: download.resource_id, source_file: download.local_path_v11, source_extension: ext, source_size_bytes: download.size_bytes, source_sha256: download.sha256, object_type: "inspection_error", object_name: path.basename(source), row_count: "", column_count: "", output_path: "", extraction_state: "FAILED", failure_reason: error.message });
    }
  }
  const columns = Object.keys(inventory[0] || { parent_asset_id: "", resource_id: "", source_file: "", source_extension: "", source_size_bytes: "", source_sha256: "", object_type: "", object_name: "", row_count: "", column_count: "", output_path: "", extraction_state: "", failure_reason: "" });
  await writeCsv(path.join(archiveV11, "05_QA与运行记录", "structured_resource_inventory_V1.1.csv"), inventory, columns);
  await writeJson(path.join(archiveV11, "05_QA与运行记录", "structured_resource_inventory_summary_V1.1.json"), {
    inspected_resources: new Set(inventory.map((r) => r.resource_id.split("-E")[0])).size,
    inventory_rows: inventory.length,
    extracted_or_inspected: inventory.filter((r) => ["EXTRACTED", "INSPECTED", "EXPANDED"].includes(r.extraction_state)).length,
    manual_conversion_required: inventory.filter((r) => r.extraction_state === "MANUAL_CONVERSION_REQUIRED").length,
    failed: inventory.filter((r) => r.extraction_state === "FAILED").length,
  });
  return inventory;
}

function validateBytes(buffer, ext, contentType) {
  const head = buffer.subarray(0, 16).toString("latin1");
  if (ext === ".pdf" && !head.startsWith("%PDF-")) return "PDF_SIGNATURE_MISMATCH";
  if ([".zip", ".xlsx"].includes(ext) && !head.startsWith("PK")) return "ZIP_SIGNATURE_MISMATCH";
  if (ext === ".xls" && !buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) return "XLS_SIGNATURE_MISMATCH";
  if (ext === ".html") {
    const html = decodeHtml(buffer, contentType);
    const audit = analyzeHtml(html);
    if (["BLOCK_PAGE", "EMPTY_SHELL"].includes(audit.content_state)) return audit.content_state;
  }
  return "PASS";
}

export async function importManifest() {
  await ensureDirs();
  const rows = await readCsv(manifestPath);
  if (rows.length !== 688) throw new Error(`V1.0清单行数应为688，实际${rows.length}`);
  await writeJson(path.join(archiveV11, "05_QA与运行记录", "manifest_import_summary.json"), {
    run_id: runId,
    imported_at: new Date().toISOString(),
    source_manifest: path.relative(projectRoot, manifestPath).replaceAll("\\", "/"),
    source_manifest_sha256: await fileSha256(manifestPath),
    row_count: rows.length,
    unique_asset_ids: new Set(rows.map((r) => r.asset_id)).size,
  });
  return rows;
}

export async function auditWebAssets(manifest = null) {
  manifest ||= await importManifest();
  const rows = [];
  const candidates = [];
  for (const row of manifest) {
    if (String(row.extension).toLowerCase() !== ".html") continue;
    const local = absoluteV10Local(row);
    const found = local && await exists(local);
    let audit = { title: "", visible: "", tables: 0, iframes: 0, forms: 0, direct: [], content_state: found ? "UNREADABLE" : "NOT_ACQUIRED", blockMarker: false, spaShell: false };
    let read_error = "";
    if (found) {
      try {
        const buffer = await fsp.readFile(local);
        const html = decodeHtml(buffer, row.mime_type);
        audit = analyzeHtml(html, row.final_url || row.canonical_url || row.original_url);
      } catch (error) { read_error = error.message; }
    }
    let extraction_state = "PENDING";
    if (!found) extraction_state = "FAILED";
    else if (["BLOCK_PAGE", "EMPTY_SHELL"].includes(audit.content_state)) extraction_state = "FAILED";
    else if (audit.content_state === "LOW_CONTENT") extraction_state = "PARTIAL";
    const record = {
      asset_id: row.asset_id,
      old_download_status: row.download_status,
      evidence_grade: row.evidence_grade,
      redistribution_scope: row.redistribution_scope,
      local_path_v10: row.local_path,
      source_url: row.final_url || row.canonical_url || row.original_url,
      file_exists: found ? "1" : "0",
      file_size_bytes: found ? (await fsp.stat(local)).size : "",
      title_extracted: audit.title,
      visible_characters: audit.visible.length,
      table_count: audit.tables,
      direct_resource_count: audit.direct.length,
      iframe_count: audit.iframes,
      form_count: audit.forms,
      block_marker: audit.blockMarker ? "1" : "0",
      spa_shell_marker: audit.spaShell ? "1" : "0",
      acquisition_state: found ? "ACQUIRED" : "NOT_ACQUIRED",
      content_state: audit.content_state,
      extraction_state,
      read_error,
    };
    rows.push(record);
    for (const candidate of audit.direct) {
      const eligibility = fetchEligibility(row, candidate.url, "linked_resource");
      candidates.push({
        parent_asset_id: row.asset_id,
        candidate_type: "LINKED_RESOURCE",
        url: candidate.url,
        extension_hint: candidate.extension,
        anchor_text: candidate.anchor_text,
        source_locator: candidate.locator,
        fetch_allowed: eligibility.allowed ? "1" : "0",
        fetch_decision_reason: eligibility.reason,
        redistribution_scope: row.redistribution_scope,
      });
    }
  }
  for (const row of manifest.filter((r) => retryStatuses.has(r.download_status))) {
    for (const url of extractUrls(row.replacement_source)) {
      const eligibility = fetchEligibility(row, url, "replacement");
      candidates.push({
        parent_asset_id: row.asset_id,
        candidate_type: "REPLACEMENT_SOURCE",
        url,
        extension_hint: path.extname(new URL(url).pathname).toLowerCase(),
        anchor_text: "V1.0 replacement_source",
        source_locator: "replacement_source",
        fetch_allowed: eligibility.allowed ? "1" : "0",
        fetch_decision_reason: eligibility.reason,
        redistribution_scope: row.redistribution_scope,
      });
    }
  }
  const auditColumns = Object.keys(rows[0] || {});
  const candidateColumns = Object.keys(candidates[0] || { parent_asset_id: "", candidate_type: "", url: "", extension_hint: "", anchor_text: "", source_locator: "", fetch_allowed: "", fetch_decision_reason: "", redistribution_scope: "" });
  await writeCsv(auditPath, rows, auditColumns);
  await writeCsv(candidatePath, candidates, candidateColumns);
  await writeJson(path.join(archiveV11, "05_QA与运行记录", "web_asset_audit_summary_V1.1.json"), {
    run_id: runId,
    audited_html: rows.length,
    file_exists: rows.filter((r) => r.file_exists === "1").length,
    content_state_counts: Object.fromEntries([...new Set(rows.map((r) => r.content_state))].sort().map((state) => [state, rows.filter((r) => r.content_state === state).length])),
    candidates: candidates.length,
    fetchable_candidates: candidates.filter((c) => c.fetch_allowed === "1").length,
  });
  return { rows, candidates };
}

export async function discoverOfficialResources() {
  const candidates = await readCsv(candidatePath);
  const dedup = [...new Map(candidates.map((r) => [r.url, r])).values()];
  await writeCsv(path.join(archiveV11, "05_QA与运行记录", "resource_candidates_deduplicated_V1.1.csv"), dedup, Object.keys(dedup[0] || {}));
  return dedup;
}

export async function fetchRegisteredResources(manifest = null) {
  manifest ||= await importManifest();
  const candidates = await discoverOfficialResources();
  const byAsset = new Map(manifest.map((r) => [r.asset_id, r]));
  const scored = candidates.filter((c) => c.fetch_allowed === "1").map((c) => {
    const ext = String(c.extension_hint || "").toLowerCase();
    const label = `${c.anchor_text || ""} ${c.url || ""}`;
    let score = 0;
    if (c.candidate_type === "REPLACEMENT_SOURCE") score += 100;
    if (/[_?&]format=csv|downloadformat=csv|\.csv(?:$|\?)/i.test(c.url)) score += 95;
    if ([".csv", ".xlsx", ".xls", ".json", ".xml", ".zip"].includes(ext)) score += 85;
    if (/\b(csv|excel|xlsx|xml|json|zip)\b|月度数据|历史数据|data file/i.test(label)) score += 70;
    if (ext === ".txt") score += 45;
    if (ext === ".pdf") score += /数据|报告|全文|current|fact sheet/i.test(label) ? 30 : 10;
    if (/download|下载/i.test(c.anchor_text || "")) score += 20;
    return { ...c, selection_score: score };
  });
  const selected = scored.filter((c) => c.selection_score >= 45).sort((a, b) => b.selection_score - a.selection_score || a.url.localeCompare(b.url));
  const perAsset = new Map();
  const limited = [];
  for (const item of selected) {
    const count = perAsset.get(item.parent_asset_id) || 0;
    if (count >= 3) continue;
    perAsset.set(item.parent_asset_id, count + 1);
    limited.push(item);
  }
  await writeCsv(path.join(archiveV11, "05_QA与运行记录", "selected_resource_fetch_plan_V1.1.csv"), limited, Object.keys(limited[0] || {}));
  const results = [];
  let lastHost = "";
  let lastRequest = 0;
  for (let i = 0; i < limited.length; i += 1) {
    const item = limited[i];
    const row = byAsset.get(item.parent_asset_id);
    const started = new Date().toISOString();
    let result = {
      resource_id: `${item.parent_asset_id}-R${String((results.filter((r) => r.parent_asset_id === item.parent_asset_id).length + 1)).padStart(2, "0")}`,
      parent_asset_id: item.parent_asset_id,
      candidate_type: item.candidate_type,
      requested_url: item.url,
      final_url: "",
      http_status: "",
      content_type: "",
      size_bytes: "",
      sha256: "",
      validation_state: "",
      acquisition_state: "NOT_ACQUIRED",
      local_path_v11: "",
      request_started_at: started,
      response_headers_safe: "",
      failure_reason: "",
    };
    try {
      const host = new URL(item.url).host;
      const wait = host === lastHost ? Math.max(0, 500 - (Date.now() - lastRequest)) : 0;
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
      lastHost = host;
      lastRequest = Date.now();
      const response = await fetch(item.url, {
        redirect: "follow",
        headers: { "User-Agent": "XH-202612-research-archive/1.1 (public evidence preservation; no authentication)" },
        signal: AbortSignal.timeout(30000),
      });
      result.http_status = String(response.status);
      result.final_url = response.url;
      result.content_type = response.headers.get("content-type") || "";
      result.response_headers_safe = JSON.stringify({
        date: response.headers.get("date") || "",
        content_type: result.content_type,
        content_length: response.headers.get("content-length") || "",
        last_modified: response.headers.get("last-modified") || "",
        etag: response.headers.get("etag") || "",
        content_disposition: response.headers.get("content-disposition") || "",
        cache_control: response.headers.get("cache-control") || "",
      });
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const declared = Number(response.headers.get("content-length") || 0);
      if (declared > 50 * 1024 * 1024) throw new Error("DECLARED_SIZE_EXCEEDS_50MB");
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > 50 * 1024 * 1024) throw new Error("ACTUAL_SIZE_EXCEEDS_50MB");
      const ext = extensionFromType(result.content_type, response.url);
      const requestedHint = String(item.extension_hint || "").toLowerCase();
      const requestedStructured = [".csv", ".xlsx", ".xls", ".json", ".xml", ".zip", ".pdf", ".txt"].includes(requestedHint)
        || /\b(csv|excel|xlsx|xml|json|zip)\b/i.test(item.anchor_text || "");
      if (requestedStructured && ext === ".html") throw new Error("UNEXPECTED_HTML_INSTEAD_OF_STRUCTURED_RESOURCE");
      result.size_bytes = String(buffer.length);
      result.sha256 = await sha256Buffer(buffer);
      result.validation_state = validateBytes(buffer, ext, result.content_type);
      if (result.validation_state !== "PASS") throw new Error(`CONTENT_${result.validation_state}`);
      const destDir = path.join(archiveV11, item.candidate_type === "REPLACEMENT_SOURCE" ? "04_替代来源" : "01_新增原件", item.parent_asset_id);
      await fsp.mkdir(destDir, { recursive: true });
      const dest = path.join(destDir, `${result.resource_id}_${slug(path.basename(new URL(response.url).pathname) || "resource")}${ext && !path.basename(new URL(response.url).pathname).toLowerCase().endsWith(ext) ? ext : ""}`);
      await fsp.writeFile(dest, buffer);
      result.local_path_v11 = path.relative(archiveV11, dest).replaceAll("\\", "/");
      result.acquisition_state = "ACQUIRED";
    } catch (error) {
      result.failure_reason = error.message;
      if (!result.validation_state) result.validation_state = "FAILED";
    }
    results.push(result);
    process.stdout.write(`fetch ${i + 1}/${limited.length} ${result.parent_asset_id} ${result.acquisition_state}\n`);
  }
  const cols = Object.keys(results[0] || { resource_id: "", parent_asset_id: "", candidate_type: "", requested_url: "", final_url: "", http_status: "", content_type: "", size_bytes: "", sha256: "", validation_state: "", acquisition_state: "", local_path_v11: "", request_started_at: "", response_headers_safe: "", failure_reason: "" });
  await writeCsv(downloadPath, results, cols);
  return results;
}

function tableToRows($, table) {
  const matrix = [];
  $(table).find("tr").each((_, tr) => {
    const cells = [];
    $(tr).find("th,td").each((__, td) => cells.push(normalizeText($(td).text())));
    if (cells.some(Boolean)) matrix.push(cells);
  });
  if (!matrix.length) return { headers: [], rows: [] };
  const width = Math.max(...matrix.map((r) => r.length));
  const first = matrix[0];
  const hasHeader = $(table).find("tr").first().find("th").length > 0;
  const headers = Array.from({ length: width }, (_, i) => slug(hasHeader ? first[i] || `column_${i + 1}` : `column_${i + 1}`, 60));
  const dataRows = (hasHeader ? matrix.slice(1) : matrix).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
  return { headers, rows: dataRows };
}

export async function extractHtmlContent(manifest = null) {
  manifest ||= await importManifest();
  await fsp.writeFile(extractionPath, "", "utf8");
  const audits = await readCsv(auditPath);
  const auditMap = new Map(audits.map((r) => [r.asset_id, r]));
  const extractionSummary = [];
  const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });
  for (const row of manifest.filter((r) => String(r.extension).toLowerCase() === ".html")) {
    const audit = auditMap.get(row.asset_id);
    const local = absoluteV10Local(row);
    let state = "FAILED";
    let tableFiles = 0;
    let tableRows = 0;
    let paragraphCount = 0;
    let outputText = "";
    let error = "";
    const tableDir = path.join(archiveV11, "03_提取表格", row.asset_id);
    const textDir = path.join(archiveV11, "02_提取正文", row.asset_id);
    await fsp.rm(tableDir, { recursive: true, force: true });
    await fsp.rm(textDir, { recursive: true, force: true });
    if (audit?.file_exists === "1" && !["BLOCK_PAGE", "EMPTY_SHELL"].includes(audit.content_state)) {
      try {
        const html = decodeHtml(await fsp.readFile(local), row.mime_type);
        const analysis = analyzeHtml(html, row.final_url || row.canonical_url || row.original_url);
        const records = [];
        if (analysis.tables > 0) {
          await fsp.mkdir(tableDir, { recursive: true });
          analysis.$("table").each((index, table) => {
            const parsed = tableToRows(analysis.$, table);
            if (!parsed.rows.length) return;
            const file = path.join(tableDir, `table_${String(index + 1).padStart(2, "0")}.csv`);
            fs.writeFileSync(file, stringifyCsv(parsed.rows, { header: true, columns: parsed.headers, bom: true, record_delimiter: "windows" }), "utf8");
            tableFiles += 1;
            tableRows += parsed.rows.length;
            for (let rowIndex = 0; rowIndex < parsed.rows.length; rowIndex += 1) records.push({
              source_id: row.asset_id,
              content_object_id: `${row.asset_id}-T${String(index + 1).padStart(2, "0")}-R${String(rowIndex + 1).padStart(5, "0")}`,
              source_locator: `html:table[${index + 1}]/row[${rowIndex + 1}]`,
              field_code: "html_table_row",
              raw_value: JSON.stringify(parsed.rows[rowIndex]),
              parsed_value: JSON.stringify(parsed.rows[rowIndex]),
              unit: "",
              period: "",
              geography: row.geography || "",
              publication_date: row.publication_date || "",
              available_at: row.publication_date || row.access_date || "",
              extraction_method: "cheerio_html_table",
              confidence: "0.90",
              reviewer: "PENDING_HUMAN_REVIEW",
              review_status: "PENDING",
              target_table: targetContract(row).target_table,
            });
          });
        }
        const dom = new JSDOM(html, { url: row.final_url || row.canonical_url || row.original_url || "https://archive.invalid/" });
        const article = new Readability(dom.window.document).parse();
        const mainHtml = article?.content || analysis.$("main,article").first().html() || analysis.$("body").html() || "";
        const mainText = normalizeText(article?.textContent || analysis.visible);
        const paragraphs = mainText.split(/\n+/).map(normalizeText).filter((p) => p.length >= 20);
        paragraphCount = paragraphs.length;
        const narrative = {
          source_id: row.asset_id,
          title: article?.title || analysis.title || row.title,
          publisher: row.publisher,
          publication_date: row.publication_date,
          source_url: row.final_url || row.canonical_url || row.original_url,
          extracted_at: new Date().toISOString(),
          content_state: analysis.content_state,
          paragraph_count: paragraphs.length,
          table_count: tableFiles,
          paragraphs: paragraphs.map((text, i) => ({ locator: `html:paragraph[${i + 1}]`, text })),
          outgoing_data_links: analysis.direct,
        };
        await fsp.mkdir(textDir, { recursive: true });
        outputText = path.join(textDir, "content.json");
        await writeJson(outputText, narrative);
        const markdown = `# ${narrative.title}\n\n- 来源：${narrative.source_url || "本地历史文件"}\n- 发布机构：${row.publisher || "未标明"}\n- 原归档资产：${row.asset_id}\n- 内容状态：${analysis.content_state}\n- 提取时间：${narrative.extracted_at}\n\n${turndown.turndown(mainHtml)}\n`;
        await fsp.writeFile(path.join(textDir, "content.md"), markdown, "utf8");
        paragraphs.forEach((text, i) => records.push({
          source_id: row.asset_id,
          content_object_id: `${row.asset_id}-P${String(i + 1).padStart(5, "0")}`,
          source_locator: `html:paragraph[${i + 1}]`,
          field_code: "narrative_paragraph",
          raw_value: text,
          parsed_value: text,
          unit: "",
          period: "",
          geography: row.geography || "",
          publication_date: row.publication_date || "",
          available_at: row.publication_date || row.access_date || "",
          extraction_method: article ? "readability" : "body_text_fallback",
          confidence: article ? "0.85" : "0.70",
          reviewer: "PENDING_HUMAN_REVIEW",
          review_status: "PENDING",
          target_table: targetContract(row).target_table,
        }));
        await appendJsonl(extractionPath, records);
        state = audit.content_state === "LOW_CONTENT" ? "PARTIAL" : "EXTRACTED";
      } catch (e) { error = e.message; }
    } else {
      error = audit?.content_state || "LOCAL_FILE_MISSING";
    }
    extractionSummary.push({
      asset_id: row.asset_id,
      content_state: audit?.content_state || "NOT_AUDITED",
      extraction_state: state,
      table_files: tableFiles,
      table_rows: tableRows,
      paragraph_count: paragraphCount,
      narrative_output: outputText ? path.relative(archiveV11, outputText).replaceAll("\\", "/") : "",
      failure_reason: error,
    });
  }
  await writeCsv(path.join(archiveV11, "05_QA与运行记录", "html_extraction_summary_V1.1.csv"), extractionSummary, Object.keys(extractionSummary[0] || {}));
  return extractionSummary;
}

function formalUse(row, audit, downloads) {
  if (["WEB-0335", "WEB-0336"].includes(row.asset_id)) return "REPLACED";
  if (row.duplicate_of_asset_id) return "REPLACED";
  if (row.download_status === "EXCLUDED_SECRET" || row.redistribution_scope === "metadata_only") return "EXCLUDED";
  if (retryStatuses.has(row.download_status) && downloads.some((d) => d.acquisition_state === "ACQUIRED")) return grade(row) === "A" ? "CORE" : "SUPPLEMENT";
  if (audit && ["BLOCK_PAGE", "EMPTY_SHELL", "LOW_CONTENT"].includes(audit.content_state)) return row.replacement_source ? "REPLACED" : "EXCLUDED";
  if (grade(row) === "A") return "CORE";
  if (["B", "C", "INTERNAL"].includes(grade(row))) return "SUPPLEMENT";
  return "EXCLUDED";
}

export async function buildActionRegistry(manifest = null) {
  manifest ||= await importManifest();
  const audits = await readCsv(auditPath);
  const auditMap = new Map(audits.map((r) => [r.asset_id, r]));
  const extractions = await readCsv(path.join(archiveV11, "05_QA与运行记录", "html_extraction_summary_V1.1.csv"));
  const extractionMap = new Map(extractions.map((r) => [r.asset_id, r]));
  const downloads = await readCsv(downloadPath);
  const structured = await readCsv(path.join(archiveV11, "05_QA与运行记录", "structured_resource_inventory_V1.1.csv"));
  const downloadsByAsset = new Map();
  for (const d of downloads) {
    if (!downloadsByAsset.has(d.parent_asset_id)) downloadsByAsset.set(d.parent_asset_id, []);
    downloadsByAsset.get(d.parent_asset_id).push(d);
  }
  const structuredByAsset = new Map();
  for (const item of structured) {
    if (!structuredByAsset.has(item.parent_asset_id)) structuredByAsset.set(item.parent_asset_id, []);
    structuredByAsset.get(item.parent_asset_id).push(item);
  }
  const registry = manifest.map((row) => {
    const audit = auditMap.get(row.asset_id);
    const extracted = extractionMap.get(row.asset_id);
    const downloadRows = downloadsByAsset.get(row.asset_id) || [];
    const structuredRows = structuredByAsset.get(row.asset_id) || [];
    const contract = targetContract(row);
    const local = absoluteV10Local(row);
    const localExists = row.local_path && fs.existsSync(local);
    let acquisition = localExists ? "ACQUIRED" : downloadRows.some((d) => d.acquisition_state === "ACQUIRED") ? "ACQUIRED" : blockedStatuses.has(row.download_status) ? "NOT_APPLICABLE" : "NOT_ACQUIRED";
    const content = audit?.content_state || (localExists ? (row.extension === ".pdf" ? "DOCUMENT_LOCAL" : row.extension === ".xlsx" || row.extension === ".csv" ? "STRUCTURED_LOCAL" : "LOCAL_ASSET") : "NOT_ACQUIRED");
    const extraction = extracted?.extraction_state || (structuredRows.some((s) => ["EXTRACTED", "INSPECTED", "EXPANDED"].includes(s.extraction_state)) ? "EXTRACTED" : localExists ? "NOT_REQUIRED" : "FAILED");
    const formal = formalUse(row, audit, downloadRows);
    const outputs = [extracted?.narrative_output || "", ...downloadRows.filter((d) => d.local_path_v11).map((d) => d.local_path_v11), ...structuredRows.filter((s) => s.output_path).map((s) => s.output_path)].filter(Boolean).join(" | ");
    const preferred = downloadRows.find((d) => d.final_url)?.final_url || row.final_url || row.canonical_url || row.original_url;
    let failure = extracted?.failure_reason || downloadRows.filter((d) => d.failure_reason).map((d) => d.failure_reason).join(" | ") || row.missing_reason || "";
    let nextAction;
    if (formal === "CORE" && acquisition === "ACQUIRED") nextAction = "人工复核关键字段与source_locator；通过后映射至正式source_registry。";
    else if (formal === "SUPPLEMENT" && acquisition === "ACQUIRED") nextAction = "按项目用途复核；不足以单独支持核心结论。";
    else if (formal === "REPLACED") nextAction = row.asset_id === "WEB-0335" || row.asset_id === "WEB-0336" ? "使用WEB-0115官方开放PDF，不再使用拦截页。" : `使用替代来源：${row.replacement_source || row.duplicate_of_asset_id}`;
    else if (row.download_status === "PAYWALL_OR_AUTH") nextAction = "由资料负责人合法登录、采购或申请授权；不得自动绕过。";
    else if (row.download_status === "MANUAL_ACTION_REQUIRED") nextAction = "按人工任务卡接受条款或完成机构授权后重新验收。";
    else if (row.redistribution_scope === "metadata_only") nextAction = "仅保留元数据；正式分析改用许可允许的权威替代源。";
    else nextAction = "补充权威替代来源；无法取得时删除相应字段和结论承诺。";
    return {
      asset_id: row.asset_id,
      archive_run_id_v10: "20260816_research_archive_v1",
      old_download_status: row.download_status,
      title: row.title,
      publisher: row.publisher,
      category: row.category,
      evidence_grade: row.evidence_grade,
      redistribution_scope: row.redistribution_scope,
      content_type: content,
      required_fields: contract.required_fields,
      data_usage: row.purpose || row.supported_claim,
      preferred_endpoint: preferred,
      request_parameters: "公开GET；具体API查询参数在正式source_registry冻结；禁止认证信息落盘。",
      extraction_method: row.extension === ".html" ? "HTML表格: cheerio；正文: Readability+Markdown；动态页: 公开API/人工任务卡" : row.extension === ".pdf" ? "pdftotext/OCR候选+页码双人复核" : [".xlsx", ".csv"].includes(row.extension) ? "表头、工作表、单位、日期、主键和来源字段解析" : "按MIME与用途读取",
      raw_local_path: row.local_path,
      extracted_local_path: outputs,
      target_table: contract.target_table,
      smartbi_page: contract.smartbi_page,
      acceptance_rule: `取得状态、内容可用性、提取状态和正式用途四态齐全；${formal === "CORE" ? "核心数字须A级或双B级并有人审。" : "不得单独支撑核心结论。"}`,
      replacement_source: row.asset_id === "WEB-0335" || row.asset_id === "WEB-0336" ? "WEB-0115" : row.replacement_source || row.duplicate_of_asset_id,
      acquisition_state: acquisition,
      content_state: content,
      extraction_state: extraction,
      formal_use_state: formal,
      failure_reason: failure,
      owner: /企业/.test(row.category) ? "D" : /案例|合规/.test(row.category) ? "A/D" : "B",
      next_action: nextAction,
      final_status: `${acquisition}|${content}|${extraction}|${formal}`,
      reviewed_at: new Date().toISOString(),
    };
  });
  if (registry.length !== 688 || new Set(registry.map((r) => r.asset_id)).size !== 688) throw new Error("动作清单未闭包到688个唯一asset_id");
  await writeCsv(registryCsvPath, registry, Object.keys(registry[0]));
  await fsp.writeFile(registryJsonlPath, registry.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
  const htmlSourceMatrix = registry.filter((r) => String(manifest.find((m) => m.asset_id === r.asset_id)?.extension).toLowerCase() === ".html");
  const htmlLocalMatrix = htmlSourceMatrix.filter((r) => Boolean(manifest.find((m) => m.asset_id === r.asset_id)?.local_path));
  await writeCsv(path.join(archiveV11, "00_交接入口", "HTML本地文件逐项处理矩阵_159项_V1.1.csv"), htmlLocalMatrix, Object.keys(registry[0]));
  await writeCsv(path.join(archiveV11, "00_交接入口", "HTML来源记录逐项处理矩阵_196项_V1.1.csv"), htmlSourceMatrix, Object.keys(registry[0]));
  const terminal = registry.filter((r) => ["EXCLUDED", "REPLACED"].includes(r.formal_use_state) || r.acquisition_state !== "ACQUIRED");
  await writeCsv(path.join(archiveV11, "06_人工任务卡", "缺失受限替代与人工动作_V1.1.csv"), terminal, Object.keys(registry[0]));
  const counts = (field) => Object.fromEntries([...new Set(registry.map((r) => r[field]))].sort().map((v) => [v, registry.filter((r) => r[field] === v).length]));
  await writeJson(path.join(archiveV11, "05_QA与运行记录", "registry_closure_V1.1.json"), {
    run_id: runId,
    as_of: asOf,
    status: "CLOSED_WITH_EXPLICIT_GAPS",
    total: registry.length,
    unique_asset_ids: new Set(registry.map((r) => r.asset_id)).size,
    acquisition_state: counts("acquisition_state"),
    content_state: counts("content_state"),
    extraction_state: counts("extraction_state"),
    formal_use_state: counts("formal_use_state"),
    html_local_file_count: htmlLocalMatrix.length,
    html_source_record_count: htmlSourceMatrix.length,
    actionable_gap_count: terminal.length,
  });
  return registry;
}

export async function generateHandoff(registry = null) {
  registry ||= await buildActionRegistry();
  const closure = JSON.parse(await fsp.readFile(path.join(archiveV11, "05_QA与运行记录", "registry_closure_V1.1.json"), "utf8"));
  const htmlAudit = JSON.parse(await fsp.readFile(path.join(archiveV11, "05_QA与运行记录", "web_asset_audit_summary_V1.1.json"), "utf8"));
  const downloads = await readCsv(downloadPath);
  const downloadSummary = {
    attempted: downloads.length,
    acquired: downloads.filter((r) => r.acquisition_state === "ACQUIRED").length,
    failed: downloads.filter((r) => r.acquisition_state !== "ACQUIRED").length,
  };
  const context = {
    context_version: "V4.2/V1.1",
    as_of: asOf,
    run_id: runId,
    project_name: "全球经济周期与亚非拉国别风险多币种储备智能决策平台",
    authoritative_plan: "计划书/07_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.2.pdf",
    archive_v10_immutable: true,
    archive_v11_type: "incremental_usability_layer",
    actual_state: {
      source_registry_closed: closure,
      html_audit: htmlAudit,
      new_downloads: downloadSummary,
      completed: ["688项四态动作闭包", "159个HTML内容审计", "可用HTML正文与表格提取", "开放候选原件补取", "V1.0到V1.1映射"],
      not_completed: ["130国正式主表", "40国正式面板", "20家企业正式库", "模型", "Smartbi写入与看板", "AIChat和XML恢复"],
    },
    read_order: [
      "00_当前项目交接_V4.2/README_先读我.md",
      "00_当前项目交接_V4.2/AI_CONTEXT_V4.2.json",
      "调研资料归档_V1.1/00_交接入口/source_action_registry_V1.1.jsonl",
      "计划书/07_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.2.pdf",
      "调研资料归档_V1.0/00_交接入口/研究资料总清单.jsonl"
    ],
    do_not_claim: [
      "HTTP 200或文件存在等同于内容可用",
      "所有受限全文均已取得",
      "HTML表格和正文自动提取已经人工核验",
      "正式130国、40国、20家企业数据已经建成",
      "模型、Smartbi、AIChat或XML已经完成"
    ]
  };
  await writeJson(path.join(archiveV11, "00_交接入口", "AI_CONTEXT_V1.1.json"), context);
  const readme = `# 调研资料归档 V1.1：网页数据可用化增量包\n\n本目录不替代、也不修改 V1.0。它把 V1.0 的688项来源拆分为“取得、内容、提取、正式用途”四种状态，并保存新增开放原件、HTML正文、HTML表格、失败原因和替代路线。\n\n## 十分钟读取顺序\n\n1. 读取 \`00_交接入口/AI_CONTEXT_V1.1.json\`；\n2. 用 \`source_action_registry_V1.1.jsonl\` 按 \`asset_id\` 查找动作和用途；\n3. 对本地159个HTML查看 \`HTML本地文件逐项处理矩阵_159项_V1.1.csv\`；全部196条HTML型来源查看另一张矩阵；\n4. 需要正文或表格时进入 \`02_提取正文\`、\`03_提取表格\`；\n5. 受限与失败项进入 \`06_人工任务卡\`，不得绕过登录或许可。\n\n## 真实边界\n\n- 688项均有唯一动作终态；这不表示688项全文均可合法下载。\n- 自动提取结果是后续人工复核的候选，不替代页码、单位、统计口径和关键数字复核。\n- V1.0始终是原始归档快照；V1.1只保存新增、替代和提取层。\n`;
  await fsp.writeFile(path.join(archiveV11, "00_交接入口", "README_资料可用化增量包.md"), readme, "utf8");
  await writeJson(statePath, {
    run_id: runId,
    completed_at: new Date().toISOString(),
    status: "COMPLETE_WITH_EXPLICIT_GAPS",
    phases: ["import", "audit", "discover", "fetch", "extract", "registry", "handoff"],
    closure,
    download_summary: downloadSummary,
  });
  return context;
}

export async function runAll() {
  await ensureDirs();
  const manifest = await importManifest();
  await auditWebAssets(manifest);
  await discoverOfficialResources();
  await fetchRegisteredResources(manifest);
  await inspectDownloadedResources();
  await extractHtmlContent(manifest);
  const registry = await buildActionRegistry(manifest);
  await generateHandoff(registry);
  return JSON.parse(await fsp.readFile(statePath, "utf8"));
}

export async function runPhase(phase) {
  const manifest = await importManifest();
  if (phase === "import") return { rows: manifest.length };
  if (phase === "audit") return await auditWebAssets(manifest);
  if (phase === "discover") return await discoverOfficialResources();
  if (phase === "fetch") return await fetchRegisteredResources(manifest);
  if (phase === "inspect") return await inspectDownloadedResources();
  if (phase === "extract") return await extractHtmlContent(manifest);
  if (phase === "registry") return await buildActionRegistry(manifest);
  if (phase === "handoff") return await generateHandoff();
  if (phase === "all") return await runAll();
  throw new Error(`未知阶段：${phase}`);
}

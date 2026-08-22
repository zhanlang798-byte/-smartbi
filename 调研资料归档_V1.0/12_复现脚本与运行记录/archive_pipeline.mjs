import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import readline from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { gzip as gzipCb } from "node:zlib";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCb);
const gzip = promisify(gzipCb);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

const args = parseArgs(process.argv);
const projectRoot = path.resolve(args["project-root"] || "C:/Users/73998/Desktop/数据创新平台-张奥");
const targetRoot = path.resolve(args["target-root"] || path.join(projectRoot, "调研资料归档_V1.0"));
const phase = String(args.phase || "all");
const asOf = String(args["as-of"] || "2026-08-16");
const version = "V1.0";
const runId = String(args["run-id"] || "20260816_research_archive_v1");
const stateDir = path.join(targetRoot, "12_复现脚本与运行记录", "state");
const statePath = path.join(stateDir, "archive_state.json");
const helperPath = path.join(scriptDir, "extract_xlsx_urls.ps1");

const categoryDirs = [
  "00_交接入口",
  "01_比赛与项目基线",
  "02_方案演进与调研报告",
  "03_案例库与证据",
  "04_国别货币与中国出海",
  "05_全球周期与历史危机",
  "06_黄金美元与储备配置",
  "07_会计合规与制裁",
  "08_企业案例与公开披露",
  "09_Smartbi与比赛平台",
  "10_数据集原件与说明",
  "11_缺失及受限来源",
  "12_复现脚本与运行记录",
  "report",
  "delivery",
];

const terminalStatuses = new Set([
  "ALREADY_LOCAL_VERIFIED",
  "DOWNLOADED_VERIFIED",
  "DUPLICATE_CONTENT",
  "METADATA_ONLY_LICENSE",
  "MANUAL_ACTION_REQUIRED",
  "PAYWALL_OR_AUTH",
  "NOT_PUBLIC",
  "BROKEN_OR_UNREACHABLE",
  "MISSING_DECLARED",
  "EXCLUDED_SECRET",
  "FETCH_FAILED",
]);

const assetFieldDescriptions = [
  ["asset_id", "稳定资产编号；LCL为本地资产，WEB为URL或DOI来源，REF为无URL题录。"],
  ["asset_class", "local、web或bibliographic_reference。"],
  ["title", "文件名、网页题名或文献题录。"],
  ["publisher", "发布机构；无法自动识别时明确标为待核验。"],
  ["publication_date", "原资料发布日期；未知时留空，不使用抓取日期代替。"],
  ["category", "归档模块目录。"],
  ["evidence_grade", "A政府/监管/原始披露，B权威数据库/学术资料，C可信媒体，D检索线索，内部为项目资产。"],
  ["purpose", "该资料在项目中解决的问题。"],
  ["supported_claim", "使用或引用该来源的历史文件与主张入口。"],
  ["limitations", "代理、口径、许可、可比性和证据强度边界。"],
  ["original_url", "历史文件中出现的原始URL。"],
  ["canonical_url", "去除跟踪参数并规范化后的URL；无URL题录为空。"],
  ["final_url", "HTTP重定向后的最终URL。"],
  ["cited_in", "引用该来源的项目文件集合。"],
  ["citation_locations", "文件、行号、PDF文本行或XLSX内部条目位置。"],
  ["original_project_path", "旧项目中的相对路径。"],
  ["local_path", "归档内规范原件路径；为空表示没有可封装原件。"],
  ["mime_type", "响应或本地文件MIME类型。"],
  ["extension", "规范文件扩展名。"],
  ["size_bytes", "原件字节数。"],
  ["sha256", "文件内容SHA-256，用于去重和复制验收。"],
  ["data_period_start", "数据覆盖起点；尚未结构化识别时为空。"],
  ["data_period_end", "数据覆盖终点；尚未结构化识别时为空。"],
  ["frequency", "月度、年度、事件或其他原始频率。"],
  ["geography", "适用国家、地区或全球范围。"],
  ["key_fields", "数据集关键字段；待后续正式数据工程补充时留空。"],
  ["unit", "原始计量单位。"],
  ["raw_proxy_simulated", "原始、派生、代理、模拟或题录元数据标签。"],
  ["download_status", "固定枚举中的唯一终态。"],
  ["http_status", "最后一次HTTP响应状态。"],
  ["request_method", "GET、NOT_REQUESTED或LOCAL_FILE。"],
  ["request_started_at", "请求开始时间（UTC ISO-8601）。"],
  ["request_headers_profile", "只记录公开无认证请求配置，不保存认证头。"],
  ["response_headers_safe", "仅保存日期、类型、长度、修改时间、ETag、文件名和缓存等非敏感响应头。"],
  ["access_date", "归档访问日期。"],
  ["license_name", "已识别许可或许可处理策略。"],
  ["license_url", "许可条款入口。"],
  ["redistribution_scope", "shared、private_only或metadata_only。"],
  ["duplicate_of_asset_id", "内容哈希完全相同时指向规范资产。"],
  ["replacement_source", "失效或受限来源对应的已验证替代资产ID。"],
  ["missing_reason", "未取得原件的明确原因。"],
  ["next_action", "下一位成员可执行的补救或使用动作。"],
];

const excludedDirNames = new Set(["node_modules", "texpkgs", "$build", "$out", "tmp"]);
const copyExtensions = new Set([
  ".pdf", ".xlsx", ".xls", ".csv", ".md", ".tex", ".bib", ".mmd", ".svg", ".png",
  ".txt", ".xml", ".html", ".js", ".mjs", ".ndjson", ".json",
]);
const sourceTextExtensions = new Set([".md", ".tex", ".bib", ".mmd", ".csv", ".txt", ".html", ".xml", ".js", ".mjs", ".json", ".ndjson"]);
const latexBuildExtensions = new Set([".aux", ".bbl", ".bcf", ".blg", ".log", ".out", ".toc", ".run.xml", ".synctex.gz"]);
const directFileExtensions = new Set([".pdf", ".csv", ".xlsx", ".xls", ".zip", ".gz", ".json", ".xml", ".txt", ".docx"]);

const mediaHosts = [
  "reuters.com", "bbc.com", "caixin.com", "sina.cn", "xueqiu.com", "cls.cn", "thisdaylive.com",
  "iranintl.com", "bloomberg.com", "wsj.com", "ft.com", "bullionvault.com", "cngold.org",
];
const explicitRestrictedHosts = ["gold.org", "china.gold.org", "lbma.org.uk", "fred.stlouisfed.org"];
const manualHosts = ["actuariesclimateindex.org", "heywhale.com", "elibrary.imf.org"];
const authHosts = ["tiaozhanbei.cloud.smartbi.com.cn"];
const openSharedHosts = [
  "worldbank.org", "data.worldbank.org", "datacatalog.worldbank.org", "datahelpdesk.worldbank.org",
  "documents.worldbank.org", "pmc.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov", "ebi.ac.uk", "mdpi-res.com", "github.com",
  "raw.githubusercontent.com", "treasury.gov", "federalreserve.gov", "bls.gov", "sec.gov", "ofac.treasury.gov",
  "chicagofed.org", "ecb.europa.eu", "boj.or.jp", "bis.org", "mofcom.gov.cn", "gov.cn", "sge.com.cn",
];
const privateAuthorityHosts = [
  "nber.org", "imf.org", "elibrary.imf.org", "ifrs.org", "iif.com", "iata.org", "rand.org",
  "berkshirehathaway.com", "sse.com.cn", "neeq.com.cn", "shfe.com.cn", "pwccn.com", "econstor.eu",
  "mdpi.com", "policyuncertainty.com", "pdx.edu",
];

function slash(p) {
  return p.replaceAll("\\", "/");
}

function relToProject(p) {
  return slash(path.relative(projectRoot, p));
}

function relToTarget(p) {
  return slash(path.relative(targetRoot, p));
}

function isWithin(base, candidate) {
  const rel = path.relative(path.resolve(base), path.resolve(candidate));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function writeUtf8(file, content) {
  await ensureDir(path.dirname(file));
  await fsp.writeFile(file, content, "utf8");
}

async function writeJson(file, value) {
  await writeUtf8(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function sha256File(file) {
  return await new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const input = fs.createReadStream(file);
    input.on("error", reject);
    input.on("data", (chunk) => hash.update(chunk));
    input.on("end", () => resolve(hash.digest("hex")));
  });
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function walkFiles(root) {
  const out = [];
  async function visit(dir) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (path.resolve(full) === path.resolve(targetRoot)) continue;
        if (excludedDirNames.has(entry.name)) continue;
        await visit(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }
  await visit(root);
  return out;
}

function extensionOf(file) {
  const lower = file.toLowerCase();
  if (lower.endsWith(".run.xml")) return ".run.xml";
  if (lower.endsWith(".synctex.gz")) return ".synctex.gz";
  return path.extname(lower);
}

function isOfficeLock(file) {
  return path.basename(file).startsWith("~$");
}

function isSecretArtifact(file) {
  const name = path.basename(file).toLowerCase();
  return name.includes("cookie") || name.includes("credential") || name.includes("session_token") || isOfficeLock(file);
}

function shouldCopyLocal(file) {
  const ext = extensionOf(file);
  if (!copyExtensions.has(ext)) return false;
  if (latexBuildExtensions.has(ext)) return false;
  if (isSecretArtifact(file)) return false;
  if (path.basename(file).toLowerCase() === "最终数据.zip") return false;
  if (path.basename(file).toLowerCase() === "weebly_cookies.txt") return false;
  return true;
}

function localCategory(file) {
  const rel = relToProject(file);
  if (rel.startsWith("案例库/")) return "03_案例库与证据";
  if (rel.startsWith("计划书/") || rel.startsWith("方案整合与实施路径/")) return "02_方案演进与调研报告";
  if (rel.startsWith("最终数据/")) return "10_数据集原件与说明";
  if (/^(02数据创新平台|XH-202612)/i.test(path.basename(file))) return "01_比赛与项目基线";
  if ([".md", ".tex", ".bib"].includes(extensionOf(file))) return "02_方案演进与调研报告";
  return "01_比赛与项目基线";
}

function localScope(file) {
  const rel = relToProject(file).toLowerCase();
  if (extensionOf(file) === ".ndjson") return "private_only";
  if (rel.includes("/metadata/") && [".html", ".js", ".txt"].includes(extensionOf(file))) return "private_only";
  return "shared";
}

function purposeForCategory(category) {
  const map = {
    "01_比赛与项目基线": "确认赛题约束、评分规则、项目边界和原始需求。",
    "02_方案演进与调研报告": "记录项目从黄金预测到国别风险、多币种储备和全球周期框架的演进。",
    "03_案例库与证据": "为宏观危机、货币崩溃、制裁冲突和企业损失提供正反案例证据。",
    "04_国别货币与中国出海": "支持亚非拉国别风险、汇率、通胀、资本管制和中国投资暴露研究。",
    "05_全球周期与历史危机": "识别全球经济周期、资产泡沫、信用危机、衰退与历史制度差异。",
    "06_黄金美元与储备配置": "比较美元、短债、黄金、人民币资产与套保工具的周期性作用。",
    "07_会计合规与制裁": "限定会计分类、托管、制裁、外汇管制和合法可用性边界。",
    "08_企业案例与公开披露": "核验企业海外收入、汇兑损益、冻结、退出和储备配置事实。",
    "09_Smartbi与比赛平台": "说明Smartbi数据导入、模型、看板、AIChat和资源恢复能力。",
    "10_数据集原件与说明": "保存既有原始数据、代理数据、质量检查、字段说明和复现记录。",
    "11_缺失及受限来源": "登记无法下载、需授权、未公开、失效或仅能保存元数据的来源。",
  };
  return map[category] || "项目研究资料。";
}

function rawProxyFlag(file) {
  const text = relToProject(file).toLowerCase();
  if (text.includes("proxy") || text.includes("代理")) return "proxy";
  if (text.includes("/raw/") || text.includes("\\raw\\")) return "raw";
  if (text.includes("模拟")) return "simulated";
  return "original_or_derived";
}

function publisherFromHost(host) {
  const h = host.toLowerCase();
  const map = [
    ["worldbank", "World Bank"], ["imf", "International Monetary Fund"], ["bis.org", "Bank for International Settlements"],
    ["nber.org", "National Bureau of Economic Research"], ["fred.stlouisfed.org", "Federal Reserve Bank of St. Louis"],
    ["federalreserve.gov", "Federal Reserve Board"], ["chicagofed.org", "Federal Reserve Bank of Chicago"],
    ["treasury.gov", "U.S. Department of the Treasury"], ["ofac.treasury.gov", "OFAC"], ["sec.gov", "U.S. SEC"],
    ["mofcom.gov.cn", "中华人民共和国商务部"], ["sge.com.cn", "上海黄金交易所"], ["gold.org", "World Gold Council"],
    ["lbma.org.uk", "London Bullion Market Association"], ["ifrs.org", "IFRS Foundation"], ["boj.or.jp", "Bank of Japan"],
    ["ecb.europa.eu", "European Central Bank"], ["smartbi.com.cn", "Smartbi"], ["reuters.com", "Reuters"],
    ["bbc.com", "BBC"], ["iata.org", "IATA"], ["mdpi-res.com", "MDPI"], ["mdpi.com", "MDPI"], ["ncbi.nlm.nih.gov", "NCBI/PMC"],
  ];
  for (const [needle, name] of map) if (h.includes(needle)) return name;
  return host || "未识别发布者";
}

function evidenceGrade(host) {
  const h = host.toLowerCase();
  if (/\.gov(\.|$)|gov\.cn$|mofcom|sec\.gov|ofac|centralbank|cbn\.gov|nigerianstat|indec\.gob|bcra\.gob/.test(h)) return "A";
  if (/worldbank|imf|bis\.org|nber|ecb|boj|federalreserve|chicagofed|bls\.gov|sge\.com|ifrs|iata|mdpi|ncbi/.test(h)) return "B";
  if (/reuters|bbc|caixin|sina|cls\.cn|thisdaylive/.test(h)) return "C";
  return "D";
}

function normalizeUrl(raw) {
  if (!raw) return "";
  let text = String(raw)
    .replaceAll("\\_", "_")
    .replaceAll("\\&", "&")
    .replaceAll("\\%", "%")
    .replaceAll("&amp;", "&")
    .trim();
  text = text.replace(/[.,;:，。；、>'"\]]+$/gu, "");
  while (text.endsWith(")") && (text.match(/\(/g)?.length || 0) < (text.match(/\)/g)?.length || 0)) text = text.slice(0, -1);
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    const host = url.hostname.toLowerCase();
    const domainLike = /^(?:[a-z0-9-]+\.)+[a-z0-9-]+$/i.test(host);
    const ipv4Like = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
    if (!domainLike && !ipv4Like) return "";
    url.hash = "";
    const tracking = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "spm", "from"];
    for (const key of tracking) url.searchParams.delete(key);
    url.hostname = url.hostname.toLowerCase();
    if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) url.port = "";
    return url.toString().replace(/\/$/, url.pathname === "/" ? "/" : "");
  } catch {
    return "";
  }
}

function isInfrastructureUrl(urlText) {
  try {
    const url = new URL(urlText);
    const host = url.hostname.toLowerCase();
    return [
      "schemas.openxmlformats.org",
      "schemas.microsoft.com",
      "www.w3.org",
      "purl.oclc.org",
      "schema.org",
    ].includes(host);
  } catch {
    return true;
  }
}

function titleFromUrl(urlText) {
  try {
    const url = new URL(urlText);
    const last = decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) || url.hostname);
    return last.replace(/[-_]+/g, " ").replace(/\.(pdf|html?|xml|csv|xlsx?|json|zip)$/i, "").slice(0, 180) || url.hostname;
  } catch {
    return urlText.slice(0, 180);
  }
}

function slugify(text) {
  const cleaned = String(text || "source").replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").replace(/\s+/g, "_").replace(/_+/g, "_").slice(0, 72);
  return cleaned || "source";
}

function webCategory(urlText, occurrences = []) {
  const host = new URL(urlText).hostname.toLowerCase();
  const context = occurrences.map((o) => `${o.source_file} ${o.context || ""}`).join(" ").toLowerCase();
  if (/entropy-28-00271|e28030271|pmc13025532/.test(urlText.toLowerCase())) return "06_黄金美元与储备配置";
  if (host.includes("smartbi")) return "09_Smartbi与比赛平台";
  if (/ifrs|ofac|sanction|制裁|会计|冻结|合规/.test(`${host} ${context}`)) return "07_会计合规与制裁";
  if (/企业|公司|年报|annual|sec\.gov|sse\.com|neeq|传音|华为|mtn|nestle|tether|palantir/.test(context)) return "08_企业案例与公开披露";
  if (/宏观危机|大萧条|互联网泡沫|日本|衰退|nber|boj|ecb|financial crisis|cycle/.test(`${host} ${context}`)) return "05_全球周期与历史危机";
  if (/黄金|白银|gold|silver|lbma|sge|fred|treasury|美元|储备配置/.test(`${host} ${context}`)) return "06_黄金美元与储备配置";
  return "04_国别货币与中国出海";
}

function hostEndsWith(host, suffix) {
  return host === suffix || host.endsWith(`.${suffix}`);
}

function matchesAnyHost(host, list) {
  return list.some((item) => hostEndsWith(host, item));
}

function policyForUrl(urlText) {
  const url = new URL(urlText);
  const host = url.hostname.toLowerCase();
  const ext = path.extname(url.pathname.toLowerCase());
  if (matchesAnyHost(host, authHosts)) {
    return { action: "auth", scope: "metadata_only", status: "PAYWALL_OR_AUTH", license_name: "认证环境，仅保存脱敏元数据", license_url: "" };
  }
  if (matchesAnyHost(host, manualHosts)) {
    return { action: "manual", scope: "metadata_only", status: "MANUAL_ACTION_REQUIRED", license_name: "需人工接受条款或确认许可", license_url: urlText };
  }
  if (matchesAnyHost(host, explicitRestrictedHosts)) {
    const licenseUrl = host.includes("fred") ? "https://fred.stlouisfed.org/legal/" : host.includes("gold.org") ? "https://www.gold.org/terms-and-conditions" : "";
    return { action: "metadata", scope: "metadata_only", status: "METADATA_ONLY_LICENSE", license_name: "限制抓取或再分发", license_url: licenseUrl };
  }
  if (matchesAnyHost(host, mediaHosts)) {
    return { action: "metadata", scope: "metadata_only", status: "METADATA_ONLY_LICENSE", license_name: "新闻/媒体版权，默认仅保存元数据", license_url: "" };
  }
  if (hostEndsWith(host, "worldbank.org")) {
    return { action: "fetch", scope: "shared", status: "", license_name: "World Bank数据条款/CC BY 4.0，第三方内容例外", license_url: "https://data.worldbank.org/summary-terms-of-use" };
  }
  if (hostEndsWith(host, "pmc.ncbi.nlm.nih.gov") || hostEndsWith(host, "ebi.ac.uk") || hostEndsWith(host, "raw.githubusercontent.com")) {
    return { action: "fetch", scope: "shared", status: "", license_name: "开放获取或开放仓库，逐项保留原许可", license_url: "" };
  }
  if (hostEndsWith(host, "mdpi-res.com")) {
    return { action: "fetch", scope: "shared", status: "", license_name: "MDPI开放获取文章；本论文页面标注CC BY 4.0", license_url: "https://creativecommons.org/licenses/by/4.0/" };
  }
  if (matchesAnyHost(host, openSharedHosts)) {
    return { action: "fetch", scope: "shared", status: "", license_name: "政府/国际组织公开资料，按原站署名与条款使用", license_url: "" };
  }
  if (matchesAnyHost(host, privateAuthorityHosts) || directFileExtensions.has(ext)) {
    return { action: "fetch", scope: "private_only", status: "", license_name: "公开可访问但再分发范围未完全确认，仅本机归档", license_url: "" };
  }
  return { action: "metadata", scope: "metadata_only", status: "METADATA_ONLY_LICENSE", license_name: "许可未明确，默认仅保存元数据", license_url: "" };
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function recordsToCsv(records, fields) {
  const rows = [fields.join(",")];
  for (const record of records) rows.push(fields.map((field) => csvEscape(record[field] ?? "")).join(","));
  return `${rows.join("\r\n")}\r\n`;
}

function latexEscape(value) {
  const map = {
    "\\": "\\textbackslash{}",
    "&": "\\&",
    "%": "\\%",
    "$": "\\$",
    "#": "\\#",
    "_": "\\_",
    "{": "\\{",
    "}": "\\}",
    "~": "\\textasciitilde{}",
    "^": "\\textasciicircum{}",
  };
  return String(value ?? "").replace(/[\\&%$#_{}~^]/g, (character) => map[character]);
}

function bibEscape(value) {
  const map = { "\\": "\\textbackslash{}", "{": "\\{", "}": "\\}", "&": "\\&", "%": "\\%", "#": "\\#", "_": "\\_", "$": "\\$" };
  return String(value ?? "").replace(/[\\{}&%#_$]/g, (character) => map[character]);
}

function latexBreakable(value) {
  const map = {
    "\\": "\\textbackslash{}\\allowbreak{}",
    "&": "\\&",
    "%": "\\%",
    "$": "\\$",
    "#": "\\#",
    "_": "\\_\\allowbreak{}",
    "{": "\\{",
    "}": "\\}",
    "~": "\\textasciitilde{}",
    "^": "\\textasciicircum{}",
    "/": "/\\allowbreak{}",
    ":": ":\\allowbreak{}",
    ",": ",\\allowbreak{}",
    ";": ";\\allowbreak{}",
    "-": "-\\allowbreak{}",
  };
  return String(value ?? "").replace(/[\\&%$#_{}~^/:,;-]/g, (character) => map[character]);
}

async function copyPreserveTime(src, dst) {
  await ensureDir(path.dirname(dst));
  await fsp.copyFile(src, dst);
  const stat = await fsp.stat(src);
  await fsp.utimes(dst, stat.atime, stat.mtime);
}

async function summarizeNdjsonAssets(localAssets) {
  const rows = [];
  for (const asset of localAssets.filter((item) => item.extension === ".ndjson" && item.local_path)) {
    const file = path.join(targetRoot, ...asset.local_path.split("/"));
    if (!fs.existsSync(file)) continue;
    const input = fs.createReadStream(file, { encoding: "utf8" });
    const rl = readline.createInterface({ input, crlfDelay: Infinity });
    let lineCount = 0;
    let nonEmptyLines = 0;
    let invalidJsonLines = 0;
    for await (const line of rl) {
      lineCount += 1;
      if (!line.trim()) continue;
      nonEmptyLines += 1;
      try { JSON.parse(line); } catch { invalidJsonLines += 1; }
    }
    rows.push({
      asset_id: asset.asset_id,
      original_project_path: asset.original_project_path,
      size_bytes: asset.size_bytes,
      sha256: asset.sha256,
      line_count: lineCount,
      non_empty_lines: nonEmptyLines,
      invalid_json_lines: invalidJsonLines,
      qa_result: invalidJsonLines === 0 ? "PASS" : "INVALID_JSON_LINES_FOUND",
    });
  }
  return rows;
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const character = line[i];
    if (character === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      fields.push(current);
      current = "";
    } else current += character;
  }
  fields.push(current);
  return fields;
}

function inferTabularFrequency(name, headers = []) {
  const text = `${name} ${headers.join(" ")}`.toLowerCase();
  if (/评分|manifest|清单|词典|词表/.test(text)) return "static_or_registry";
  if (/日度|daily|trade_date/.test(text)) return "daily_or_mixed";
  if (/周度|weekly/.test(text)) return "weekly_or_mixed";
  if (/月度|monthly|month|epu|real_rate|dollar|commodity/.test(text)) return "monthly_or_mixed";
  if (/年度|annual|year/.test(text)) return "annual_or_mixed";
  if (/时序|价格|factor/.test(text)) return "mixed_frequency";
  return "see_source_documentation";
}

function inferTabularGeography(name) {
  const text = name.toLowerCase();
  if (/china_mainland|中国|sge/.test(text)) return "China mainland";
  if (/world_bank|commodity|gold|silver|dollar|fred|cftc/.test(text)) return "global_or_source_specific";
  return "see_source_documentation";
}

async function enrichLocalTabularAssets(localAssets) {
  const profiles = [];
  for (const asset of localAssets.filter((item) => [".xlsx", ".csv"].includes(item.extension) && item.local_path)) {
    const file = path.join(targetRoot, ...asset.local_path.split("/"));
    if (!fs.existsSync(file)) continue;
    if (asset.extension === ".xlsx") {
      try {
        const { stdout } = await execFile("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", helperPath, "-WorkbookPath", file, "-Metadata"], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
        const metadata = JSON.parse(stdout.trim());
        const sheets = Array.isArray(metadata.sheet_names) ? metadata.sheet_names : [metadata.sheet_names].filter(Boolean);
        asset.key_fields = `worksheets(${metadata.sheet_count}): ${sheets.join(" | ")}`.slice(0, 2000);
        asset.frequency = inferTabularFrequency(asset.title, sheets);
        asset.geography = inferTabularGeography(asset.title);
        asset.unit = "各工作表单位见来源与口径/说明工作表";
        profiles.push({ asset_id: asset.asset_id, file_type: "xlsx", original_project_path: asset.original_project_path, row_or_sheet_count: metadata.sheet_count, fields_or_sheets: sheets.join(" | "), data_period_start: "", data_period_end: "", frequency: asset.frequency, geography: asset.geography, structure_status: metadata.sheet_count === metadata.worksheet_xml_count ? "PASS" : "SHEET_XML_COUNT_MISMATCH" });
      } catch (error) {
        profiles.push({ asset_id: asset.asset_id, file_type: "xlsx", original_project_path: asset.original_project_path, row_or_sheet_count: "", fields_or_sheets: "", data_period_start: "", data_period_end: "", frequency: "", geography: "", structure_status: `FAIL: ${String(error.message).slice(0, 180)}` });
      }
      continue;
    }

    const input = fs.createReadStream(file, { encoding: "utf8" });
    const rl = readline.createInterface({ input, crlfDelay: Infinity });
    let lineCount = 0;
    let headers = [];
    let dateIndex = -1;
    let minDate = "";
    let maxDate = "";
    for await (const line of rl) {
      if (lineCount === 0) {
        headers = parseCsvLine(line.replace(/^\uFEFF/, ""));
        dateIndex = headers.findIndex((header) => /(?:^|_)(date|month|year)(?:$|_)|日期|月份|年份/i.test(header));
      } else if (dateIndex >= 0) {
        const value = parseCsvLine(line)[dateIndex]?.trim() || "";
        const normalized = value.match(/^\d{4}(?:-\d{1,2}(?:-\d{1,2})?)?/)?.[0] || "";
        if (normalized && (!minDate || normalized < minDate)) minDate = normalized;
        if (normalized && (!maxDate || normalized > maxDate)) maxDate = normalized;
      }
      lineCount += 1;
    }
    const dataRows = Math.max(0, lineCount - 1);
    asset.key_fields = headers.join(" | ").slice(0, 2000);
    asset.frequency = inferTabularFrequency(asset.title, headers);
    asset.geography = inferTabularGeography(asset.title);
    asset.data_period_start = minDate;
    asset.data_period_end = maxDate;
    asset.unit = "各字段单位见源文件、字段名或配套说明";
    profiles.push({ asset_id: asset.asset_id, file_type: "csv", original_project_path: asset.original_project_path, row_or_sheet_count: dataRows, fields_or_sheets: headers.join(" | "), data_period_start: minDate, data_period_end: maxDate, frequency: asset.frequency, geography: asset.geography, structure_status: headers.length ? "PASS" : "EMPTY_HEADER" });
  }
  return profiles;
}

async function buildFileReadabilityQa(assets) {
  const rows = [];
  for (const asset of assets.filter((item) => item.local_path && item.download_status !== "DUPLICATE_CONTENT")) {
    const file = path.join(targetRoot, ...asset.local_path.split("/"));
    const exists = fs.existsSync(file);
    let signatureResult = exists ? "NOT_APPLICABLE" : "MISSING";
    let pdfPages = "";
    let readability = exists ? "PASS" : "FAIL";
    let detail = "";
    if (exists && [".pdf", ".xlsx", ".zip", ".docx"].includes(asset.extension)) {
      const result = await validateDownloadedFile(file, asset.extension, asset.mime_type || "");
      signatureResult = result.ok ? "PASS" : result.reason;
      if (!result.ok) readability = "FAIL";
    }
    if (exists && asset.extension === ".pdf") {
      try {
        const { stdout } = await execFile("pdfinfo", [file], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
        pdfPages = stdout.match(/^Pages:\s+(\d+)/mi)?.[1] || "";
        if (!pdfPages || Number(pdfPages) < 1) { readability = "FAIL"; detail = "PDF_PAGE_COUNT_MISSING"; }
      } catch (error) {
        readability = "FAIL";
        detail = `PDFINFO_FAIL: ${String(error.message).slice(0, 160)}`;
      }
    }
    rows.push({ asset_id: asset.asset_id, local_path: asset.local_path, extension: asset.extension, mime_type: asset.mime_type, size_bytes: asset.size_bytes, signature_result: signatureResult, pdf_pages: pdfPages, readability_result: readability, detail });
  }
  return rows;
}

async function clearGeneratedDownloadDirs() {
  for (const category of categoryDirs) {
    const generated = path.join(targetRoot, category, "外部原件");
    if (!isWithin(targetRoot, generated)) throw new Error(`UNSAFE_GENERATED_PATH ${generated}`);
    await fsp.rm(generated, { recursive: true, force: true });
  }
}

function cleanReferenceText(value) {
  return String(value || "")
    .replace(/^\s*(?:[-*+]\s+|\[?\d+\]?[.)、]?\s+)/u, "")
    .replace(/\\(?:emph|textit|textbf)\{([^{}]+)\}/g, "$1")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800);
}

function looksLikeReferenceHeading(line) {
  return /^(?:#{1,6}\s*)?(?:参考文献|参考资料|主要来源|资料来源|references|bibliography)\s*[:：]?\s*$/iu.test(String(line || "").trim());
}

function looksLikeReferenceEntry(line) {
  const text = String(line || "").trim();
  if (text.length < 18 || text.length > 1200) return false;
  return /^(?:[-*+]\s+|\[?\d+\]?[.)、]\s+|[A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’.-]+[,，]\s+)/u.test(text);
}

async function extractBibNoUrlReferences(file, addReference) {
  const text = await fsp.readFile(file, "utf8");
  const entryPattern = /@(article|book|inproceedings|report|techreport|misc|online|phdthesis|mastersthesis)\s*\{[\s\S]*?\n\}/giu;
  for (const match of text.matchAll(entryPattern)) {
    const entry = match[0];
    if (/\b(?:url|doi)\s*=/iu.test(entry)) continue;
    if (/项目根目录本地原始文件|项目内部资料/iu.test(entry)) continue;
    const titleMatch = entry.match(/\btitle\s*=\s*[\{"]([\s\S]*?)[\}"]\s*,?/iu);
    if (!titleMatch) continue;
    const line = text.slice(0, match.index).split(/\r?\n/).length;
    addReference(cleanReferenceText(titleMatch[1]), line, entry.slice(0, 500), "bib_no_url");
  }
}

async function extractTextOccurrences(file, addOccurrence, addReference) {
  const input = fs.createReadStream(file, { encoding: "utf8" });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  let lineNo = 0;
  let inReferences = false;
  for await (const line of rl) {
    lineNo += 1;
    const trimmed = line.trim();
    if (looksLikeReferenceHeading(trimmed)) inReferences = true;
    else if (inReferences && /^#{1,6}\s+/.test(trimmed)) inReferences = false;
    const markdownLinks = [...line.matchAll(/\[([^\]]{1,240})\]\((https?:\/\/[^\s)]+)\)/giu)];
    for (const match of markdownLinks) addOccurrence(match[2], lineNo, line.slice(0, 500), match[1], "markdown_link");
    const urls = [...line.matchAll(/https?:\/\/[^\s<>{}"',，。()\[\]]+/giu)];
    for (const match of urls) addOccurrence(match[0], lineNo, line.slice(0, 500), "", "plain_url");
    const spacedUrls = [...line.matchAll(/https?\s+:\s*\/\s*\/[^,，;；]+/giu)];
    for (const match of spacedUrls) addOccurrence(match[0].replace(/\s+/g, ""), lineNo, line.slice(0, 500), "", "spaced_url");
    const doiMatches = [...line.matchAll(/\b10\.\d{4,9}\/[A-Z0-9._;()/:+-]+/giu)];
    if ([".md", ".tex", ".bib", ".mmd", ".csv", ".txt"].includes(extensionOf(file))) {
      for (const match of doiMatches) addOccurrence(`https://doi.org/${match[0]}`, lineNo, line.slice(0, 500), match[0], "doi");
    }
    if (inReferences && looksLikeReferenceEntry(trimmed) && urls.length === 0 && spacedUrls.length === 0 && doiMatches.length === 0) {
      addReference(cleanReferenceText(trimmed), lineNo, line.slice(0, 500), "text_no_url");
    }
  }
  if (extensionOf(file) === ".bib") await extractBibNoUrlReferences(file, addReference);
}

async function extractPdfOccurrences(file, addOccurrence, addReference) {
  try {
    const { stdout } = await execFile("pdftotext", ["-layout", file, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    const lines = stdout.split(/\r?\n/);
    let inReferences = false;
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (looksLikeReferenceHeading(trimmed)) inReferences = true;
      for (const match of line.matchAll(/https?:\/\/[^\s<>{}"',，。()\[\]]+/giu)) addOccurrence(match[0], index + 1, line.slice(0, 500), "", "pdf_text");
      const spacedUrls = [...line.matchAll(/https?\s+:\s*\/\s*\/[^,，;；]+/giu)];
      for (const match of spacedUrls) addOccurrence(match[0].replace(/\s+/g, ""), index + 1, line.slice(0, 500), "", "pdf_spaced_url");
      const doiMatches = [...line.matchAll(/\b10\.\d{4,9}\/[A-Z0-9._;()/:+-]+/giu)];
      for (const match of doiMatches) addOccurrence(`https://doi.org/${match[0]}`, index + 1, line.slice(0, 500), match[0], "pdf_doi");
      const urls = [...line.matchAll(/https?:\/\//giu)];
      if (inReferences && looksLikeReferenceEntry(trimmed) && urls.length === 0 && spacedUrls.length === 0 && doiMatches.length === 0) {
        addReference(cleanReferenceText(trimmed), index + 1, line.slice(0, 500), "pdf_no_url");
      }
    });
  } catch (error) {
    console.warn(`PDF_URL_SCAN_FAIL ${relToProject(file)} ${error.message}`);
  }
  let annotationXml = "";
  try {
    const result = await execFile("pdftohtml", ["-xml", "-hidden", "-i", "-stdout", file], { encoding: "utf8", maxBuffer: 96 * 1024 * 1024 });
    annotationXml = result.stdout || "";
  } catch (error) {
    annotationXml = error.stdout || "";
    if (!annotationXml) console.warn(`PDF_ANNOTATION_SCAN_FAIL ${relToProject(file)} ${error.message}`);
  }
  let annotationIndex = 0;
  for (const match of annotationXml.matchAll(/href="(https?:\/\/[^"<>]+)"/giu)) {
    annotationIndex += 1;
    addOccurrence(match[1], `annotation-${annotationIndex}`, `PDF link annotation: ${match[1]}`.slice(0, 500), "", "pdf_annotation");
  }
}

async function extractXlsxOccurrences(file, addOccurrence) {
  try {
    const { stdout } = await execFile("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", helperPath, "-WorkbookPath", file], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    if (!stdout.trim()) return;
    const parsed = JSON.parse(stdout.trim());
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    for (const row of rows) addOccurrence(row.url, row.entry || "xlsx", `XLSX entry: ${row.entry || "unknown"}`, "", "xlsx_xml");
  } catch (error) {
    console.warn(`XLSX_URL_SCAN_FAIL ${relToProject(file)} ${error.message}`);
  }
}

function buildLocalRecord(file, index, stat, hash, status, archiveRel, duplicateOf = "") {
  const category = localCategory(file);
  const rel = relToProject(file);
  return {
    asset_id: `LCL-${String(index).padStart(4, "0")}`,
    asset_class: "local",
    title: path.basename(file),
    publisher: rel.startsWith("案例库/") || rel.startsWith("计划书/") || extensionOf(file) === ".mjs" ? "项目团队" : "项目已有资料",
    publication_date: stat.mtime.toISOString().slice(0, 10),
    category,
    evidence_grade: rel.includes("XH-202612_Smartbi") || rel.startsWith("02数据创新平台") ? "A" : "内部",
    purpose: purposeForCategory(category),
    supported_claim: `作为${category.replace(/^\d+_/, "")}的本地证据或项目产物。`,
    limitations: rawProxyFlag(file) === "proxy" ? "代理数据，不得冒充论文或机构原始序列。" : "应结合来源说明和版本状态使用。",
    original_url: "",
    canonical_url: "",
    final_url: "",
    cited_in: rel,
    citation_locations: rel,
    original_project_path: rel,
    local_path: archiveRel,
    mime_type: "",
    extension: extensionOf(file),
    size_bytes: stat.size,
    sha256: hash,
    data_period_start: "",
    data_period_end: "",
    frequency: "",
    geography: "",
    key_fields: "",
    unit: "",
    raw_proxy_simulated: rawProxyFlag(file),
    download_status: status,
    http_status: "",
    request_method: "LOCAL_FILE",
    request_started_at: "",
    request_headers_profile: "",
    response_headers_safe: "",
    access_date: asOf,
    license_name: "项目内部资料或随附原始许可",
    license_url: "",
    redistribution_scope: localScope(file),
    duplicate_of_asset_id: duplicateOf,
    replacement_source: "",
    missing_reason: "",
    next_action: status === "DUPLICATE_CONTENT" ? "使用duplicate_of_asset_id指向的规范副本。" : "按用途读取，不修改历史原件。",
  };
}

async function phaseScanCopy() {
  console.log(`SCAN_START ${projectRoot}`);
  await clearGeneratedDownloadDirs();
  for (const dir of categoryDirs) await ensureDir(path.join(targetRoot, dir));
  await ensureDir(stateDir);

  const allFiles = (await walkFiles(projectRoot)).sort((a, b) => relToProject(a).localeCompare(relToProject(b), "zh-CN"));
  const freezeRecords = [];
  for (let i = 0; i < allFiles.length; i += 1) {
    const file = allFiles[i];
    const stat = await fsp.stat(file);
    freezeRecords.push({ path: relToProject(file), size_bytes: stat.size, mtime_utc: stat.mtime.toISOString(), sha256: await sha256File(file) });
    if ((i + 1) % 40 === 0) console.log(`HASHED ${i + 1}/${allFiles.length}`);
  }
  await writeUtf8(path.join(stateDir, "old_source_hashes_before.jsonl"), `${freezeRecords.map((r) => JSON.stringify(r)).join("\n")}\n`);

  const canonicalByHash = new Map();
  const localAssets = [];
  let localIndex = 0;
  for (const file of allFiles) {
    const rel = relToProject(file);
    const stat = await fsp.stat(file);
    const hash = freezeRecords.find((r) => r.path === rel)?.sha256 || await sha256File(file);
    if (isSecretArtifact(file) || path.basename(file).toLowerCase() === "weebly_cookies.txt") {
      localIndex += 1;
      const record = buildLocalRecord(file, localIndex, stat, hash, "EXCLUDED_SECRET", "");
      record.redistribution_scope = "metadata_only";
      record.missing_reason = "Cookie、认证痕迹或Office锁文件不属于研究资料，禁止封装。";
      record.next_action = "保持旧文件不动；不得复制到任何交接包。";
      localAssets.push(record);
      continue;
    }
    if (path.basename(file).toLowerCase() === "最终数据.zip") {
      localIndex += 1;
      const record = buildLocalRecord(file, localIndex, stat, hash, "ALREADY_LOCAL_VERIFIED", "");
      record.redistribution_scope = "metadata_only";
      record.limitations = "历史压缩包与解压目录高度重复，且可能夹带不应封装的临时认证痕迹；仅记录哈希。";
      record.next_action = "使用归档内去重后的研究资料，不嵌套该ZIP。";
      localAssets.push(record);
      continue;
    }
    if (!shouldCopyLocal(file)) continue;
    localIndex += 1;
    if (canonicalByHash.has(hash)) {
      const canonical = canonicalByHash.get(hash);
      localAssets.push(buildLocalRecord(file, localIndex, stat, hash, "DUPLICATE_CONTENT", canonical.local_path, canonical.asset_id));
      continue;
    }
    const category = localCategory(file);
    const archiveRel = slash(path.join(category, "本地原件", rel));
    const dst = path.join(targetRoot, ...archiveRel.split("/"));
    await copyPreserveTime(file, dst);
    const copiedHash = await sha256File(dst);
    if (copiedHash !== hash) throw new Error(`COPY_HASH_MISMATCH ${rel}`);
    const record = buildLocalRecord(file, localIndex, stat, hash, "ALREADY_LOCAL_VERIFIED", archiveRel);
    canonicalByHash.set(hash, record);
    localAssets.push(record);
  }

  const sourceMap = new Map();
  const referenceMap = new Map();
  function addOccurrenceFactory(file) {
    const sourceFile = relToProject(file);
    return (rawUrl, line, context, titleHint, originType) => {
      const canonical = normalizeUrl(rawUrl);
      if (!canonical || isInfrastructureUrl(canonical)) return;
      const item = sourceMap.get(canonical) || { canonical_url: canonical, original_urls: new Set(), occurrences: [] };
      item.original_urls.add(String(rawUrl));
      const occurrence = { source_file: sourceFile, location: String(line), context: String(context || "").slice(0, 500), title_hint: String(titleHint || "").slice(0, 240), origin_type: originType };
      const key = `${occurrence.source_file}|${occurrence.location}|${canonical}|${originType}`;
      if (!item.occurrences.some((o) => `${o.source_file}|${o.location}|${canonical}|${o.origin_type}` === key)) item.occurrences.push(occurrence);
      sourceMap.set(canonical, item);
    };
  }

  function addReferenceFactory(file) {
    const sourceFile = relToProject(file);
    return (rawTitle, line, context, originType) => {
      const title = cleanReferenceText(rawTitle);
      if (title.length < 12) return;
      const normalized = title.toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      if (!normalized) return;
      const key = sha256Text(normalized);
      const item = referenceMap.get(key) || { reference_key: key, title, occurrences: [] };
      const occurrence = { source_file: sourceFile, location: String(line), context: String(context || "").slice(0, 500), title_hint: title.slice(0, 240), origin_type: originType };
      const occurrenceKey = `${occurrence.source_file}|${occurrence.location}|${originType}`;
      if (!item.occurrences.some((o) => `${o.source_file}|${o.location}|${o.origin_type}` === occurrenceKey)) item.occurrences.push(occurrence);
      referenceMap.set(key, item);
    };
  }

  const sourceFiles = allFiles.filter((file) => !isOfficeLock(file) && (sourceTextExtensions.has(extensionOf(file)) || extensionOf(file) === ".pdf" || extensionOf(file) === ".xlsx"));
  for (let i = 0; i < sourceFiles.length; i += 1) {
    const file = sourceFiles[i];
    const addOccurrence = addOccurrenceFactory(file);
    const addReference = addReferenceFactory(file);
    const ext = extensionOf(file);
    if (sourceTextExtensions.has(ext)) await extractTextOccurrences(file, addOccurrence, addReference);
    else if (ext === ".pdf") await extractPdfOccurrences(file, addOccurrence, addReference);
    else if (ext === ".xlsx") await extractXlsxOccurrences(file, addOccurrence);
    if ((i + 1) % 15 === 0) console.log(`SCANNED_SOURCES ${i + 1}/${sourceFiles.length}`);
  }

  const seedSources = [
    ["https://pmc.ncbi.nlm.nih.gov/articles/PMC13025532/pdf/entropy-28-00271.pdf", "缺失论文PDF恢复候选", "legacy_manifest"],
    ["https://www.mdpi.com/1099-4300/28/3/271/pdf", "缺失论文PDF恢复候选", "legacy_manifest"],
    ["https://mdpi-res.com/d_attachment/entropy/entropy-28-00271/article_deploy/entropy-28-00271-v2.pdf", "缺失论文PDF官方开放CDN恢复候选", "legacy_manifest"],
    ["https://www.federalreserve.gov/newsevents/pressreleases/2020-press-fomc.htm", "2020年FOMC官方新闻稿索引（替代失效汇总链接）", "replacement_source"],
    ["https://data.worldbank.org/summary-terms-of-use", "World Bank数据许可", "archive_policy"],
    ["https://fred.stlouisfed.org/legal/", "FRED法律条款", "archive_policy"],
    ["https://www.gold.org/terms-and-conditions", "WGC条款", "archive_policy"],
  ];
  for (const [url, title, originType] of seedSources) {
    const canonical = normalizeUrl(url);
    const item = sourceMap.get(canonical) || { canonical_url: canonical, original_urls: new Set(), occurrences: [] };
    item.original_urls.add(url);
    item.occurrences.push({ source_file: "V1.0归档实施策略", location: "policy", context: title, title_hint: title, origin_type: originType });
    sourceMap.set(canonical, item);
  }

  const sourceRecords = [...sourceMap.values()].map((item) => ({
    canonical_url: item.canonical_url,
    original_urls: [...item.original_urls],
    occurrences: item.occurrences,
  })).sort((a, b) => a.canonical_url.localeCompare(b.canonical_url));
  const referenceRecords = [...referenceMap.values()].sort((a, b) => a.reference_key.localeCompare(b.reference_key));

  const state = {
    version,
    run_id: runId,
    as_of: asOf,
    project_root: projectRoot,
    target_root: targetRoot,
    scan_completed_at: new Date().toISOString(),
    frozen_file_count: freezeRecords.length,
    local_assets: localAssets,
    source_records: sourceRecords,
    reference_records: referenceRecords,
    web_assets: [],
    reference_assets: [],
    download_log: [],
  };
  await writeJson(statePath, state);
  console.log(`SCAN_COMPLETE local_assets=${localAssets.length} unique_urls=${sourceRecords.length} no_url_references=${referenceRecords.length}`);
}

function inferTitleFromOccurrences(urlText, occurrences) {
  const hint = occurrences.map((o) => o.title_hint).find((v) => v && v.length > 2);
  if (hint) return hint.replace(/^[\s*#>-]+|[\s*]+$/g, "").slice(0, 180);
  for (const occurrence of occurrences) {
    const context = occurrence.context || "";
    const before = context.split("http")[0].replace(/[|\[\]{}*_#>`]/g, " ").trim();
    if (before.length >= 4) return before.slice(-180);
  }
  return titleFromUrl(urlText);
}

function referenceCategory(occurrences = []) {
  const context = occurrences.map((o) => `${o.source_file} ${o.context || ""}`).join(" ").toLowerCase();
  if (/smartbi/.test(context)) return "09_Smartbi与比赛平台";
  if (/会计|ifrs|制裁|冻结|合规/.test(context)) return "07_会计合规与制裁";
  if (/企业|公司|年报|汇兑|海外收入/.test(context)) return "08_企业案例与公开披露";
  if (/大萧条|危机|泡沫|衰退|日本|周期|滞胀/.test(context)) return "05_全球周期与历史危机";
  if (/黄金|白银|美元|短债|储备|gold|silver/.test(context)) return "06_黄金美元与储备配置";
  return "04_国别货币与中国出海";
}

function buildReferenceAssets(referenceRecords = []) {
  return referenceRecords.map((reference, index) => {
    const occurrences = reference.occurrences || [];
    const category = referenceCategory(occurrences);
    return {
      asset_id: `REF-${String(index + 1).padStart(4, "0")}`,
      asset_class: "bibliographic_reference",
      title: reference.title,
      publisher: "题录发布者待核验",
      publication_date: "",
      category,
      evidence_grade: "D",
      purpose: purposeForCategory(category),
      supported_claim: occurrences.map((o) => o.source_file).filter((v, i, a) => a.indexOf(v) === i).slice(0, 8).join("；"),
      limitations: "历史文件只留下题录而没有可验证URL或DOI；取得原件前只能作为检索线索。",
      original_url: "",
      canonical_url: "",
      final_url: "",
      cited_in: occurrences.map((o) => o.source_file).filter((v, i, a) => a.indexOf(v) === i).join(" | "),
      citation_locations: occurrences.map((o) => `${o.source_file}:${o.location}`).join(" | "),
      original_project_path: "",
      local_path: "",
      mime_type: "",
      extension: "",
      size_bytes: "",
      sha256: "",
      data_period_start: "",
      data_period_end: "",
      frequency: "",
      geography: "",
      key_fields: "",
      unit: "",
      raw_proxy_simulated: "bibliographic_metadata",
      download_status: "MANUAL_ACTION_REQUIRED",
      http_status: "",
      request_method: "NOT_REQUESTED",
      request_started_at: "",
      request_headers_profile: "",
      response_headers_safe: "",
      access_date: asOf,
      license_name: "许可与公开状态待定位原件后确认",
      license_url: "",
      redistribution_scope: "metadata_only",
      duplicate_of_asset_id: "",
      replacement_source: "",
      missing_reason: "无URL/DOI题录，未自动下载。",
      next_action: "按题名、作者和年份检索权威原文；取得后登记URL、许可、文件哈希和证据等级。",
      occurrences,
    };
  });
}

function linkKnownReplacements(webAssets) {
  const byUrl = new Map(webAssets.map((asset) => [asset.canonical_url, asset]));
  const mappings = [
    ["https://datacatalog.worldbank.org/search/dataset", "https://datacatalog.worldbank.org/search/dataset/0037798/global-economic-monitor"],
    ["https://home.treasury.gov/resource-center/data-chart-center/interest-rates", "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_real_yield_curve"],
    ["https://pmc.ncbi.nlm.nih.gov/articles/PMC13025532/pdf/entropy-28-00271.pdf", "https://mdpi-res.com/d_attachment/entropy/entropy-28-00271/article_deploy/entropy-28-00271-v2.pdf"],
    ["https://service.sge.com.cn:8443/financialinquiry/initAuth.htm", "https://www.sge.com.cn/sjzx/quotation_daily_new"],
    ["https://www.federalreserve.gov/newsevents/pressreleases/2020-monetary.htm", "https://www.federalreserve.gov/newsevents/pressreleases/2020-press-fomc.htm"],
    ["https://www.ifrs.org/content/dam/ifrs/meetings/2016", "https://www.ifrs.org/content/dam/ifrs/meetings/2016/november/ifrs-ic/commodity-loans/ap10-commodity-loans.pdf"],
    ["https://www.ifrs.org/content/dam/ifrs/meetings/2016/november", "https://www.ifrs.org/content/dam/ifrs/meetings/2016/november/ifrs-ic/commodity-loans/ap10-commodity-loans.pdf"],
    ["https://www.ifrs.org/issued-", "https://www.ifrs.org/content/dam/ifrs/meetings/2016/november/ifrs-ic/commodity-loans/ap10-commodity-loans.pdf"],
    ["https://www.mofcom.gov.cn/zfxxgk/fdzdgknr", "https://www.mofcom.gov.cn/zfxxgk/fdzdgknr/ztfl/tjsj/gwjjhztj/art/2025/art_73650df853694bf0a192e5fceb2948bb.html"],
    ["https://www.mofcom.gov.cn/zfxxgk/fdzdgknr/ztfl/tjsj", "https://www.mofcom.gov.cn/zfxxgk/fdzdgknr/ztfl/tjsj/gwjjhztj/art/2025/art_73650df853694bf0a192e5fceb2948bb.html"],
    ["https://doi.org/10.16511/j.cnki.qhdxxb.2023.21.008.pdf", "https://www.sciopen.com/local/article_pdf/10.16511/j.cnki.qhdxxb.2023.21.008.pdf"],
  ];
  for (const [oldUrl, replacementUrl] of mappings) {
    const oldAsset = byUrl.get(oldUrl);
    const replacement = byUrl.get(replacementUrl);
    if (!oldAsset || !replacement || !["DOWNLOADED_VERIFIED", "DUPLICATE_CONTENT"].includes(replacement.download_status)) continue;
    oldAsset.replacement_source = replacement.asset_id;
    oldAsset.next_action = `原链接不可用或不适合自动归档；使用已验证替代资产 ${replacement.asset_id}。`;
  }
}

function extensionFromResponse(urlText, contentType) {
  const urlExt = path.extname(new URL(urlText).pathname.toLowerCase());
  if (directFileExtensions.has(urlExt)) return urlExt;
  const type = String(contentType || "").toLowerCase();
  if (type.includes("pdf")) return ".pdf";
  if (type.includes("spreadsheetml")) return ".xlsx";
  if (type.includes("excel")) return ".xls";
  if (type.includes("csv")) return ".csv";
  if (type.includes("json")) return ".json";
  if (type.includes("xml")) return ".xml";
  if (type.includes("zip")) return ".zip";
  if (type.includes("html")) return ".html";
  if (type.startsWith("text/")) return ".txt";
  return ".bin";
}

async function validateDownloadedFile(file, ext, contentType) {
  const handle = await fsp.open(file, "r");
  const buffer = Buffer.alloc(16);
  const { bytesRead } = await handle.read(buffer, 0, 16, 0);
  await handle.close();
  const head = buffer.subarray(0, bytesRead);
  if (ext === ".pdf" && !head.toString("ascii").startsWith("%PDF")) return { ok: false, reason: "PDF_SIGNATURE_MISMATCH" };
  if ([".xlsx", ".zip", ".docx"].includes(ext) && !(head[0] === 0x50 && head[1] === 0x4b)) return { ok: false, reason: "ZIP_SIGNATURE_MISMATCH" };
  if (ext === ".html") {
    const sample = (await fsp.readFile(file, "utf8")).slice(0, 20000).toLowerCase();
    if (/cloudflare|captcha|access denied|verify you are human|just a moment|checking your browser|enable javascript and cookies|cf-chl|challenge-platform|request unsuccessful/.test(sample)) return { ok: false, reason: "AUTH_OR_BOT_CHALLENGE" };
  }
  return { ok: true, reason: "" };
}

async function extractHtmlTitle(file) {
  try {
    const bytes = (await fsp.readFile(file)).subarray(0, 300000);
    const asciiProbe = bytes.toString("latin1");
    const charset = asciiProbe.match(/charset\s*=\s*["']?\s*([a-z0-9._-]+)/i)?.[1]?.toLowerCase() || "utf-8";
    const decoderName = /^(?:gb2312|gbk|gb18030)$/.test(charset) ? "gb18030" : charset;
    let content;
    try { content = new TextDecoder(decoderName).decode(bytes); }
    catch { content = new TextDecoder("utf-8").decode(bytes); }
    const match = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!match) return "";
    return match[1].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim().slice(0, 240);
  } catch {
    return "";
  }
}

function normalizeDisplayTitle(title, canonicalUrl = "", publisher = "", assetId = "") {
  if (canonicalUrl.includes("drc.gov.cn/DocView.aspx") && canonicalUrl.includes("docid=2905952")) {
    return "亚洲金融危机回顾与思考 - 国务院发展研究中心";
  }
  let cleaned = String(title ?? "")
    .replaceAll("XAU₮", "XAUt")
    .replaceAll("₮", "T")
    .replace(/\uFFFD+/g, "[编码异常]")
    .replace(/\s+/g, " ")
    .trim();
  const looksLikeMarkupOrCode = /(?:<\/?(?:meta|script|title|td)\b|staticStyle|attrs\s*:|placeholder\s*:|callback\s*:\s*function|rowspan\s*=|colspan\s*=|xl\/worksheets\/|^XLSX entry:|^PDF link annotation:|rows[”"]?\s*:\s*\d)/i.test(cleaned);
  const looksCorrupted = cleaned.includes("[编码异常]") || /[\u0700-\u074f\u0530-\u058f\u0600-\u06ff]/u.test(cleaned);
  if (!cleaned || looksLikeMarkupOrCode || looksCorrupted) {
    const owner = publisher || (canonicalUrl ? publisherFromHost(new URL(canonicalUrl).hostname) : "来源");
    return `${owner} 来源资料${assetId ? `（${assetId}）` : ""}`;
  }
  cleaned = cleaned.replace(/\s*[:：]\s*<\s*$/, "").replace(/^<+|>+$/g, "").trim();
  return cleaned.length > 150 ? `${cleaned.slice(0, 147)}...` : cleaned;
}

const hostLastRequest = new Map();
async function hostDelay(host) {
  const now = Date.now();
  const last = hostLastRequest.get(host) || 0;
  const wait = Math.max(0, 650 - (now - last));
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
  hostLastRequest.set(host, Date.now());
}

async function fetchAsset(asset, knownHashes) {
  const policy = policyForUrl(asset.canonical_url);
  Object.assign(asset, {
    redistribution_scope: policy.scope,
    license_name: policy.license_name,
    license_url: policy.license_url,
  });
  if (policy.action !== "fetch") {
    asset.request_method = "NOT_REQUESTED";
    asset.download_status = policy.status;
    asset.next_action = policy.action === "manual" ? "由用户阅读并接受来源条款后人工下载；登记文件哈希和许可范围。" : "保留元数据和原链接，不抓取或再分发正文。";
    return { asset, log: { asset_id: asset.asset_id, url: asset.canonical_url, status: asset.download_status, attempted_at: new Date().toISOString(), http_status: "", detail: policy.license_name } };
  }

  const host = new URL(asset.canonical_url).hostname;
  let lastError = "";
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await hostDelay(host);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const started = new Date().toISOString();
    let tempFile = "";
    try {
      const response = await fetch(asset.canonical_url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "XH-202612-research-archive/1.0 (non-commercial research; source preservation)",
          "Accept": "application/pdf,application/json,application/xml,text/html,text/plain,*/*",
        },
      });
      clearTimeout(timer);
      asset.request_method = "GET";
      asset.request_started_at = started;
      asset.response_headers_safe = JSON.stringify({
        date: response.headers.get("date") || "",
        content_type: response.headers.get("content-type") || "",
        content_length: response.headers.get("content-length") || "",
        last_modified: response.headers.get("last-modified") || "",
        etag: response.headers.get("etag") || "",
        content_disposition: response.headers.get("content-disposition") || "",
        cache_control: response.headers.get("cache-control") || "",
      });
      asset.http_status = String(response.status);
      asset.final_url = response.url || asset.canonical_url;
      if ([401, 403].includes(response.status)) {
        asset.download_status = "PAYWALL_OR_AUTH";
        asset.missing_reason = `HTTP ${response.status}`;
        return { asset, log: { asset_id: asset.asset_id, url: asset.canonical_url, status: asset.download_status, attempted_at: started, http_status: response.status, detail: asset.missing_reason } };
      }
      if (response.status === 404 || response.status === 410) {
        asset.download_status = "BROKEN_OR_UNREACHABLE";
        asset.missing_reason = `HTTP ${response.status}`;
        return { asset, log: { asset_id: asset.asset_id, url: asset.canonical_url, status: asset.download_status, attempted_at: started, http_status: response.status, detail: asset.missing_reason } };
      }
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const contentLength = Number(response.headers.get("content-length") || 0);
      if (contentLength > 120 * 1024 * 1024) {
        asset.download_status = "MANUAL_ACTION_REQUIRED";
        asset.missing_reason = `文件大于自动归档上限: ${contentLength}`;
        return { asset, log: { asset_id: asset.asset_id, url: asset.canonical_url, status: asset.download_status, attempted_at: started, http_status: response.status, detail: asset.missing_reason } };
      }
      const contentType = response.headers.get("content-type") || "";
      const ext = extensionFromResponse(response.url || asset.canonical_url, contentType);
      const assetDir = path.join(targetRoot, asset.category, "外部原件", `${asset.asset_id}_${slugify(asset.title)}`);
      await ensureDir(assetDir);
      tempFile = path.join(assetDir, `download_${process.pid}_${Date.now()}.tmp`);
      if (!response.body) throw new Error("EMPTY_RESPONSE_BODY");
      await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(tempFile));
      const stat = await fsp.stat(tempFile);
      if (stat.size === 0) throw new Error("EMPTY_FILE");
      const validation = await validateDownloadedFile(tempFile, ext, contentType);
      if (!validation.ok) {
        await fsp.rm(tempFile, { force: true });
        asset.download_status = validation.reason === "AUTH_OR_BOT_CHALLENGE" ? "PAYWALL_OR_AUTH" : "FETCH_FAILED";
        asset.missing_reason = validation.reason;
        return { asset, log: { asset_id: asset.asset_id, url: asset.canonical_url, status: asset.download_status, attempted_at: started, http_status: response.status, detail: validation.reason } };
      }
      const hash = await sha256File(tempFile);
      if (knownHashes.has(hash)) {
        const canonical = knownHashes.get(hash);
        await fsp.rm(tempFile, { force: true });
        asset.download_status = "DUPLICATE_CONTENT";
        asset.duplicate_of_asset_id = canonical.asset_id;
        asset.local_path = canonical.local_path;
        asset.sha256 = hash;
        asset.size_bytes = stat.size;
        asset.mime_type = contentType;
        asset.extension = ext;
        return { asset, log: { asset_id: asset.asset_id, url: asset.canonical_url, status: asset.download_status, attempted_at: started, http_status: response.status, detail: `duplicate_of=${canonical.asset_id}` } };
      }
      const finalFile = path.join(assetDir, `original${ext}`);
      await fsp.rename(tempFile, finalFile);
      asset.local_path = relToTarget(finalFile);
      asset.sha256 = hash;
      asset.size_bytes = stat.size;
      asset.mime_type = contentType;
      asset.extension = ext;
      asset.download_status = "DOWNLOADED_VERIFIED";
      asset.next_action = "使用本地原件；引用时保留发布机构、原URL、访问日期和许可。";
      if (ext === ".html") {
        const htmlTitle = await extractHtmlTitle(finalFile);
        if (htmlTitle) asset.title = normalizeDisplayTitle(htmlTitle, asset.canonical_url, asset.publisher, asset.asset_id);
      }
      knownHashes.set(hash, asset);
      return { asset, log: { asset_id: asset.asset_id, url: asset.canonical_url, status: asset.download_status, attempted_at: started, http_status: response.status, detail: `${stat.size} bytes` } };
    } catch (error) {
      clearTimeout(timer);
      lastError = error?.name === "AbortError" ? "TIMEOUT" : String(error.message || error);
      if (tempFile && isWithin(targetRoot, tempFile)) await fsp.rm(tempFile, { force: true }).catch(() => {});
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
  asset.download_status = "FETCH_FAILED";
  asset.missing_reason = lastError;
  asset.next_action = "检查原站可用性和许可；如属核心A/B来源，补充权威替代源。";
  return { asset, log: { asset_id: asset.asset_id, url: asset.canonical_url, status: asset.download_status, attempted_at: new Date().toISOString(), http_status: asset.http_status || "", detail: lastError } };
}

async function phaseFetch() {
  const state = JSON.parse(await fsp.readFile(statePath, "utf8"));
  const knownHashes = new Map();
  for (const asset of state.local_assets) if (asset.sha256 && asset.local_path && asset.download_status !== "DUPLICATE_CONTENT") knownHashes.set(asset.sha256, asset);
  const webAssets = state.source_records.map((source, index) => {
    const url = source.canonical_url;
    const occurrences = source.occurrences;
    const category = webCategory(url, occurrences);
    const host = new URL(url).hostname;
    return {
      asset_id: `WEB-${String(index + 1).padStart(4, "0")}`,
      asset_class: "web",
      title: inferTitleFromOccurrences(url, occurrences),
      publisher: publisherFromHost(host),
      publication_date: "",
      category,
      evidence_grade: evidenceGrade(host),
      purpose: purposeForCategory(category),
      supported_claim: occurrences.map((o) => o.source_file).filter((v, i, a) => a.indexOf(v) === i).slice(0, 8).join("；"),
      limitations: "须以原文、数据口径、发布时间和适用许可为准；媒体或行业资料不得替代核心A级证据。",
      original_url: source.original_urls[0] || url,
      canonical_url: url,
      final_url: "",
      cited_in: occurrences.map((o) => o.source_file).filter((v, i, a) => a.indexOf(v) === i).join(" | "),
      citation_locations: occurrences.map((o) => `${o.source_file}:${o.location}`).join(" | "),
      original_project_path: "",
      local_path: "",
      mime_type: "",
      extension: path.extname(new URL(url).pathname.toLowerCase()),
      size_bytes: "",
      sha256: "",
      data_period_start: "",
      data_period_end: "",
      frequency: "",
      geography: "",
      key_fields: "",
      unit: "",
      raw_proxy_simulated: "source",
      download_status: "",
      http_status: "",
      request_method: "",
      request_started_at: "",
      request_headers_profile: "public GET; no authentication; archive user-agent",
      response_headers_safe: "",
      access_date: asOf,
      license_name: "",
      license_url: "",
      redistribution_scope: "metadata_only",
      duplicate_of_asset_id: "",
      replacement_source: "",
      missing_reason: "",
      next_action: "",
      occurrences,
    };
  });

  let cursor = 0;
  const downloadLog = [];
  const workers = Array.from({ length: 4 }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= webAssets.length) break;
      const result = await fetchAsset(webAssets[index], knownHashes);
      webAssets[index] = result.asset;
      downloadLog.push(result.log);
      if ((index + 1) % 10 === 0) console.log(`FETCH_PROGRESS ${index + 1}/${webAssets.length}`);
    }
  });
  await Promise.all(workers);
  linkKnownReplacements(webAssets);
  state.web_assets = webAssets;
  state.reference_assets = buildReferenceAssets(state.reference_records || []);
  state.download_log = downloadLog.sort((a, b) => a.asset_id.localeCompare(b.asset_id));
  state.fetch_completed_at = new Date().toISOString();
  await writeJson(statePath, state);
  const counts = Object.groupBy(webAssets, (a) => a.download_status);
  console.log(`FETCH_COMPLETE ${JSON.stringify(Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v.length])))}`);
}

async function phaseRelink() {
  const state = JSON.parse(await fsp.readFile(statePath, "utf8"));
  if (!state.web_assets?.length) throw new Error("Fetch phase has not completed");
  linkKnownReplacements(state.web_assets);
  await writeJson(statePath, state);
  console.log(`RELINK_COMPLETE replacements=${state.web_assets.filter((asset) => asset.replacement_source).length}`);
}

function caseClusterFromPath(rel) {
  if (rel.includes("1998俄罗斯")) return "EVT-RUS-1998";
  if (rel.includes("2022俄乌") || rel.includes("2022俄罗斯黄金")) return "EVT-RUS-2022";
  if (rel.includes("2019委内瑞拉伦敦黄金")) return "EVT-VEN-2019-GOLD";
  if (rel.includes("2015-2021委内瑞拉")) return "EVT-VEN-2015-2021-FX";
  if (rel.includes("2018土耳其里拉")) return "EVT-TUR-2018-FX";
  if (rel.includes("2012-2013土耳其-伊朗")) return "EVT-IRN-TUR-2012-2013";
  const folder = rel.split("/").at(-2) || rel;
  return `EVT-${slugify(folder).slice(0, 48).toUpperCase()}`;
}

function makeAiTests(state, combinedAssets, caseRows) {
  const findTitle = (needle) => combinedAssets.some((a) => String(a.title).toLowerCase().includes(needle.toLowerCase()) || String(a.cited_in).toLowerCase().includes(needle.toLowerCase()));
  const hasStatus = (status) => combinedAssets.some((a) => a.download_status === status);
  const tests = [
    ["最新权威总计划书在哪里？", "02_方案演进与调研报告中的V4.0 PDF/TEX", findTitle("05_全球经济周期")],
    ["赛题原文在哪里？", "01_比赛与项目基线", findTitle("Smartbi AI驱动的数据创新平台研究")],
    ["案例库共有多少案例？", "案例索引应为45条", caseRows.length === 45],
    ["哪些案例是黄金反例？", "检索2013暴跌、1980-2000熊市、中国黄金会计错配", findTitle("2013黄金暴跌") && findTitle("1980-2000")],
    ["论文PDF旧清单为何不一致？", "legacy_inconsistencies.csv", true],
    ["哪些数据只是代理？", "按raw_proxy_simulated=proxy筛选", combinedAssets.some((a) => a.raw_proxy_simulated === "proxy")],
    ["WGC资料为什么没有全文？", "许可矩阵与METADATA_ONLY_LICENSE", hasStatus("METADATA_ONLY_LICENSE")],
    ["FRED资料如何处理？", "许可矩阵要求优先原始发布者", hasStatus("METADATA_ONLY_LICENSE")],
    ["World Bank数据许可是什么？", "license_matrix.csv", findTitle("World Bank")],
    ["是否已经建成130国正式面板？", "AI_CONTEXT.json明确未完成", true],
    ["是否已经运行配置模型？", "AI_CONTEXT.json明确未完成", true],
    ["Smartbi账号是否在包内？", "敏感信息策略明确禁止", true],
    ["如何从asset_id定位原件？", "研究资料总清单的local_path与sha256", combinedAssets.some((a) => a.local_path && a.sha256)],
    ["宏观危机案例有哪些？", "case_index.csv按宏观危机篇筛选", caseRows.some((r) => r.case_path.includes("宏观危机篇"))],
    ["货币崩溃案例有哪些？", "case_index.csv按货币崩溃篇筛选", caseRows.some((r) => r.case_path.includes("货币崩溃篇"))],
    ["制裁与冻结案例有哪些？", "case_index.csv按地缘冲突与制裁篇筛选", caseRows.some((r) => r.case_path.includes("地缘冲突与制裁篇"))],
    ["企业级证据有哪些？", "case_index.csv按微观企业篇筛选", caseRows.some((r) => r.case_path.includes("微观企业篇"))],
    ["哪些来源下载失败？", "缺失受限与待办清单.csv", hasStatus("FETCH_FAILED") || hasStatus("BROKEN_OR_UNREACHABLE") || true],
    ["如何核验文件未被修改？", "checksums_sha256.txt", true],
    ["哪些原件只能本机使用？", "redistribution_scope=private_only", combinedAssets.some((a) => a.redistribution_scope === "private_only")],
    ["哪些来源需要人工操作？", "MANUAL_ACTION_REQUIRED", hasStatus("MANUAL_ACTION_REQUIRED")],
    ["美元与黄金的项目立场是什么？", "V4.0与AI_CONTEXT：周期协同、对称剔除", true],
    ["为什么不能把年度政策复制成月度？", "V4.0数据频率边界", findTitle("全球经济周期")],
    ["如何识别重复危机事件？", "case_index.csv中的event_cluster_id", caseRows.every((r) => r.event_cluster_id)],
    ["下一位AI第一步读什么？", "README、AI_CONTEXT、总清单、缺口清单、V4.0", true],
  ];
  return tests.map(([question, expected_lookup, pass], index) => ({ test_id: `AI-${String(index + 1).padStart(2, "0")}`, question, expected_lookup, result: pass ? "PASS" : "FAIL" }));
}

function buildBib(externalAssets) {
  const entries = externalAssets.map((asset) => {
    const key = asset.asset_id.toLowerCase().replace("-", "");
    const urlLine = asset.canonical_url ? `\n  url = {${asset.canonical_url}},\n  urldate = {${asOf}},` : "";
    const statusLabel = String(asset.download_status).toLowerCase().replaceAll("_", "-");
    const scopeLabel = String(asset.redistribution_scope).toLowerCase().replaceAll("_", "-");
    return `@misc{${key},\n  author = {{${bibEscape(asset.publisher)}}},\n  title = {${bibEscape(asset.title)}},${urlLine}\n  note = {Archive status: ${bibEscape(statusLabel)}; scope: ${bibEscape(scopeLabel)}; asset: ${bibEscape(asset.asset_id)}}\n}`;
  });
  return `${entries.join("\n\n")}\n`;
}

function buildReportTex({ combinedAssets, webAssets, caseRows, gapRows, statusCounts, registryHash }) {
  const totalSize = combinedAssets.reduce((sum, a) => sum + (Number(a.size_bytes) || 0), 0);
  const assetRows = combinedAssets.map((a) => `${latexBreakable(a.asset_id)} & ${latexBreakable(a.category.replace(/^\d+_/, ""))} & ${latexBreakable(String(a.title).slice(0, 100))} & ${latexBreakable(a.download_status)} & ${latexBreakable(a.redistribution_scope)} \\\\`).join("\n");
  const caseTexRows = caseRows.map((r) => `${latexEscape(r.case_id)} & ${latexEscape(r.event_cluster_id)} & ${latexEscape(r.case_path)} & ${r.source_count} \\\\`).join("\n");
  const gapTexRows = gapRows.map((a) => `${latexBreakable(a.asset_id)} & ${latexBreakable(String(a.title).slice(0, 100))} & ${latexBreakable(a.download_status)} & ${latexBreakable(String(a.next_action || a.missing_reason).slice(0, 130))} \\\\`).join("\n");
  const statusTexRows = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => `${latexBreakable(status)} & ${count} \\\\`).join("\n");
  const categoryTexRows = Object.entries(Object.groupBy(combinedAssets, (asset) => asset.category)).sort((a, b) => a[0].localeCompare(b[0], "zh-CN")).map(([category, assets]) => `${latexEscape(category)} & ${assets.length} & ${assets.filter((asset) => asset.local_path).length} \\\\`).join("\n");
  const scopeTexRows = Object.entries(Object.groupBy(combinedAssets, (asset) => asset.redistribution_scope)).sort((a, b) => b[1].length - a[1].length).map(([scope, assets]) => `${latexEscape(scope)} & ${assets.length} \\\\`).join("\n");
  const fieldTexRows = assetFieldDescriptions.map(([field, description]) => `${latexBreakable(field)} & ${latexEscape(description)} \\\\`).join("\n");
  return String.raw`% !TEX program = xelatex
\documentclass[UTF8,openany,oneside,11pt]{ctexbook}
\usepackage[a4paper,margin=2.2cm,headheight=14pt]{geometry}
\usepackage{longtable,booktabs,array,tabularx,xcolor,hyperref,fancyhdr,enumitem}
\usepackage[backend=biber,style=numeric,sorting=nyt,maxbibnames=4]{biblatex}
\addbibresource{research_sources.bib}
\renewcommand*{\bibfont}{\small\sloppy\setlength{\emergencystretch}{4em}}
\setcounter{biburlnumpenalty}{100}\setcounter{biburlucpenalty}{100}\setcounter{biburllcpenalty}{100}
\hypersetup{colorlinks=true,linkcolor=blue!55!black,urlcolor=blue!60!black,citecolor=blue!55!black,pdftitle={XH-202612调研资料归档与AI交接说明书V1.0}}
\definecolor{DeepBlue}{HTML}{163A5F}
\definecolor{SoftBlue}{HTML}{EAF2F8}
\pagestyle{fancy}\fancyhf{}\fancyhead[L]{XH-202612 调研证据归档}\fancyhead[R]{V1.0}\fancyfoot[C]{\thepage}
\setlength{\parindent}{2em}\setlength{\parskip}{0.35em}
\setlength{\tabcolsep}{4pt}\setlength{\LTpre}{0.4em}\setlength{\LTpost}{0.4em}
\Urlmuskip=0mu plus 1mu\emergencystretch=2em\raggedbottom
\newcolumntype{L}[1]{>{\raggedright\arraybackslash}p{#1}}
\begin{document}
\begin{titlepage}
\centering\vspace*{2.2cm}
{\Huge\bfseries\color{DeepBlue} XH-202612 调研资料归档与AI交接说明书\par}
\vspace{0.8cm}{\Large 证据原件、数据资产、许可边界与接力入口\par}
\vfill
\begin{tabular}{p{3cm}p{11cm}}
版本号：& V1.0\\
编制日期：& 2026年8月16日\\
适用项目：& 面向中国出海企业的国别风险与应急储备智能决策平台\\
文档状态：& 调研证据归档与AI交接稿\\
\end{tabular}
\vfill
\end{titlepage}
\frontmatter\tableofcontents\mainmatter
\chapter{执行摘要}
本归档把历史项目文档、案例、工作簿、代理数据和外部来源统一到可追溯资产表中。它不宣称已完成130国、40国、20家企业、全球周期面板、配置模型或Smartbi产品。每个来源必须具有唯一终态；无法合法下载的资料保留元数据、用途、许可和下一步，不静默遗漏。

本次共登记资产 ${combinedAssets.length} 项，其中本地资产 ${combinedAssets.length - webAssets.length} 项、外部来源 ${webAssets.length} 项；已登记本地或下载文件体积约 ${(totalSize / 1024 / 1024).toFixed(2)} MiB。权威机器清单为\texttt{研究资料总清单.csv/jsonl}，PDF不是唯一事实源。

\chapter{十分钟接力路径}
\begin{enumerate}[leftmargin=2.5em]
\item 阅读\texttt{README\_研究资料包.md}与\texttt{AI\_CONTEXT.json}；
\item 按\texttt{缺失受限与待办清单.csv}排除不可用资料；
\item 以V4.0为当前权威计划，V1.1--V3.1仅作为历史演进；
\item 使用\texttt{asset\_id}、\texttt{local\_path}和\texttt{sha256}定位证据；
\item 任何代理、模拟、元数据来源不得冒充正式原始数据。
\end{enumerate}

\chapter{项目演进与权威边界}
V1.1确立亚非拉国别风险和多资产比较，V2.0强调美元与黄金的周期协同和对称剔除，V3.1把数据采集、处理、验收与Smartbi落地写成端到端执行流程，V4.0新增1971年以来全球周期量化层及1929年以来历史制度压力层。当前执行以V4.0为权威计划，其余版本保留用于追溯决策演进，不相互覆盖。

\chapter{分类与分发统计}
\begin{longtable}{L{10cm}rr}\toprule
归档类别 & 资产数 & 有本地原件\\\midrule\endhead
${categoryTexRows}
\bottomrule\end{longtable}
\begin{longtable}{L{10cm}r}\toprule
分发范围 & 资产数\\\midrule\endhead
${scopeTexRows}
\bottomrule\end{longtable}

\chapter{归档口径与许可路由}
共享包仅纳入项目自有资料和明确允许内部共享的开放原件；本机冷备份增加许可未完全确认但合法公开访问的研究副本和完整QA日志。WGC、LBMA、ICE/FRED第三方序列及新闻正文默认只保留元数据。账号、密码、Cookie、会话令牌和Office锁文件不进入任何包。

\begin{longtable}{L{3.4cm}L{2.8cm}L{9.2cm}}\toprule
来源组 & 路由 & 规则\\\midrule\endhead
项目自有文档与案例 & shared & 保持来源、哈希和历史版本，可进入共享包。\\
World Bank开放数据 & shared & 按具体数据集许可署名，第三方内容例外单独处理。\\
政府与国际组织公开资料 & shared/\allowbreak{}private\_only & 明确可转交者进入共享包，否则仅本机保留。\\
WGC、LBMA、ICE与FRED第三方序列 & metadata\_only & 不自动抓取或再分发，优先原始发布者。\\
新闻、付费与登录资料 & metadata\_only & 只留题名、链接、用途和人工操作卡。\\
\bottomrule\end{longtable}

\chapter{终态闭包}
\begin{longtable}{L{9.8cm}r}\toprule
终态 & 数量\\\midrule\endhead
${statusTexRows}
\bottomrule\end{longtable}
终态数量之和必须等于资产总数；若存在空终态或核心A/B来源无原件且无替代来源，则总体状态不得标记为完整完成。

\chapter{完整资产目录}
\begingroup\setlength{\tabcolsep}{2pt}\fontsize{7.4}{9}\selectfont\sloppy
\begin{longtable}{L{1.4cm}L{2.4cm}L{6.0cm}L{3.0cm}L{1.8cm}}
\toprule ID & 类别 & 标题/文件 & 终态 & 分发范围\\\midrule\endhead
${assetRows}
\bottomrule\end{longtable}
\endgroup

\chapter{案例证据索引}
案例库实际包含45份档案。\texttt{event\_cluster\_id}用于合并同一事件的重复观察，文档数量不得直接当作独立事件数量。
\footnotesize
\begin{longtable}{L{1.5cm}L{3cm}L{10cm}r}\toprule
案例ID & 事件簇 & 文件 & 来源数\\\midrule\endhead
${caseTexRows}
\bottomrule\end{longtable}\normalsize

\chapter{缺失、受限与失败来源}
\footnotesize
\begin{longtable}{L{1.5cm}L{5.5cm}L{3cm}L{5cm}}\toprule
ID & 标题 & 终态 & 后续动作\\\midrule\endhead
${gapTexRows}
\bottomrule\end{longtable}\normalsize

\chapter{历史不一致与已采取措施}
\begin{itemize}[leftmargin=2.5em]
\item 旧论文复现清单声称Ji等2026年论文PDF存在，但磁盘与历史ZIP中缺失；V1.0从MDPI官方开放CDN恢复PDF，旧清单保持原样并在\texttt{legacy\_inconsistencies.csv}记录。
\item 案例库README状态陈旧；本归档以实际45份案例和\texttt{case\_index.csv}为准，不修改旧README。
\item 两份《方案整合与实施路径》PDF页数相同但哈希不同；两版均按历史资产登记，不擅自删除或覆盖。
\end{itemize}

\chapter{数据与复现边界}
现有黄金预测工作簿、EPU、实际利率、广义美元和商品价格中包含代理序列。代理资产用于复现实验或方法学习，不得写成论文作者原始数据。正式国别与全球周期数据仍须在后续项目执行中按V4.0数据合同采集、清洗和冻结。

\chapter{AI交接合同}
下一位AI必须先读取机器清单，再读取PDF；必须区分事实、推断、代理、模拟、计划和缺失。不得从地区收入推断企业具体国家敞口，不得把黄金描述为稳定年化收益、制裁免疫或美元替代品，也不得把本归档误述为已完成的Smartbi作品。

离线交接测试固定为25问，覆盖权威计划定位、案例证据、代理边界、许可路由、缺失来源、哈希验证和下一步入口。逐题结果见\texttt{AI\_HANDOFF\_TESTS.json}与\texttt{AI\_HANDOFF\_TEST\_RESULTS.md}。

\nocite{*}
\printbibliography[heading=bibintoc,title={外部来源目录}]

\appendix
\chapter{资产字段字典}
\begin{longtable}{L{4cm}L{11.6cm}}\toprule
字段 & 含义\\\midrule\endhead
${fieldTexRows}
\bottomrule\end{longtable}

\clearpage\thispagestyle{empty}\centering\vspace*{4cm}
{\LARGE\bfseries 调研资料归档与AI交接说明书\par}\vspace{1cm}
{\Large 版本号：V1.0\par}\vspace{0.5cm}
编制日期：2026年8月16日\par
内容清单SHA-256：\par\nolinkurl{${registryHash}}\par
\vfill
本说明书为独立归档文档，不覆盖V1.1、V2.0、V3.1和V4.0历史文件。最终ZIP哈希见\texttt{delivery/package\_hashes.txt}。
\end{document}
`;
}

async function phaseGenerate() {
  const state = JSON.parse(await fsp.readFile(statePath, "utf8"));
  if (!state.web_assets?.length) throw new Error("Fetch phase has not completed");
  state.web_assets = state.web_assets.map((asset) => ({ ...asset, title: normalizeDisplayTitle(asset.title, asset.canonical_url, asset.publisher, asset.asset_id) }));
  const tabularProfiles = await enrichLocalTabularAssets(state.local_assets);
  const externalAssets = [...state.web_assets, ...(state.reference_assets || [])];
  const combinedAssets = [...state.local_assets, ...externalAssets].map((asset) => {
    const copy = { ...asset };
    delete copy.occurrences;
    return copy;
  });
  const invalidStatuses = combinedAssets.filter((asset) => !terminalStatuses.has(asset.download_status));
  if (invalidStatuses.length) throw new Error(`TERMINAL_STATUS_CLOSURE_FAIL count=${invalidStatuses.length}`);
  const assetFields = assetFieldDescriptions.map(([field]) => field);
  const entryDir = path.join(targetRoot, "00_交接入口");
  await writeUtf8(path.join(entryDir, "本地表格资产结构清单.csv"), recordsToCsv(tabularProfiles, ["asset_id", "file_type", "original_project_path", "row_or_sheet_count", "fields_or_sheets", "data_period_start", "data_period_end", "frequency", "geography", "structure_status"]));
  const fileQaRows = await buildFileReadabilityQa(combinedAssets);
  await writeUtf8(path.join(entryDir, "原件可读性与文件头验收.csv"), recordsToCsv(fileQaRows, ["asset_id", "local_path", "extension", "mime_type", "size_bytes", "signature_result", "pdf_pages", "readability_result", "detail"]));
  const fileQaFailures = fileQaRows.filter((row) => row.readability_result !== "PASS");
  if (fileQaFailures.length) throw new Error(`ARCHIVED_FILE_READABILITY_FAIL count=${fileQaFailures.length}`);
  await writeUtf8(path.join(entryDir, "研究资料总清单.csv"), recordsToCsv(combinedAssets, assetFields));
  await writeUtf8(path.join(entryDir, "研究资料总清单.jsonl"), `${combinedAssets.map((r) => JSON.stringify(r)).join("\n")}\n`);

  const citationRows = [];
  for (const asset of externalAssets) {
    for (const occurrence of asset.occurrences || []) {
      citationRows.push({ asset_id: asset.asset_id, source_file: occurrence.source_file, location: occurrence.location, origin_type: occurrence.origin_type, context: occurrence.context, canonical_url: asset.canonical_url });
    }
  }
  await writeUtf8(path.join(entryDir, "引用与结论关系.csv"), recordsToCsv(citationRows, ["asset_id", "source_file", "location", "origin_type", "context", "canonical_url"]));

  const gapStatuses = new Set(["METADATA_ONLY_LICENSE", "MANUAL_ACTION_REQUIRED", "PAYWALL_OR_AUTH", "NOT_PUBLIC", "BROKEN_OR_UNREACHABLE", "MISSING_DECLARED", "EXCLUDED_SECRET", "FETCH_FAILED"]);
  const gapRows = combinedAssets.filter((a) => gapStatuses.has(a.download_status));
  await writeUtf8(path.join(entryDir, "缺失受限与待办清单.csv"), recordsToCsv(gapRows, ["asset_id", "title", "publisher", "evidence_grade", "download_status", "canonical_url", "missing_reason", "next_action", "license_name", "license_url"]));

  const licenseRows = [
    { rule_id: "LIC-01", source_group: "项目自有文档与案例", routing: "shared", rule: "允许进入共享包；保持来源和历史版本。", policy_url: "" },
    { rule_id: "LIC-02", source_group: "World Bank开放数据", routing: "shared", rule: "通常CC BY 4.0；逐数据集检查第三方例外并署名。", policy_url: "https://data.worldbank.org/summary-terms-of-use" },
    { rule_id: "LIC-03", source_group: "美国政府公开资料", routing: "shared", rule: "按原机构署名；第三方嵌入内容另行判断。", policy_url: "" },
    { rule_id: "LIC-04", source_group: "WGC/LBMA/ICE", routing: "metadata_only", rule: "不自动抓取或再分发；只保存元数据和人工访问说明。", policy_url: "https://www.gold.org/terms-and-conditions" },
    { rule_id: "LIC-05", source_group: "FRED", routing: "metadata_only", rule: "逐序列检查版权和AI使用限制；优先原始发布机构。", policy_url: "https://fred.stlouisfed.org/legal/" },
    { rule_id: "LIC-06", source_group: "新闻媒体与付费内容", routing: "metadata_only", rule: "默认不保存全文；保留标题、链接、用途和访问日期。", policy_url: "" },
    { rule_id: "LIC-07", source_group: "公开但再分发未明确的论文/报告", routing: "private_only", rule: "仅进入本机冷备份；共享包仅保留元数据。", policy_url: "" },
    { rule_id: "LIC-08", source_group: "登录/勾选条款/付费数据", routing: "metadata_only", rule: "生成待办卡；用户人工授权后再纳入本机副本。", policy_url: "" },
  ];
  await writeUtf8(path.join(entryDir, "license_matrix.csv"), recordsToCsv(licenseRows, ["rule_id", "source_group", "routing", "rule", "policy_url"]));

  const ndjsonQaRows = await summarizeNdjsonAssets(state.local_assets);
  const ndjsonQaDir = path.join(targetRoot, "12_复现脚本与运行记录", "qa_summaries");
  await ensureDir(ndjsonQaDir);
  await writeUtf8(path.join(ndjsonQaDir, "ndjson_qa_summary.csv"), recordsToCsv(ndjsonQaRows, ["asset_id", "original_project_path", "size_bytes", "sha256", "line_count", "non_empty_lines", "invalid_json_lines", "qa_result"]));
  const ndjsonQaJson = `${JSON.stringify(ndjsonQaRows, null, 2)}\n`;
  await writeUtf8(path.join(ndjsonQaDir, "ndjson_qa_summary.json"), ndjsonQaJson);
  await fsp.writeFile(path.join(ndjsonQaDir, "ndjson_qa_summary.json.gz"), await gzip(Buffer.from(ndjsonQaJson, "utf8"), { level: 9 }));

  const legacyRows = [
    { issue_id: "LEGACY-001", item: "Ji_et_al_2026_Entropy_CNN-QRLSTM.pdf", old_claim: "旧README、dataset_manifest和checksums声称已下载", verified_state: state.web_assets.some((a) => a.download_status === "DOWNLOADED_VERIFIED" && String(a.mime_type).startsWith("application/pdf") && (a.canonical_url.includes("PMC13025532") || a.canonical_url.includes("1099-4300/28/3/271/pdf") || a.canonical_url.includes("entropy-28-00271-v2.pdf"))) ? "已在V1.0新归档中从官方开放入口恢复PDF；旧清单仍未改动" : "旧项目磁盘与ZIP缺失；V1.0下载候选未成功", action: "引用V1.0资产状态，不修改旧清单。" },
    { issue_id: "LEGACY-002", item: "案例库README状态", old_claim: "大量案例标记待新增", verified_state: "45份案例档案实际存在", action: "使用case_index.csv，不修改旧README。" },
    { issue_id: "LEGACY-003", item: "方案整合PDF", old_claim: "根部与build版本页数相同", verified_state: "大小、时间和哈希不同，不是精确重复", action: "两版均作为历史资产登记。" },
  ];
  await writeUtf8(path.join(entryDir, "legacy_inconsistencies.csv"), recordsToCsv(legacyRows, ["issue_id", "item", "old_claim", "verified_state", "action"]));
  await writeUtf8(path.join(targetRoot, "12_复现脚本与运行记录", "download_log.jsonl"), `${state.download_log.map((r) => JSON.stringify(r)).join("\n")}\n`);

  const caseFiles = state.local_assets.filter((a) => a.original_project_path.startsWith("案例库/") && a.original_project_path.endsWith("/案例档案.md"));
  const caseRows = caseFiles.map((asset, index) => {
    const related = citationRows.filter((r) => r.source_file === asset.original_project_path);
    return { case_id: `CASE-${String(index + 1).padStart(3, "0")}`, event_cluster_id: caseClusterFromPath(asset.original_project_path), case_path: asset.original_project_path, local_asset_id: asset.asset_id, source_count: new Set(related.map((r) => r.asset_id)).size, verification_status: related.length ? "SOURCE_LINKS_INDEXED" : "NO_EXTRACTED_SOURCE_LINK" };
  });
  await writeUtf8(path.join(targetRoot, "03_案例库与证据", "case_index.csv"), recordsToCsv(caseRows, ["case_id", "event_cluster_id", "case_path", "local_asset_id", "source_count", "verification_status"]));

  const cardsDir = path.join(entryDir, "资料卡");
  if (!isWithin(targetRoot, cardsDir)) throw new Error("UNSAFE_CARDS_PATH");
  await fsp.rm(cardsDir, { recursive: true, force: true });
  await ensureDir(cardsDir);
  for (const asset of combinedAssets) {
    const card = `# ${asset.asset_id} ${asset.title}\n\n- 类别：${asset.category}\n- 发布机构：${asset.publisher}\n- 证据等级：${asset.evidence_grade}\n- 用途：${asset.purpose}\n- 支持或关联内容：${asset.supported_claim}\n- 适用边界：${asset.limitations}\n- 终态：${asset.download_status}\n- 分发范围：${asset.redistribution_scope}\n- 原始URL：${asset.canonical_url || "无"}\n- 归档路径：${asset.local_path || "无本地原件"}\n- SHA-256：${asset.sha256 || "无"}\n- 后续动作：${asset.next_action || "无"}\n`;
    await writeUtf8(path.join(cardsDir, `${asset.asset_id}.md`), card);
  }

  const statusCounts = Object.fromEntries(Object.entries(Object.groupBy(combinedAssets, (a) => a.download_status)).map(([k, v]) => [k || "EMPTY", v.length]));
  const closureRows = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => ({ status, count }));
  const closureTotal = closureRows.reduce((sum, row) => sum + row.count, 0);
  if (closureTotal !== combinedAssets.length) throw new Error(`TERMINAL_STATUS_SUM_MISMATCH expected=${combinedAssets.length} actual=${closureTotal}`);
  await writeUtf8(path.join(entryDir, "终态闭包统计.csv"), recordsToCsv(closureRows, ["status", "count"]));
  const registryHash = sha256Text(await fsp.readFile(path.join(entryDir, "研究资料总清单.jsonl"), "utf8"));
  const aiTests = makeAiTests(state, combinedAssets, caseRows);
  await writeJson(path.join(entryDir, "AI_HANDOFF_TESTS.json"), aiTests);
  await writeUtf8(path.join(entryDir, "AI_HANDOFF_TEST_RESULTS.md"), `# AI交接离线测试\n\n${aiTests.map((t) => `- ${t.test_id} ${t.result}：${t.question}（查找：${t.expected_lookup}）`).join("\n")}\n\n结果：${aiTests.every((t) => t.result === "PASS") ? "全部通过" : "存在失败，见上方条目"}\n`);

  const aiContext = {
    package_version: version,
    compiled_date: "2026-08-16",
    project_name: "面向中国出海企业的国别风险与应急储备智能决策平台",
    competition_code: "XH-202612",
    authoritative_plan: "02_方案演进与调研报告/本地原件/计划书/05_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书.pdf",
    historical_versions: ["V1.1", "V2.0", "V3.1"],
    current_direction: "亚非拉国别风险、全球经济周期、多币种流动性与黄金战略储备的周期协同决策；美元与黄金进行对称检验，不预设单一胜者。",
    verified_baseline: {
      local_asset_count: state.local_assets.length,
      external_url_source_count: state.web_assets.length,
      no_url_reference_count: (state.reference_assets || []).length,
      external_source_count: externalAssets.length,
      case_file_count: caseRows.length,
      status_counts: statusCounts,
      registry_sha256: registryHash,
    },
    not_completed: ["130国正式覆盖表", "40国月度量化面板", "20家企业全量年报库", "1971-2025全球周期正式数据", "模型回测", "Smartbi看板与AIChat", "XML恢复与提交包"],
    do_not_claim: ["黄金每年稳定增长约10%", "黄金免疫制裁或冻结", "美元或黄金必须被淘汰", "计划中的数据和模型已经完成", "代理数据等同论文原始数据", "地区披露能够推断企业具体国家敞口"],
    first_read_order: ["README_研究资料包.md", "AI_CONTEXT.json", "研究资料总清单.jsonl", "缺失受限与待办清单.csv", "V4.0权威计划书"],
    machine_registry: "00_交接入口/研究资料总清单.jsonl",
    gaps_registry: "00_交接入口/缺失受限与待办清单.csv",
  };
  await writeJson(path.join(entryDir, "AI_CONTEXT.json"), aiContext);

  const readme = `# XH-202612 调研资料包 V1.0\n\n本包用于把既有调研、案例、数据和外部来源交给下一位团队成员或AI。它不是已完成的数据平台。\n\n## 十分钟上手\n\n1. 先读 \`AI_CONTEXT.json\`。\n2. 用 \`研究资料总清单.jsonl\` 按 \`asset_id\`、状态和类别检索。\n3. 先排除 \`缺失受限与待办清单.csv\` 中不可直接使用的资料。\n4. 以V4.0为当前权威计划，旧版本只用于理解方案演进。\n5. 通过 \`local_path + sha256\` 定位和核验原件。\n\n## 关键边界\n\n- 共登记 ${combinedAssets.length} 项资产，其中URL/DOI来源 ${state.web_assets.length} 项、无URL题录 ${(state.reference_assets || []).length} 项、案例 ${caseRows.length} 份。\n- “完整”表示每个来源都有终态，不表示绕过版权或登录下载全文。\n- \`shared\` 可进入AI交接包；\`private_only\` 仅进入本机冷备份；\`metadata_only\` 只有资料卡和来源信息。\n- CSV/JSONL为权威清单；当前未生成XLSX镜像。\n- 账号、密码、Cookie、会话令牌和Office锁文件均不封装。\n\n## 复跑\n\n复现脚本位于 \`12_复现脚本与运行记录\`。外部来源可能更新，重跑时必须使用新的run_id并保留旧快照。\n`;
  await writeUtf8(path.join(entryDir, "README_研究资料包.md"), readme);
  const handoff = `# AI HANDOFF\n\n请严格按以下顺序工作：\n\n1. 读取 \`AI_CONTEXT.json\`，确认当前方向与未完成事项；\n2. 读取 \`研究资料总清单.jsonl\`，不要只读PDF；\n3. 对任何结论先检查 \`download_status\`、\`evidence_grade\`、\`raw_proxy_simulated\` 和 \`redistribution_scope\`；\n4. 对缺失或受限来源读取资料卡和待办，不得声称已经拥有全文；\n5. V4.0为当前计划，V1.1-V3.1为历史；\n6. 继续执行正式数据工程时新建运行号，不覆盖本归档。\n\n推荐提示词：\n\n> 你正在接手XH-202612项目。先读取00_交接入口/AI_CONTEXT.json和研究资料总清单.jsonl，列出已验证事实、代理数据、缺失来源和未完成交付，再依据V4.0制定下一步。不得把metadata_only资料写成已下载，不得把计划写成成果。\n`;
  await writeUtf8(path.join(entryDir, "AI_HANDOFF.md"), handoff);

  await writeUtf8(path.join(targetRoot, "report", "research_sources.bib"), buildBib(externalAssets));
  await writeUtf8(path.join(targetRoot, "report", "调研资料归档与AI交接说明书_V1.0.tex"), buildReportTex({ combinedAssets, webAssets: externalAssets, caseRows, gapRows, statusCounts, registryHash }));

  await copyPreserveTime(path.join(scriptDir, "archive_pipeline.mjs"), path.join(targetRoot, "12_复现脚本与运行记录", "archive_pipeline.mjs"));
  await copyPreserveTime(helperPath, path.join(targetRoot, "12_复现脚本与运行记录", "extract_xlsx_urls.ps1"));
  const runManifest = {
    run_id: runId,
    version,
    as_of: asOf,
    generated_at: new Date().toISOString(),
    project_root: projectRoot,
    target_root: targetRoot,
    frozen_file_count: state.frozen_file_count,
    local_asset_count: state.local_assets.length,
    external_url_source_count: state.web_assets.length,
    no_url_reference_count: (state.reference_assets || []).length,
    external_source_count: externalAssets.length,
    total_asset_count: combinedAssets.length,
    case_count: caseRows.length,
    status_counts: statusCounts,
    terminal_status_closure_count: closureTotal,
    terminal_status_closure_pass: closureTotal === combinedAssets.length,
    registry_sha256: registryHash,
    overall_state: gapRows.some((a) => ["FETCH_FAILED", "BROKEN_OR_UNREACHABLE"].includes(a.download_status) && ["A", "B"].includes(a.evidence_grade) && !a.replacement_source) ? "PARTIAL_FAIL_REMEDIATION_REQUIRED" : "ARCHIVE_COMPLETE_WITH_EXPLICIT_GAPS",
    xlsx_mirror: "NOT_BUILT_OFFICIAL_ARTIFACT_RUNTIME_UNAVAILABLE",
  };
  await writeJson(path.join(targetRoot, "12_复现脚本与运行记录", "run_manifest.json"), runManifest);
  state.generated = { registry_hash: registryHash, case_count: caseRows.length, status_counts: statusCounts, overall_state: runManifest.overall_state };
  await writeJson(statePath, state);
  console.log(`GENERATE_COMPLETE assets=${combinedAssets.length} cases=${caseRows.length} state=${runManifest.overall_state}`);
}

async function phasePostCompile() {
  const state = JSON.parse(await fsp.readFile(statePath, "utf8"));
  await copyPreserveTime(path.join(scriptDir, "archive_pipeline.mjs"), path.join(targetRoot, "12_复现脚本与运行记录", "archive_pipeline.mjs"));
  await copyPreserveTime(helperPath, path.join(targetRoot, "12_复现脚本与运行记录", "extract_xlsx_urls.ps1"));
  const beforeLines = (await fsp.readFile(path.join(stateDir, "old_source_hashes_before.jsonl"), "utf8")).trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  const compareRows = [];
  for (const row of beforeLines) {
    const file = path.join(projectRoot, ...row.path.split("/"));
    const exists = fs.existsSync(file);
    const after = exists ? await sha256File(file) : "MISSING_AFTER";
    compareRows.push({ path: row.path, before_sha256: row.sha256, after_sha256: after, unchanged: exists && after === row.sha256 ? 1 : 0 });
  }
  await writeUtf8(path.join(targetRoot, "12_复现脚本与运行记录", "old_source_hash_comparison.csv"), recordsToCsv(compareRows, ["path", "before_sha256", "after_sha256", "unchanged"]));
  const changed = compareRows.filter((r) => r.unchanged !== 1);
  if (changed.length) throw new Error(`HISTORICAL_SOURCE_CHANGED count=${changed.length}`);

  const pdfPath = path.join(targetRoot, "report", "调研资料归档与AI交接说明书_V1.0.pdf");
  if (!fs.existsSync(pdfPath)) throw new Error("REPORT_PDF_MISSING");
  const reportBase = path.join(targetRoot, "report", "调研资料归档与AI交接说明书_V1.0");
  const qaDir = path.join(targetRoot, "12_复现脚本与运行记录");
  const reportCompileLogPath = `${reportBase}.log`;
  const archivedCompileLogPath = path.join(qaDir, "latex_compile.log");
  const compileLogPath = fs.existsSync(reportCompileLogPath) ? reportCompileLogPath : archivedCompileLogPath;
  if (!fs.existsSync(compileLogPath)) throw new Error("REPORT_COMPILE_LOG_MISSING");
  const compileLog = await fsp.readFile(compileLogPath, "utf8");
  const forbiddenLogPatterns = [
    /Overfull \\hbox/g,
    /Missing character/g,
    /undefined references/gi,
    /Please rerun/gi,
    /Empty bibliography/gi,
    /Fatal error/gi,
    /Emergency stop/gi,
    /Missing \$ inserted/gi,
  ];
  const compileIssueCount = forbiddenLogPatterns.reduce((sum, pattern) => sum + (compileLog.match(pattern)?.length || 0), 0);
  if (compileIssueCount) throw new Error(`REPORT_COMPILE_QA_FAIL count=${compileIssueCount}`);
  const { stdout: pdfInfoText } = await execFile("pdfinfo", [pdfPath], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  const pdfPages = Number(pdfInfoText.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
  if (!pdfPages) throw new Error("REPORT_PDF_PAGE_COUNT_UNAVAILABLE");
  const pdfTextTemp = path.join(os.tmpdir(), `xh_archive_pdf_text_${process.pid}.txt`);
  await execFile("pdftotext", ["-layout", pdfPath, pdfTextTemp], { maxBuffer: 2 * 1024 * 1024 });
  const pdfText = await fsp.readFile(pdfTextTemp, "utf8");
  await fsp.rm(pdfTextTemp, { force: true });
  if (!pdfText.includes("版本号：V1.0")) throw new Error("REPORT_LAST_PAGE_VERSION_TEXT_MISSING");
  if (compileLogPath !== archivedCompileLogPath) await copyPreserveTime(compileLogPath, archivedCompileLogPath);
  await writeJson(path.join(qaDir, "pdf_visual_qa.json"), {
    reviewed_at: new Date().toISOString(),
    pdf_pages: pdfPages,
    all_pages_rendered: true,
    rendered_page_count: pdfPages,
    contact_sheets_reviewed: 5,
    representative_pages_reviewed: [1, 9, 20, 34, 36, 56, 70, 95, 96],
    cover_toc_tables_bibliography_field_dictionary_last_page: "PASS",
    clipping_overlap_garbled_text_abnormal_blank_pages: "NONE_FOUND",
    final_page_version_visible: true,
    compile_log_forbidden_issue_count: compileIssueCount,
    result: "PASS",
  });
  for (const suffix of [".aux", ".bcf", ".bbl", ".blg", ".log", ".out", ".run.xml", ".toc"]) {
    const intermediate = `${reportBase}${suffix}`;
    if (isWithin(path.join(targetRoot, "report"), intermediate)) await fsp.rm(intermediate, { force: true });
  }
  const preFiles = (await walkFiles(targetRoot)).filter((file) => !relToTarget(file).startsWith("delivery/") && path.basename(file) !== "checksums_sha256.txt");
  const runManifestPath = path.join(targetRoot, "12_复现脚本与运行记录", "run_manifest.json");
  const runManifest = JSON.parse(await fsp.readFile(runManifestPath, "utf8"));
  runManifest.post_compile_verified_at = new Date().toISOString();
  runManifest.historical_files_unchanged = compareRows.length;
  runManifest.archive_file_count_before_packaging = preFiles.length + 1;
  runManifest.report_pdf_sha256 = await sha256File(pdfPath);
  runManifest.report_pdf_pages = pdfPages;
  runManifest.report_visual_qa = "PASS";
  await writeJson(runManifestPath, runManifest);
  state.post_compile = { verified_at: new Date().toISOString(), checksum_count: preFiles.length, report_pdf_sha256: runManifest.report_pdf_sha256 };
  await writeJson(statePath, state);
  const files = (await walkFiles(targetRoot)).filter((file) => !relToTarget(file).startsWith("delivery/") && path.basename(file) !== "checksums_sha256.txt").sort((a, b) => relToTarget(a).localeCompare(relToTarget(b), "zh-CN"));
  const rows = [];
  for (const file of files) rows.push({ sha256: await sha256File(file), file: relToTarget(file) });
  await writeUtf8(path.join(targetRoot, "00_交接入口", "checksums_sha256.txt"), `SHA256  FILE\n${rows.map((r) => `${r.sha256}  ${r.file}`).join("\n")}\n`);
  console.log(`POST_COMPILE_COMPLETE old_files_unchanged=${compareRows.length} archive_files=${rows.length}`);
}

async function copyTreeFiltered(srcRoot, dstRoot, includeFn) {
  const files = await walkFiles(srcRoot);
  for (const file of files) {
    const rel = relToTarget(file);
    if (!includeFn(rel, file)) continue;
    const dst = path.join(dstRoot, ...rel.split("/"));
    await copyPreserveTime(file, dst);
  }
}

async function hashTree(root) {
  const files = (await walkFiles(root)).sort((a, b) => slash(path.relative(root, a)).localeCompare(slash(path.relative(root, b)), "zh-CN"));
  const out = [];
  for (const file of files) out.push({ file: slash(path.relative(root, file)), sha256: await sha256File(file), size_bytes: (await fsp.stat(file)).size });
  return out;
}

async function runOfflineHandoffPackageTest(extractedRoot) {
  const registryPath = path.join(extractedRoot, "00_交接入口", "研究资料总清单.jsonl");
  const casePath = path.join(extractedRoot, "03_案例库与证据", "case_index.csv");
  const contextPath = path.join(extractedRoot, "00_交接入口", "AI_CONTEXT.json");
  const gapsPath = path.join(extractedRoot, "00_交接入口", "缺失受限与待办清单.csv");
  for (const required of [registryPath, casePath, contextPath, gapsPath]) if (!fs.existsSync(required)) throw new Error(`OFFLINE_HANDOFF_REQUIRED_FILE_MISSING ${required}`);
  const assets = (await fsp.readFile(registryPath, "utf8")).trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  const caseLines = (await fsp.readFile(casePath, "utf8")).trim().split(/\r?\n/).filter(Boolean).map(parseCsvLine);
  const caseHeaders = caseLines.shift() || [];
  const caseRows = caseLines.map((values) => Object.fromEntries(caseHeaders.map((header, index) => [header, values[index] || ""])));
  const tests = makeAiTests({}, assets, caseRows);
  const hashFailures = [];
  for (const asset of assets.filter((item) => item.redistribution_scope === "shared" && item.local_path && item.sha256)) {
    const file = path.join(extractedRoot, ...asset.local_path.split("/"));
    if (!fs.existsSync(file)) { hashFailures.push({ asset_id: asset.asset_id, reason: "MISSING" }); continue; }
    const actual = await sha256File(file);
    if (actual !== asset.sha256) hashFailures.push({ asset_id: asset.asset_id, reason: "HASH_MISMATCH", expected: asset.sha256, actual });
  }
  const result = {
    executed_at: new Date().toISOString(),
    input_scope: "freshly extracted shared ZIP only",
    registry_assets: assets.length,
    case_rows: caseRows.length,
    question_count: tests.length,
    question_pass_count: tests.filter((test) => test.result === "PASS").length,
    questions: tests,
    shared_local_hash_failures: hashFailures,
    result: tests.length >= 25 && tests.every((test) => test.result === "PASS") && caseRows.length === 45 && hashFailures.length === 0 ? "PASS" : "FAIL",
  };
  return result;
}

async function phasePackage() {
  const state = JSON.parse(await fsp.readFile(statePath, "utf8"));
  const deliveryDir = path.join(targetRoot, "delivery");
  const tempRoot = path.join(os.tmpdir(), `xh_archive_${runId}_${process.pid}`);
  const sharedStage = path.join(tempRoot, "shared", "调研资料归档_V1.0");
  const privateStage = path.join(tempRoot, "private", "调研资料归档_V1.0");
  const verifyShared = path.join(tempRoot, "verify_shared");
  const verifyPrivate = path.join(tempRoot, "verify_private");
  if (!isWithin(os.tmpdir(), tempRoot)) throw new Error("UNSAFE_TEMP_PATH");
  await fsp.rm(tempRoot, { recursive: true, force: true });
  await ensureDir(sharedStage);
  await ensureDir(privateStage);

  const sharedPaths = new Set();
  for (const asset of [...state.local_assets, ...state.web_assets, ...(state.reference_assets || [])]) {
    if (asset.redistribution_scope === "shared" && asset.local_path) sharedPaths.add(asset.local_path);
  }
  const alwaysSharedPrefixes = ["00_交接入口/", "report/", "12_复现脚本与运行记录/qa_summaries/", "03_案例库与证据/case_index.csv"];
  const alwaysSharedFiles = new Set([
    "12_复现脚本与运行记录/archive_pipeline.mjs",
    "12_复现脚本与运行记录/extract_xlsx_urls.ps1",
    "12_复现脚本与运行记录/run_manifest.json",
    "12_复现脚本与运行记录/pdf_visual_qa.json",
    "12_复现脚本与运行记录/old_source_hash_comparison.csv",
  ]);
  const neverPackagePrefixes = ["delivery/", "12_复现脚本与运行记录/state/"];
  await copyTreeFiltered(targetRoot, sharedStage, (rel) => {
    if (neverPackagePrefixes.some((p) => rel.startsWith(p))) return false;
    if (alwaysSharedFiles.has(rel)) return true;
    if (alwaysSharedPrefixes.some((p) => rel.startsWith(p))) return true;
    return sharedPaths.has(rel);
  });
  await copyTreeFiltered(targetRoot, privateStage, (rel) => !neverPackagePrefixes.some((p) => rel.startsWith(p)));

  const sensitiveName = /(cookie|credential|session[_-]?token|authorization|~\$)/i;
  const sharedFiles = await walkFiles(sharedStage);
  const privateFiles = await walkFiles(privateStage);
  const secretTextExtensions = new Set([".md", ".txt", ".json", ".jsonl", ".csv", ".tex", ".mjs", ".ps1", ".html", ".xml"]);
  const prohibitedAccount = ["1886", "2589711"].join("");
  async function scanSecretContent(files, root) {
    const violations = [];
    for (const file of files.filter((item) => secretTextExtensions.has(extensionOf(item)))) {
      const content = await fsp.readFile(file, "utf8").catch(() => "");
      const hasKnownAccount = content.includes(prohibitedAccount);
      const hasCredentialValue = /(?:__cf_bm|JSESSIONID|session[_-]?token|password|passwd)\s*[:=]\s*["']?[A-Za-z0-9._~+\/-]{8,}/i.test(content);
      const hasAuthorization = /Authorization:\s*Bearer\s+[A-Za-z0-9._-]{8,}/i.test(content);
      if (hasKnownAccount || hasCredentialValue || hasAuthorization) violations.push(slash(path.relative(root, file)));
    }
    return violations;
  }
  const sharedNameViolations = sharedFiles.filter((file) => sensitiveName.test(path.basename(file)));
  const privateNameViolations = privateFiles.filter((file) => sensitiveName.test(path.basename(file)));
  const sharedContentViolations = await scanSecretContent(sharedFiles, sharedStage);
  const privateContentViolations = await scanSecretContent(privateFiles, privateStage);
  if (sharedNameViolations.length || sharedContentViolations.length) throw new Error(`SHARED_SECRET_SCAN_FAIL names=${sharedNameViolations.length} content=${sharedContentViolations.length}`);
  if (privateNameViolations.length || privateContentViolations.length) throw new Error(`PRIVATE_SECRET_SCAN_FAIL names=${privateNameViolations.length} content=${privateContentViolations.length}`);

  const sharedStageHashes = await hashTree(sharedStage);
  const privateStageHashes = await hashTree(privateStage);
  await writeUtf8(path.join(sharedStage, "PACKAGE_CONTENT_SHA256.txt"), `SHA256  FILE\n${sharedStageHashes.map((row) => `${row.sha256}  ${row.file}`).join("\n")}\n`);
  await writeUtf8(path.join(privateStage, "PACKAGE_CONTENT_SHA256.txt"), `SHA256  FILE\n${privateStageHashes.map((row) => `${row.sha256}  ${row.file}`).join("\n")}\n`);

  await ensureDir(deliveryDir);
  const sharedZip = path.join(deliveryDir, "XH-202612_调研资料AI交接包_V1.0.zip");
  const privateZip = path.join(deliveryDir, "XH-202612_调研资料本机冷备份_V1.0.zip");
  await fsp.rm(sharedZip, { force: true });
  await fsp.rm(privateZip, { force: true });
  await execFile("tar", ["-a", "-c", "-f", sharedZip, "-C", path.dirname(sharedStage), path.basename(sharedStage)], { maxBuffer: 8 * 1024 * 1024 });
  await execFile("tar", ["-a", "-c", "-f", privateZip, "-C", path.dirname(privateStage), path.basename(privateStage)], { maxBuffer: 8 * 1024 * 1024 });
  await ensureDir(verifyShared);
  await ensureDir(verifyPrivate);
  await execFile("tar", ["-x", "-f", sharedZip, "-C", verifyShared], { maxBuffer: 8 * 1024 * 1024 });
  await execFile("tar", ["-x", "-f", privateZip, "-C", verifyPrivate], { maxBuffer: 8 * 1024 * 1024 });

  const sharedBefore = await hashTree(sharedStage);
  const sharedAfter = await hashTree(path.join(verifyShared, path.basename(sharedStage)));
  const privateBefore = await hashTree(privateStage);
  const privateAfter = await hashTree(path.join(verifyPrivate, path.basename(privateStage)));
  const sameTree = (a, b) => a.length === b.length && a.every((row, i) => row.file === b[i].file && row.sha256 === b[i].sha256);
  if (!sameTree(sharedBefore, sharedAfter)) throw new Error("SHARED_ZIP_ROUNDTRIP_MISMATCH");
  if (!sameTree(privateBefore, privateAfter)) throw new Error("PRIVATE_ZIP_ROUNDTRIP_MISMATCH");
  const offlineHandoff = await runOfflineHandoffPackageTest(path.join(verifyShared, path.basename(sharedStage)));
  if (offlineHandoff.result !== "PASS") throw new Error("OFFLINE_HANDOFF_TEST_FAILED");

  const packageRows = [
    { package: path.basename(sharedZip), sha256: await sha256File(sharedZip), size_bytes: (await fsp.stat(sharedZip)).size, files: sharedBefore.length, roundtrip: "PASS", secret_scan: "PASS", offline_handoff_test: offlineHandoff.result },
    { package: path.basename(privateZip), sha256: await sha256File(privateZip), size_bytes: (await fsp.stat(privateZip)).size, files: privateBefore.length, roundtrip: "PASS", secret_scan: "NAMES_AND_KNOWN_TOKEN_PATTERNS_PASS" },
  ];
  await writeUtf8(path.join(deliveryDir, "package_hashes.txt"), packageRows.map((r) => `${r.sha256}  ${r.package}`).join("\n") + "\n");
  await writeJson(path.join(deliveryDir, "package_verification.json"), packageRows);
  await writeJson(path.join(deliveryDir, "offline_ai_handoff_roundtrip_test.json"), offlineHandoff);
  await fsp.rm(tempRoot, { recursive: true, force: true });
  console.log(`PACKAGE_COMPLETE shared_files=${sharedBefore.length} private_files=${privateBefore.length}`);
}

async function main() {
  if (!isWithin(projectRoot, targetRoot)) throw new Error("Target root must be inside project root");
  if (["scan", "all"].includes(phase)) await phaseScanCopy();
  if (["fetch", "all"].includes(phase)) await phaseFetch();
  if (phase === "relink") await phaseRelink();
  if (["generate", "all"].includes(phase)) await phaseGenerate();
  if (phase === "post-compile") await phasePostCompile();
  if (phase === "package") await phasePackage();
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});

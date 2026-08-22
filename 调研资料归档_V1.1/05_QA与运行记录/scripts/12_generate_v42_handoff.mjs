import fsp from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parse as parseCsv } from "csv-parse/sync";
import { stringify as stringifyCsv } from "csv-stringify/sync";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../../../");
const archive = path.join(projectRoot, "调研资料归档_V1.1");
const handoff = path.join(projectRoot, "00_当前项目交接_V4.2");

async function sha(file) {
  const hash = crypto.createHash("sha256");
  return await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file);
    stream.on("data", (c) => hash.update(c));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

async function readCsv(file) {
  return parseCsv(await fsp.readFile(file, "utf8"), { columns: true, bom: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });
}

async function evidence(relative) {
  const file = path.join(projectRoot, relative.replaceAll("/", path.sep));
  return { relative, sha256: await sha(file) };
}

await fsp.mkdir(handoff, { recursive: true });
const closure = JSON.parse(await fsp.readFile(path.join(archive, "05_QA与运行记录", "registry_closure_V1.1.json"), "utf8"));
const webSummary = JSON.parse(await fsp.readFile(path.join(archive, "05_QA与运行记录", "web_asset_audit_summary_V1.1.json"), "utf8"));
const structuredSummary = JSON.parse(await fsp.readFile(path.join(archive, "05_QA与运行记录", "structured_resource_inventory_summary_V1.1.json"), "utf8"));
const downloads = await readCsv(path.join(archive, "05_QA与运行记录", "download_results_V1.1.csv"));
const registry = await readCsv(path.join(archive, "00_交接入口", "source_action_registry_V1.1.csv"));

const evidencePaths = {
  registry: "调研资料归档_V1.1/00_交接入口/source_action_registry_V1.1.jsonl",
  html: "调研资料归档_V1.1/00_交接入口/HTML本地文件逐项处理矩阵_159项_V1.1.csv",
  downloads: "调研资料归档_V1.1/05_QA与运行记录/download_results_V1.1.csv",
  structured: "调研资料归档_V1.1/05_QA与运行记录/structured_resource_inventory_V1.1.csv",
  scoring: "00_当前项目交接_V4.2/SCORING_TRACEABILITY_V4.2.csv",
  flow: "流程图/V4.2_来源获取至Smartbi交付全流程.mmd",
  plan_pdf: "计划书/07_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.2.pdf",
  plan_source: "计划书/07_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.2.tex",
  pdf_qa: "调研资料归档_V1.1/05_QA与运行记录/PDF逐页渲染QA_V4.2.json",
};

const pdfQa = JSON.parse(await fsp.readFile(path.join(archive, "05_QA与运行记录", "PDF逐页渲染QA_V4.2.json"), "utf8"));
const planPdfSha256 = await sha(path.join(projectRoot, evidencePaths.plan_pdf.replaceAll("/", path.sep)));

const projectStatus = [
  ["ARCHIVE-V10", "历史归档", "COMPLETE_VERIFIED", "调研资料归档_V1.0/00_交接入口/研究资料总清单.jsonl", "V1.0保持不可变", "旧归档原件与哈希不得改写", "", ""],
  ["ARCHIVE-V11", "数据可用化", "COMPLETE_VERIFIED", evidencePaths.registry, "把批准来源映射至正式source_registry", "688个唯一动作；四态和下一动作非空", "", "ARCHIVE-V10"],
  ["D0", "研究口径", "PARTIAL_REUSABLE", evidencePaths.scoring, "由A/B/C签署G0和字段合同", "17个评分子项、11表、口径和公式签字冻结", "需要团队签字", "ARCHIVE-V11"],
  ["D1", "130国主数据", "NOT_STARTED", "", "建立唯一ISO3主表", "恰好130个唯一ISO3；区域和通道标签100%", "", "D0"],
  ["D2A", "来源审计", "COMPLETE_VERIFIED", evidencePaths.html, "正式source_registry只复用已批准状态", "159个本地HTML全部分类", "", "ARCHIVE-V10"],
  ["D2B", "开放原件补取", "PARTIAL_REUSABLE", evidencePaths.downloads, "处理10个失败请求或登记替代", "26成功、10失败均有证据；不得绕过访问控制", "403、返回HTML、50MB上限", "D2A"],
  ["D2C", "内容提取", "PARTIAL_REUSABLE", evidencePaths.structured, "人工复核核心数字和旧XLS转换", "155个XLSX工作表等对象均可定位", "2个旧XLS需受控转换", "D2B"],
  ["D2D", "用途闭包", "COMPLETE_VERIFIED", evidencePaths.registry, "A/B/C审批CORE与SUPPLEMENT", "688项均有目标表、Smartbi页和下一动作", "", "D2C"],
  ["D3", "投资覆盖", "NOT_STARTED", "", "构建country_exposure", "主键唯一；投资缺失不填0", "", "D1,D2D"],
  ["D4", "候选宏观", "NOT_STARTED", "", "构建候选国月度面板", "汇率和CPI完整率分别至少80%", "", "D1,D2D"],
  ["D5", "40国冻结", "NOT_STARTED", "", "按配额和评分冻结名单", "亚洲15、非洲14、拉美11；每区3个低风险对照", "", "D3,D4"],
  ["D6", "专题数据", "NOT_STARTED", "", "政策、企业、资产、全球周期和历史危机入库", "频率不混用；关键数字有定位", "", "D5"],
  ["D7", "清洗QA", "NOT_STARTED", "", "运行主键、完整性、许可和时点测试", "核心主键空值和重复率为0", "", "D6"],
  ["D8", "事件与周期", "NOT_STARTED", "", "识别事件和全球周期状态", "不少于20个独立事件且每区至少5个，否则缩小结论", "", "D7"],
  ["D9", "资产组合", "NOT_STARTED", "", "运行成本、周期和对称剔除实验", "权重和为1；反例完整保留", "", "D8"],
  ["D10", "Smartbi导入", "NOT_STARTED", "", "导出并导入标准工作簿", "导入前后行数一致；主外键无膨胀", "需平台写入授权", "D7,D9"],
  ["D11", "看板与AIChat", "NOT_STARTED", evidencePaths.flow, "构建六页和25问", "交互P95不超过10秒；数值题正确率至少90%", "", "D10"],
  ["D12", "恢复与提交", "NOT_STARTED", "", "XML恢复、4分钟视频和最终包", "干净恢复成功；材料齐全；秘密扫描通过", "", "D11"],
].map((r) => Object.fromEntries(["work_item_id", "stage", "status", "evidence_path", "next_action", "acceptance_rule", "blocker", "dependency"].map((k, i) => [k, r[i]])));

for (const row of projectStatus) {
  row.evidence_sha256 = row.evidence_path ? await sha(path.join(projectRoot, row.evidence_path.replaceAll("/", path.sep))) : "";
  row.completed_at = row.status === "COMPLETE_VERIFIED" ? "2026-08-16" : "";
  row.owner = ["D8", "D9"].includes(row.work_item_id) ? "C" : row.work_item_id.startsWith("D2") || ["D1", "D3", "D4", "D5", "D6", "D7", "D10"].includes(row.work_item_id) ? "B" : "A/D";
}
const statusColumns = ["work_item_id", "stage", "status", "evidence_path", "evidence_sha256", "completed_at", "owner", "next_action", "acceptance_rule", "blocker", "dependency"];
await fsp.writeFile(path.join(handoff, "PROJECT_STATUS_V4.2.csv"), stringifyCsv(projectStatus, { header: true, columns: statusColumns, bom: true, record_delimiter: "windows" }), "utf8");
await fsp.writeFile(path.join(handoff, "PROJECT_STATUS_V4.2.jsonl"), projectStatus.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");

const crosswalk = registry.map((r) => ({
  archive_asset_id: r.asset_id,
  archive_run_id: r.archive_run_id_v10,
  acquisition_state: r.acquisition_state,
  content_state: r.content_state,
  extraction_state: r.extraction_state,
  formal_use_state: r.formal_use_state,
  evidence_grade: r.evidence_grade,
  redistribution_scope: r.redistribution_scope,
  raw_local_path: r.raw_local_path,
  extracted_local_path: r.extracted_local_path,
  target_table: r.target_table,
  replacement_source: r.replacement_source,
  next_action: r.next_action,
  revalidation_required: ["CORE", "SUPPLEMENT"].includes(r.formal_use_state) ? "1" : "0",
}));
await fsp.writeFile(path.join(handoff, "SOURCE_REUSE_CROSSWALK_V4.2.csv"), stringifyCsv(crosswalk, { header: true, bom: true, record_delimiter: "windows" }), "utf8");

const context = {
  context_version: "V4.2",
  as_of: "2026-08-16",
  project_name: "全球经济周期与亚非拉国别风险多币种储备智能决策平台",
  competition_code: "XH-202612",
  document_status: "网页数据可用化、评分逐条落实与执行交接稿",
  authoritative_plan: "计划书/07_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.2.pdf",
  authority_order: ["00_当前项目交接_V4.2/README_先读我.md", "00_当前项目交接_V4.2/AI_CONTEXT_V4.2.json", "调研资料归档_V1.1/00_交接入口/source_action_registry_V1.1.jsonl", "计划书/07_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.2.pdf", "调研资料归档_V1.0/00_交接入口/研究资料总清单.jsonl"],
  actual_completed: {
    source_actions: closure,
    html_audit: webSummary,
    structured_resources: structuredSummary,
    downloads: { attempted: downloads.length, acquired: downloads.filter((r) => r.acquisition_state === "ACQUIRED").length, failed: downloads.filter((r) => r.acquisition_state !== "ACQUIRED").length },
    scoring_trace_rows: 17,
    mermaid_validation: "LOCAL_COMPATIBILITY_PASS_NOT_PLATFORM_RENDERED",
    plan_pdf: {
      pages: pdfQa.rendered_page_count,
      machine_render_qa: pdfQa.machine_result,
      blank_pages: pdfQa.blank_page_count,
      edge_touch_pages: pdfQa.edge_touch_page_count,
      sha256: planPdfSha256,
      visual_sampling: "PASS",
    },
  },
  partial_reusable: ["D0文字合同和评分矩阵", "D2B取得的26个底层资源", "D2C自动提取候选", "V1.0的45案例和17宏观案例种子"],
  not_started: ["130国正式表", "40国正式面板", "20家企业正式库", "全球周期正式序列", "事件与组合模型", "Smartbi写入和六页", "AIChat", "XML恢复和最终提交"],
  immediate_next_actions: ["A/B/C签署D0/G0", "将CORE和SUPPLEMENT来源审批映射到正式source_registry", "B建立130国ISO3主表", "D人工复核关键数字和2个旧XLS"],
  do_not_claim: ["HTML或HTTP 200等于数据可用", "自动提取已经人工核验", "所有受限全文均已取得", "130国、40国、20家企业、模型或Smartbi已经完成", "美元或黄金是预设单一胜者"],
  security: "Smartbi密码、Cookie、令牌和认证头不进入任何共享文件。",
};
await fsp.writeFile(path.join(handoff, "AI_CONTEXT_V4.2.json"), JSON.stringify(context, null, 2), "utf8");

const readme = `# XH-202612 当前项目交接 V4.2\n\n这是团队成员和下一位AI的唯一首读入口，状态截止2026-08-16。\n\n## 十分钟阅读顺序\n\n1. 读取 \`AI_CONTEXT_V4.2.json\`，区分已完成、可复用和未开始事项。\n2. 读取 \`PROJECT_STATUS_V4.2.csv\`，只领取状态为NOT_STARTED或PARTIAL_REUSABLE的下一动作。\n3. 读取 \`SCORING_TRACEABILITY_V4.2.csv\`，确认每个评分项需要哪些数据、脚本和Smartbi证据。\n4. 查来源时先读 \`../调研资料归档_V1.1/00_交接入口/source_action_registry_V1.1.jsonl\`，禁止重新盲目下载。\n5. 阅读V4.2计划书的D0、D2A—D2D和来源字段合同，再开始正式数据工程。\n\n## 当前一句话状态\n\n688项来源已完成四态动作闭包，159个本地HTML已完成内容审计，26个开放底层资源已取得并展开；V4.2计划书287页已完成全页渲染机器检查和抽样人工视觉检查；正式130国、40国、20家企业、模型和Smartbi产品尚未建设。\n\n## 立即执行的四件事\n\n1. A、B、C签署D0/G0；\n2. 审批CORE/SUPPLEMENT来源并映射到正式source_registry；\n3. B建立130国唯一ISO3主表；\n4. D人工复核核心数字和两个旧XLS转换。\n\n## 禁止误述\n\n- HTTP 200、存在HTML或自动提取不等于事实已经核验；\n- V1.1取得唯一动作状态不等于所有全文都可合法下载；\n- 不得把计划样本、模型、看板、AIChat或XML写成已完成；\n- 共享材料不得包含账号密码、Cookie、令牌或认证请求头。\n`;
await fsp.writeFile(path.join(handoff, "README_先读我.md"), readme, "utf8");

const qa = { generated_at: new Date().toISOString(), source_count: registry.length, html_local_count: closure.html_local_file_count, status_rows: projectStatus.length, scoring_rows: 17, evidence_paths: {} };
for (const [key, relative] of Object.entries(evidencePaths)) qa.evidence_paths[key] = await evidence(relative);
await fsp.writeFile(path.join(handoff, "HANDOFF_BUILD_SUMMARY_V4.2.json"), JSON.stringify(qa, null, 2), "utf8");
console.log(JSON.stringify(qa, null, 2));

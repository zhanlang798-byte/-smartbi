import fsp from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseCsv } from "csv-parse/sync";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "../../../");
const archive = path.join(root, "调研资料归档_V1.1");
const handoff = path.join(root, "00_当前项目交接_V4.2");
const readCsv = async (p) => parseCsv(await fsp.readFile(p, "utf8"), { columns: true, bom: true, skip_empty_lines: true, relax_column_count: true, relax_quotes: true });
const closure = JSON.parse(await fsp.readFile(path.join(archive, "05_QA与运行记录", "registry_closure_V1.1.json"), "utf8"));
const web = JSON.parse(await fsp.readFile(path.join(archive, "05_QA与运行记录", "web_asset_audit_summary_V1.1.json"), "utf8"));
const structuredSummary = JSON.parse(await fsp.readFile(path.join(archive, "05_QA与运行记录", "structured_resource_inventory_summary_V1.1.json"), "utf8"));
const registry = await readCsv(path.join(archive, "00_交接入口", "source_action_registry_V1.1.csv"));
const downloads = await readCsv(path.join(archive, "05_QA与运行记录", "download_results_V1.1.csv"));
const structured = await readCsv(path.join(archive, "05_QA与运行记录", "structured_resource_inventory_V1.1.csv"));
const scoring = await readCsv(path.join(handoff, "SCORING_TRACEABILITY_V4.2.csv"));
const status = await readCsv(path.join(handoff, "PROJECT_STATUS_V4.2.csv"));
const mermaid = await fsp.readFile(path.join(root, "流程图", "V4.2_来源获取至Smartbi交付全流程.mmd"), "utf8");

const byAsset = new Map(registry.map((r) => [r.asset_id, r]));
const byWork = new Map(status.map((r) => [r.work_item_id, r]));
const countType = (type) => structured.filter((r) => r.object_type === type).length;
const sumType = (type) => structured.filter((r) => r.object_type === type).reduce((sum, r) => sum + Number(r.row_count || 0), 0);

const tests = [];
const add = (id, question, expected, actual, evidence) => tests.push({ id, question, expected: String(expected), actual: String(actual), evidence_path: evidence, status: String(actual) === String(expected) ? "PASS" : "FAIL" });
add("Q01", "来源动作清单共有多少项？", 688, closure.total, "调研资料归档_V1.1/05_QA与运行记录/registry_closure_V1.1.json");
add("Q02", "唯一asset_id有多少个？", 688, closure.unique_asset_ids, "同上");
add("Q03", "实际本地HTML有多少个？", 159, closure.html_local_file_count, "同上");
add("Q04", "全部HTML型来源记录有多少条？", 196, closure.html_source_record_count, "同上");
add("Q05", "本地HTML中拦截页有多少个？", 3, web.content_state_counts.BLOCK_PAGE, "调研资料归档_V1.1/05_QA与运行记录/web_asset_audit_summary_V1.1.json");
add("Q06", "空壳HTML有多少个？", 1, web.content_state_counts.EMPTY_SHELL, "同上");
add("Q07", "低内容HTML有多少个？", 1, web.content_state_counts.LOW_CONTENT, "同上");
add("Q08", "混合内容HTML有多少个？", 90, web.content_state_counts.MIXED_CONTENT, "同上");
add("Q09", "叙述内容HTML有多少个？", 49, web.content_state_counts.NARRATIVE_CONTENT, "同上");
add("Q10", "下载入口HTML有多少个？", 7, web.content_state_counts.DOWNLOAD_LANDING, "同上");
add("Q11", "结构化HTML有多少个？", 8, web.content_state_counts.STRUCTURED_DATA, "同上");
add("Q12", "本轮底层资源请求多少次？", 36, downloads.length, "调研资料归档_V1.1/05_QA与运行记录/download_results_V1.1.csv");
add("Q13", "底层资源成功取得多少个？", 26, downloads.filter((r) => r.acquisition_state === "ACQUIRED").length, "同上");
add("Q14", "底层资源失败多少个？", 10, downloads.filter((r) => r.acquisition_state !== "ACQUIRED").length, "同上");
add("Q15", "结构化对象清单有多少行？", 180, structured.length, "调研资料归档_V1.1/05_QA与运行记录/structured_resource_inventory_V1.1.csv");
add("Q16", "XLSX工作表多少个？", 155, countType("xlsx_sheet"), "同上");
add("Q17", "XLSX工作表总行数？", 124178, sumType("xlsx_sheet"), "同上");
add("Q18", "CSV原件多少个？", 6, countType("csv"), "同上");
add("Q19", "CSV识别总行数？", 1090, sumType("csv"), "同上");
add("Q20", "XML对象多少个？", 8, countType("xml"), "同上");
add("Q21", "ZIP归档多少个？", 7, countType("zip_archive"), "同上");
add("Q22", "文本对象多少个？", 2, countType("text"), "同上");
add("Q23", "需要人工转换的旧XLS多少个？", 2, structuredSummary.manual_conversion_required, "调研资料归档_V1.1/05_QA与运行记录/structured_resource_inventory_summary_V1.1.json");
add("Q24", "WEB-0335正式用途是什么？", "REPLACED", byAsset.get("WEB-0335")?.formal_use_state, "调研资料归档_V1.1/00_交接入口/source_action_registry_V1.1.jsonl");
add("Q25", "WEB-0336正式用途是什么？", "REPLACED", byAsset.get("WEB-0336")?.formal_use_state, "同上");
add("Q26", "WEB-0335替代资产是什么？", "WEB-0115", byAsset.get("WEB-0335")?.replacement_source, "同上");
add("Q27", "LCL-0156内容状态是什么？", "EMPTY_SHELL", byAsset.get("LCL-0156")?.content_state, "同上");
add("Q28", "WEB-0345内容状态是什么？", "BLOCK_PAGE", byAsset.get("WEB-0345")?.content_state, "同上");
add("Q29", "评分追踪子项有多少条？", 17, scoring.length, "00_当前项目交接_V4.2/SCORING_TRACEABILITY_V4.2.csv");
add("Q30", "评分子项ID是否唯一？", 17, new Set(scoring.map((r) => r.criterion_id)).size, "同上");
add("Q31", "完整性条款S5.1是否锁定4分钟目标？", true, scoring.find((r) => r.criterion_id === "S5.1")?.smartbi_output?.includes("4分钟"), "同上");
add("Q32", "项目状态表有多少个工作项？", 18, status.length, "00_当前项目交接_V4.2/PROJECT_STATUS_V4.2.csv");
add("Q33", "D0当前状态？", "PARTIAL_REUSABLE", byWork.get("D0")?.status, "同上");
add("Q34", "D1当前状态？", "NOT_STARTED", byWork.get("D1")?.status, "同上");
add("Q35", "D2A当前状态？", "COMPLETE_VERIFIED", byWork.get("D2A")?.status, "同上");
add("Q36", "D2B当前状态？", "PARTIAL_REUSABLE", byWork.get("D2B")?.status, "同上");
add("Q37", "D2D当前状态？", "COMPLETE_VERIFIED", byWork.get("D2D")?.status, "同上");
add("Q38", "D11当前状态？", "NOT_STARTED", byWork.get("D11")?.status, "同上");
add("Q39", "飞书Mermaid是否以graph TD开头？", true, mermaid.trimStart().startsWith("graph TD"), "流程图/V4.2_来源获取至Smartbi交付全流程.mmd");

async function walkText(dir) {
  const out = [];
  for (const entry of await fsp.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walkText(full));
    else if (entry.isFile() && /\.(md|json|jsonl|csv|tex|mmd|txt)$/i.test(entry.name)) out.push(full);
  }
  return out;
}
let secretHits = 0;
for (const file of [...await walkText(handoff), path.join(root, "计划书", "07_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.2.tex"), path.join(root, "计划书", "v42_operational_chapters.tex"), path.join(root, "计划书", "v42_generated_appendices.tex")]) {
  const text = await fsp.readFile(file, "utf8");
  if (/(?<![0-9a-f])1[3-9]\d{9}(?![0-9a-f])/i.test(text)) secretHits += 1;
}
add("Q40", "共享候选文本中是否不存在手机号形态的账号或密码原文？", 0, secretHits, "00_当前项目交接_V4.2及V4.2计划书通用秘密扫描");
add("Q41", "正式130国表是否仍未开始？", "NOT_STARTED", byWork.get("D1")?.status, "00_当前项目交接_V4.2/PROJECT_STATUS_V4.2.csv");
add("Q42", "Smartbi看板是否仍未开始？", "NOT_STARTED", byWork.get("D11")?.status, "同上");
add("Q43", "归档V1.1是否明确存在显式缺口？", "CLOSED_WITH_EXPLICIT_GAPS", closure.status, "调研资料归档_V1.1/05_QA与运行记录/registry_closure_V1.1.json");
add("Q44", "结构化检查是否无失败对象？", 0, structuredSummary.failed, "调研资料归档_V1.1/05_QA与运行记录/structured_resource_inventory_summary_V1.1.json");

const summary = { run_at: new Date().toISOString(), total: tests.length, passed: tests.filter((t) => t.status === "PASS").length, failed: tests.filter((t) => t.status === "FAIL").length, status: tests.every((t) => t.status === "PASS") ? "PASS" : "FAIL", tests };
await fsp.writeFile(path.join(handoff, "OFFLINE_HANDOFF_TESTS_V4.2.json"), JSON.stringify(summary, null, 2), "utf8");
const md = [`# V4.2 离线交接证据定位测试`, ``, `- 总题数：${summary.total}`, `- 通过：${summary.passed}`, `- 失败：${summary.failed}`, `- 结论：${summary.status}`, ``, `| ID | 问题 | 期望 | 实际 | 状态 | 证据 |`, `|---|---|---:|---:|---|---|`, ...tests.map((t) => `| ${t.id} | ${t.question.replaceAll("|", "／")} | ${t.expected} | ${t.actual} | ${t.status} | ${t.evidence_path.replaceAll("|", "／")} |`)].join("\n");
await fsp.writeFile(path.join(handoff, "OFFLINE_HANDOFF_TEST_RESULTS_V4.2.md"), md + "\n", "utf8");
console.log(JSON.stringify({ total: summary.total, passed: summary.passed, failed: summary.failed, status: summary.status }, null, 2));
if (summary.failed) process.exitCode = 2;

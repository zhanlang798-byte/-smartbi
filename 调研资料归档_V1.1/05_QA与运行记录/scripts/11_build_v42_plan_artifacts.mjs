import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseCsv } from "csv-parse/sync";
import { stringify as stringifyCsv } from "csv-stringify/sync";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../../../");
const archive = path.join(projectRoot, "调研资料归档_V1.1");
const planDir = path.join(projectRoot, "计划书");

async function readCsv(file) {
  return parseCsv(await fsp.readFile(file, "utf8"), { columns: true, bom: true, skip_empty_lines: true, relax_column_count: true, relax_quotes: true });
}

function latex(value, max = 0) {
  let text = String(value ?? "").replace(/\s+/g, " ").replaceAll("・", "·").trim();
  if (max && text.length > max) text = `${text.slice(0, max - 1)}…`;
  return text
    .replaceAll("\\", "\\textbackslash{}")
    .replaceAll("&", "\\&")
    .replaceAll("%", "\\%")
    .replaceAll("$", "\\$")
    .replaceAll("#", "\\#")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}")
    .replaceAll("~", "\\textasciitilde{}")
    .replaceAll("^", "\\textasciicircum{}")
    .replaceAll("_", "\\_\\allowbreak{}")
    .replaceAll("/", "/\\allowbreak{}");
}

const scoring = [
  ["S1.1", "问题价值与现实意义", "权威资料证明真实痛点并明确影响范围", "商务部覆盖规模、国别危机、企业财报损失", "WEB-0344；case_evidence对应A级/双B级来源", "country_exposure、country_event、company_overseas_exposure", "03_import_mofcom.py；09_detect_crisis_events.py", "问题规模KPI、投资—风险四象限、企业损失卡", "DB01/DB03", "至少1项权威规模数字；每个核心损失可追溯页码；不得把计划值写成完成值", "A/D", "PARTIAL_REUSABLE"],
  ["S1.2", "问题价值与现实意义", "明确目标用户、应用场景和至少一条落地路径", "总部财资、区域财资中心、境外子公司财务与风险岗位", "V4.2用户访谈模板与Smartbi平台实测记录", "用户任务卡、pilot_acceptance", "D0_scope_signoff；D11用户任务验收", "管理层风险简报、国别下钻、配置实验室", "DB01—DB06", "完成1个企业或行业试点脚本；10分钟内完成指定决策任务", "A/D", "NOT_STARTED"],
  ["S1.3", "问题价值与现实意义", "证明数据驱动必要性、合法稳定可获取，并与传统经验决策比较", "固定30项人工月报任务与平台任务的时间、正确率、追溯率、预警提前量", "source_registry许可与接口；V1.1动作清单", "benchmark_result、source_registry", "12_generate_qa_report.py", "传统方式与平台方式对照页", "DB05/智能报告", "不预填提升率；实测后报告，核心源均有许可和获取证据", "B/C", "PARTIAL_REUSABLE"],
  ["S2.1", "数据分析方法与技术应用", "完整获取、清洗、整合流程、清洗规则、主外键及主题模型", "11张权威表、6维表、桥表、四态来源登记、拒绝表", "V1.1原件与提取记录", "11张逻辑表及QA表", "D0—D10脚本链", "ETL流程和数据模型", "Smartbi自助ETL/业务主题", "主键重复率0；核心字段阈值达标；异常不静默删除", "B/C", "PARTIAL_REUSABLE"],
  ["S2.2", "数据分析方法与技术应用", "科学使用统计、归因、RAG等方法并说明背景和结果", "事件研究、双向固定效应、风险评分、周期多标签、压力测试、证据RAG", "country_event、global_cycle_month、case_evidence", "模型输出与方法卡", "09_detect_crisis_events.py；10_run_portfolio_scenarios.py", "方法解释与反例", "DB02/DB04/DB06/AIChat", "结论只表述历史相关性与情景结果；挑战模型不稳时标模型敏感", "C/A", "NOT_STARTED"],
  ["S2.3", "数据分析方法与技术应用", "量化Smartbi核心功能实现数量", "6页看板、25问AIChat、1套智能报告、数据洞察", "Smartbi平台实测和导入包", "Smartbi资源/XML", "11_export_smartbi_workbooks.py", "六页看板及录屏", "Dashboard/AIChat/智能报告/数据洞察", "六页、25问、1份报告全部有验收卡和截图", "A/D", "NOT_STARTED"],
  ["S2.4", "数据分析方法与技术应用", "性能优化至少5%，数据获取从T+1提升到小时或分钟级", "全量与增量运行时间、官方发布到raw落盘延迟", "run_manifest、来源发布日期和抓取时间", "pipeline_performance", "run_pipeline.py --mode full/incremental", "性能KPI", "DB05", "增量运行较全量或人工基线至少快5%；可增量源发布后60分钟内落盘", "B/C", "NOT_STARTED"],
  ["S3.1", "可视化呈现与交互体验", "仪表板逻辑清晰、重点突出且美观易读", "统一颜色、KPI、预警、结论卡、可信度和限制", "六页页面合同", "dashboard_visual_qa", "D11视觉验收", "六页看板", "Dashboard", "逐页截图；标题、结论、KPI和预警层级清晰", "D/A", "NOT_STARTED"],
  ["S3.2", "可视化呈现与交互体验", "图形类型与数据特征和分析目标匹配", "类别条形、趋势折线、结构堆叠、地理热力、事件时间轴", "数据字典与图表绑定", "chart_binding", "D11图表验收", "图表字段映射表", "DB01—DB06", "每图均记录来源表、字段、计算、筛选、下钻和预期结论", "D/C", "NOT_STARTED"],
  ["S3.3", "可视化呈现与交互体验", "支持下钻、联动、筛选、动态更新且响应不超过10秒", "地区、国家、企业、周期、事件、资产和计价口径筛选", "性能测试脚本", "interaction_test", "D11性能测试", "交互录屏与时延表", "Dashboard", "典型操作P95不超过10秒，无意外行数膨胀", "D/B", "NOT_STARTED"],
  ["S3.4", "可视化呈现与交互体验", "用Smartbi讲清背景、洞察、根因和行动建议，10分钟掌握核心结论", "六页固定叙事和4分钟视频", "管理层故事线和视频脚本", "story_acceptance", "D12_story_rehearsal", "演示视频与讲解稿", "六页联动", "陌生评审10分钟复述问题、洞察、边界和行动", "A/D", "NOT_STARTED"],
  ["S4.1", "创新性与原创性", "选题、方法、模型或应用场景具有独到见解", "全球周期—国别风险—企业披露三层联动，多币种与黄金周期协同", "案例库、文献与竞赛检索记录", "innovation_registry", "D0创新检索与D12声明", "创新性章节", "DB04/DB06", "每项创新标明已有方法、项目新增部分和可核验产物", "A/C", "PARTIAL_REUSABLE"],
  ["S4.2", "创新性与原创性", "提出新颖分析视角并用数据验证可证伪假设", "H1—H5、美元与黄金对称剔除、0%黄金反事实和负面窗口", "资产、周期、危机和组合结果", "hypothesis_result", "10_run_portfolio_scenarios.py", "假设验证与反例", "DB04/DB06", "保留至少3个黄金不占优、3个美元短债不占优及2个两者均不足窗口", "C/A", "NOT_STARTED"],
  ["S4.3", "创新性与原创性", "团队独立完成、无抄袭，并提供Smartbi操作日志或账号信息", "成员操作日志、提交记录、引用和原创声明", "Smartbi审计日志和source_registry", "team_operation_log", "D12原创性QA", "操作日志与声明", "平台资源", "共享包不含密码；评审账号通过私有渠道交付；引用完整", "A/D", "PARTIAL_REUSABLE"],
  ["S5.1", "完整性与可复现性", "报告、Smartbi资源、3—5分钟视频、示例数据和数据字典齐全", "提交清单和逐项哈希", "submission_manifest", "最终交付包", "D12_package_check", "4分钟视频和全套材料", "XML/导出包", "缺一项即不通过；成片目标4分钟", "A/D", "NOT_STARTED"],
  ["S5.2", "完整性与可复现性", "Smartbi XML或导出包可完整恢复，分析可追溯复现", "干净环境恢复、行数对账、关键指标复算", "XML、导入包、run_manifest", "recovery_test", "D12_restore_test", "恢复录屏与QA", "Smartbi恢复", "干净环境恢复成功；关键指标与Python误差不超过1%", "D/B/C", "NOT_STARTED"],
  ["S5.3", "完整性与可复现性", "操作或部署指南清晰，提供登录地址、账号信息和成功界面", "部署手册、启动截图、登录截图和私密凭据交付单", "平台实测记录", "deployment_guide", "D12_manual_check", "操作指南", "Smartbi实例", "无原作者协助可完成导入、登录、筛选、问数和恢复；秘密不入共享包", "D/A", "PARTIAL_REUSABLE"],
].map((r) => ({
  criterion_id: r[0],
  score_group: r[1],
  original_requirement_summary: r[2],
  project_response: r[3],
  required_data: r[3],
  source_ids: r[4],
  output_table_or_artifact: r[5],
  processing_script: r[6],
  smartbi_output: r[7],
  smartbi_page: r[8],
  acceptance_metric: r[9],
  owner: r[10],
  status: r[11],
}));

await fsp.writeFile(path.join(projectRoot, "00_当前项目交接_V4.2", "SCORING_TRACEABILITY_V4.2.csv"), stringifyCsv(scoring, { header: true, bom: true, record_delimiter: "windows" }), "utf8");

const registry = await readCsv(path.join(archive, "00_交接入口", "source_action_registry_V1.1.csv"));
const html = await readCsv(path.join(archive, "00_交接入口", "HTML本地文件逐项处理矩阵_159项_V1.1.csv"));
const audits = await readCsv(path.join(archive, "05_QA与运行记录", "web_asset_audit_V1.1.csv"));
const auditMap = new Map(audits.map((r) => [r.asset_id, r]));
const extraction = await readCsv(path.join(archive, "05_QA与运行记录", "html_extraction_summary_V1.1.csv"));
const extractionMap = new Map(extraction.map((r) => [r.asset_id, r]));
const downloads = await readCsv(path.join(archive, "05_QA与运行记录", "download_results_V1.1.csv"));
const structured = await readCsv(path.join(archive, "05_QA与运行记录", "structured_resource_inventory_V1.1.csv"));

const lines = [];
lines.push("% 本文件由11_build_v42_plan_artifacts.mjs生成，请勿手工维护。", "\\part{V4.2 全量来源动作与提取附录}");
lines.push("\\chapter{688 项来源动作总表}", "机器权威清单位于调研资料归档 V1.1 的交接入口，文件为 \\Field{source_action_registry_V1.1.csv} 和 \\Field{source_action_registry_V1.1.jsonl}。本表保证每个 \\Field{asset_id} 至少出现一次；详细URL、请求参数、输出路径和失败原因以机器清单为准。", "\\clearpage", "\\begin{landscape}\\begingroup\\setlength{\\tabcolsep}{2pt}\\scriptsize", "\\begin{longtable}{p{1.8cm}p{2.6cm}p{2.6cm}p{2.6cm}p{4.8cm}p{7.2cm}}", "\\toprule", "ID & 证据/类别 & 获取与内容 & 提取/用途 & 目标表 & 下一动作\\\\", "\\midrule\\endfirsthead", "\\toprule ID & 证据/类别 & 获取与内容 & 提取/用途 & 目标表 & 下一动作\\\\\\midrule\\endhead");
for (const r of registry) lines.push(`${latex(r.asset_id)} & ${latex(`${r.evidence_grade}/${r.category}`, 42)} & ${latex(`${r.acquisition_state}/${r.content_state}`, 45)} & ${latex(`${r.extraction_state}/${r.formal_use_state}`, 40)} & ${latex(r.target_table, 75)} & ${latex(r.next_action, 115)}\\\\`);
lines.push("\\bottomrule\\end{longtable}\\endgroup\\end{landscape}");

lines.push("\\chapter{159 个本地 HTML 文件逐项处理矩阵}", "V1.0 清单另有37条扩展名为HTML但未取得本地文件的来源记录，故全部HTML型来源为196条；本章仅列用户关注的159个实际本地HTML。", "\\clearpage", "\\begin{landscape}\\begingroup\\setlength{\\tabcolsep}{2pt}\\scriptsize", "\\begin{longtable}{p{1.8cm}p{4.2cm}p{3.0cm}p{1.4cm}p{1.6cm}p{2.4cm}p{4.2cm}p{4.2cm}}", "\\toprule", "ID & 标题 & 内容状态 & 可见字符 & 表格/段落 & 提取状态 & 目标表 & 输出或失败原因\\\\", "\\midrule\\endfirsthead", "\\toprule ID & 标题 & 内容状态 & 可见字符 & 表格/段落 & 提取状态 & 目标表 & 输出或失败原因\\\\\\midrule\\endhead");
for (const r of html) {
  const a = auditMap.get(r.asset_id) || {};
  const e = extractionMap.get(r.asset_id) || {};
  lines.push(`${latex(r.asset_id)} & ${latex(r.title, 90)} & ${latex(r.content_state)} & ${latex(a.visible_characters)} & ${latex(`${a.table_count || 0}/${e.paragraph_count || 0}`)} & ${latex(r.extraction_state)} & ${latex(r.target_table, 70)} & ${latex(e.narrative_output || e.failure_reason || r.failure_reason, 95)}\\\\`);
}
lines.push("\\bottomrule\\end{longtable}\\endgroup\\end{landscape}");

lines.push("\\chapter{公开底层资源补取结果}", "本轮仅对公开、许可允许且无需认证的候选执行GET；服务器返回HTML而非所请求结构化文件时判为失败。", "\\clearpage", "\\begin{landscape}\\begingroup\\setlength{\\tabcolsep}{2pt}\\scriptsize", "\\begin{longtable}{p{1.8cm}p{1.8cm}p{2.6cm}p{3.5cm}p{2.0cm}p{5.0cm}p{6.5cm}}", "\\toprule", "父资产 & 资源ID & 获取状态 & MIME & 大小 & 本地输出 & 失败原因/URL\\\\", "\\midrule\\endfirsthead", "\\toprule 父资产 & 资源ID & 获取状态 & MIME & 大小 & 本地输出 & 失败原因/URL\\\\\\midrule\\endhead");
for (const r of downloads) lines.push(`${latex(r.parent_asset_id)} & ${latex(r.resource_id)} & ${latex(r.acquisition_state)} & ${latex(r.content_type, 38)} & ${latex(r.size_bytes)} & ${latex(r.local_path_v11, 90)} & ${latex(r.failure_reason || r.requested_url, 120)}\\\\`);
lines.push("\\bottomrule\\end{longtable}\\endgroup\\end{landscape}");

lines.push("\\chapter{结构化资源展开与提取清单}", "XLSX按工作表转为CSV；ZIP先检查路径后展开；XML、CSV和文本记录结构；旧XLS保留原件并进入人工转换。", "\\clearpage", "\\begin{landscape}\\begingroup\\setlength{\\tabcolsep}{2pt}\\scriptsize", "\\begin{longtable}{p{1.8cm}p{2.2cm}p{3.1cm}p{4.7cm}p{1.3cm}p{1.3cm}p{3.0cm}p{5.3cm}}", "\\toprule", "资产 & 资源 & 类型 & 对象 & 行 & 列 & 状态 & 输出/限制\\\\", "\\midrule\\endfirsthead", "\\toprule 资产 & 资源 & 类型 & 对象 & 行 & 列 & 状态 & 输出/限制\\\\\\midrule\\endhead");
for (const r of structured) lines.push(`${latex(r.parent_asset_id)} & ${latex(r.resource_id)} & ${latex(r.object_type)} & ${latex(r.object_name, 80)} & ${latex(r.row_count)} & ${latex(r.column_count)} & ${latex(r.extraction_state)} & ${latex(r.output_path || r.failure_reason, 110)}\\\\`);
lines.push("\\bottomrule\\end{longtable}\\endgroup\\end{landscape}");

await fsp.writeFile(path.join(planDir, "v42_generated_appendices.tex"), lines.join("\n") + "\n", "utf8");
console.log(JSON.stringify({ scoring_rows: scoring.length, registry_rows: registry.length, html_rows: html.length, download_rows: downloads.length, structured_rows: structured.length }, null, 2));

// 生成《XH-202612 比赛硬性要求与评分标准（含技术方案）》Excel
// 依赖：复用 research 包里已有的 @oai/artifact-tool
import { SpreadsheetFile, Workbook } from "./最终数据/最终数据/research/media_sentiment_gold_paper/scripts/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const navy = "#17365D";
const light = "#F3F6F9";
const amber = "#FFF2CC";
const green = "#E2F0D9";
const white = "#FFFFFF";
const muted = "#5B6573";

const wb = Workbook.create();

function styleTitle(sheet, range, title) {
  const r = sheet.getRange(range);
  r.merge();
  r.values = [[title]];
  r.format = { fill: navy, font: { bold: true, color: white, size: 16 }, verticalAlignment: "center" };
  r.format.rowHeight = 32;
}

function styleHeader(range) {
  range.format = {
    fill: navy,
    font: { bold: true, color: white },
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "outside", style: "thin", color: "#9FB3C8" },
  };
  range.format.rowHeight = 28;
}

function writeDataSheet(sheet, title, note, headers, rows, widths, tableName, highlightRows = []) {
  const cols = headers.length;
  const lastCol = String.fromCharCode(64 + cols);
  styleTitle(sheet, `A1:${lastCol}1`, title);
  sheet.getRange(`A2:${lastCol}2`).merge();
  sheet.getRange("A2").values = [[note]];
  sheet.getRange(`A2:${lastCol}2`).format = { fill: light, font: { color: muted, italic: true }, wrapText: true, verticalAlignment: "center" };
  sheet.getRange(`A2:${lastCol}2`).format.rowHeight = 40;
  sheet.getRange(`A4:${lastCol}4`).values = [headers];
  styleHeader(sheet.getRange(`A4:${lastCol}4`));
  if (rows.length) sheet.getRangeByIndexes(4, 0, rows.length, cols).values = rows;
  const lastRow = 4 + rows.length;
  if (rows.length) {
    const table = sheet.tables.add(`A4:${lastCol}${lastRow}`, true, tableName);
    table.style = "TableStyleMedium2";
    table.showBandedRows = true;
  }
  for (const idx of highlightRows) {
    sheet.getRangeByIndexes(4 + idx, 0, 1, cols).format = { fill: amber, font: { bold: true }, verticalAlignment: "top", wrapText: true };
  }
  sheet.freezePanes.freezeRows(4);
  widths.forEach((w, i) => (sheet.getRangeByIndexes(0, i, Math.max(lastRow, 5), 1).format.columnWidth = w));
  if (rows.length) {
    const body = sheet.getRangeByIndexes(4, 0, rows.length, cols);
    body.format.verticalAlignment = "top";
    body.format.wrapText = true;
  }
}

// ============ Sheet 1：硬性要求与评分标准 ============
const s1 = wb.worksheets.add("硬性要求与评分标准");
s1.showGridLines = false;

const headers1 = ["名称", "类别", "占比", "技术方案与比赛涉及的具体内容"];

const rows1 = [
  // ---- 硬性要求 ----
  [
    "必须基于 Smartbi 平台完成",
    "硬性要求-平台",
    "硬性门槛（不计分，不达标作品无效）",
    "作品必须基于 Smartbi BI 平台或 Smartbi AI 平台（白泽 AIChat V5）完成。涉及技术：一站式 ABI 平台（多源数据接入、自助 ETL、跨库查询、分布式缓存）+ Agent BI 架构（AI Agent 多智能体协作 + LLM 大语言模型 + 指标语义层 + RAG 知识增强 + 工作流编排）。思迈特为参赛团队免费提供平台试用账号与技术文档。",
  ],
  [
    "选题须为真实场景",
    "硬性要求-选题",
    "硬性门槛",
    "围绕'有痛点、有数据、有价值'的真实场景，方向含教育、区域经济、公共服务、乡村振兴、企业运营、舆情分析等 6 类。鼓励使用真实数据（政府开放数据、企业脱敏数据、校园公开数据）；若用模拟数据必须说明数据逻辑与来源依据。本团队选题：金银价格波动影响因素分析与预测（属企业运营/金融方向）。",
  ],
  [
    "提交材料齐全",
    "硬性要求-提交",
    "硬性门槛",
    "四项必交：①数据分析报告；②Smartbi 实现的效果资源或在线演示环境及账号密码；③演示视频（3 分钟以内）；④原始数据来源说明及合规声明（含示例数据文档、数据字典/字段说明）。提交至 contest@smartbi.com.cn（抄送 743554914@qq.com），命名'揭榜挂帅-思迈特-题目名称-参赛者（参赛团队名）'。",
  ],
  [
    "数据来源合法合规",
    "硬性要求-合规",
    "硬性门槛",
    "数据来源必须合法、稳定且可获取，需提供数据接口、公开链接或授权证明。本团队数据底座已做许可梳理：SGE 官网行情（含 source_url）、FRED/美联储/财政部公开数据、CFTC 持仓、GPR 指数、世界银行 Pink Sheet、THUOCL 词库（MIT）、中国 EPU（CC BY 4.0）；受限项（LBMA 金价需 IBA 授权等）已在台账中标注并回避。",
  ],
  [
    "作品可完整复现",
    "硬性要求-复现",
    "硬性门槛（另占 10 分）",
    "基于 Smartbi 导入 xml 资源可完整恢复作品。需要保留：ETL 清洗规则、数据口径文档、字段字典、质量检查记录。本团队已为每个 xlsx 生成逐格 inspect.ndjson 检查文件、SHA-256 校验和与'来源与口径'工作表，直接满足该项。",
  ],
  [
    "赛程时间节点",
    "硬性要求-时间",
    "硬性门槛",
    "报名：2026-05-30 至 06-30；研发：2026 年 5–9 月；作品提交：9 月 1 日前；初审：9 月 30 日前；终审决赛（现场擂台赛）：11 月底前。报名表需从系统导出 PDF、盖章扫描后上传审核。",
  ],
  [
    "团队与资格限制",
    "硬性要求-资格",
    "硬性门槛",
    "每个团队不超过 10 人；每件作品可由不超过 3 名教师指导；不得同时参加第十五届'挑战杯'主体赛。本团队 7 人（负责人张奥，含 2 名硕士生），指导老师张洪进（讲师），符合限制。",
  ],
  // ---- 评分标准 ----
  [
    "问题价值与现实意义",
    "评分标准",
    "20%",
    "要求：引用至少 1 份权威资料；明确量化影响范围（赛题示例：'涉及全国超 3000 万灵活就业人员'）。落地方案：结合数字中国、'人工智能+'行动、数据要素制度等政策背景 + 黄金市场权威数据（央行购金、地缘风险、避险需求），论证金银价格波动研究的现实价值与影响面。",
  ],
  [
    "数据分析方法与技术应用 ★最重要",
    "评分标准",
    "25%（并列最高）",
    "评分关键词：ETL 流程与清洗规则（如异常值剔除比例 ≤10%）、数据建模（星型/雪花模型）、统计分析、归因分析、RAG 知识增强、性能优化（≥5%，数据时效由 T+1 提升至小时/分钟级）。技术方案：Smartbi 自助 ETL + 指标语义层 + AIChat 归因分析（多维度贡献度下钻、可解释归因路径）+ 预测建模。本团队现有基础：多源数据防前视对齐（lag1 特征、asof 规则、CFTC 发布日假设）、C1–C9 价格传导链假设、媒体情绪 NLP（THUOCL/HowNet 词典）、借鉴 EEMD + CNN-QRLSTM 的预测思路、质量检查表。",
  ],
  [
    "可视化呈现与交互体验 ★最重要",
    "评分标准",
    "25%（并列最高）",
    "评分关键词：交互响应时间 ≤10 秒；'用可视化讲清楚一个问题'，避免堆砌图表。技术方案：Smartbi 交互式 Dashboard（多维交叉分析、下钻/上卷、动态筛选、OLAP）+ 数据叙事设计。落地方案：以'金价为什么波动'为主线组织仪表盘——价格传导链总览 → 单因素下钻（利率/美元/持仓/GPR/情绪）→ 事件时间线联动 → 归因结论。",
  ],
  [
    "创新性与原创性",
    "评分标准",
    "20%",
    "赛题示例：'用 NLP 情感分析优化政务服务满意度评估'。本团队差异化创新点：①媒体情绪因子量化（中文财经新闻 + THUOCL/HowNet 情绪词典构建每日情绪指标 BI）；②C1–C9 九条价格传导链假设体系（含可检验假设与反例边界）；③'精确源/未公开/开放代理'三分法的数据治理披露；④AI Agent 智能问数 + 归因 + 报告生成的分析闭环。",
  ],
  [
    "完整性与可复现性",
    "评分标准",
    "10%",
    "要求：基于 Smartbi 导入 xml 资源可完整恢复；材料齐全（报告、数据字典、来源说明、合规声明、演示视频）。本团队已具备：固定结构工作簿（说明总览—传导链—因素表—主表—原始表—来源口径—质量检查）、逐格 inspect.ndjson、SHA-256 校验和、PNG 预览复核。",
  ],
];

writeDataSheet(
  s1,
  "XH-202612 Smartbi AI 驱动的数据创新平台研究：硬性要求与评分标准",
  "黄色高亮行为占比最高（25%）的最重要评分项：'数据分析方法与技术应用'与'可视化呈现与交互体验'。占比列中'硬性门槛'表示不计分但必须满足，否则作品无效。依据：赛题原文 XH-202612（12页）及 Smartbi 官方公开技术资料整理。",
  headers1,
  rows1,
  [26, 16, 22, 95],
  "RequirementsTable",
  [8, 9], // 两个25%行高亮（0基：第9、10行数据）
);

// ============ Sheet 2：整体流程 ============
const s2 = wb.worksheets.add("整体流程");
s2.showGridLines = false;

const headers2 = ["阶段", "环节", "具体动作", "涉及技术/工具", "产出物"];
const rows2 = [
  ["第一步", "选定场景", "选择'有痛点、有数据、有价值'的真实场景并论证价值（引用权威资料、量化影响范围）", "政策与行业研究、权威数据引用", "选题论证（计入问题价值 20 分）"],
  ["第二步-1", "数据准备", "导入原始数据（Excel/数据库/API）→ 清洗（缺失值、异常值≤10%、格式统一）→ 构建数据模型（星型/雪花模型）", "Smartbi 数据接入、自助 ETL、数据建模；本团队：SGE/FRED/CFTC/GPR/世界银行等 8 类源、防前视对齐（lag1、asof、发布日假设）", "金银日度/月度建模主表 + 数据字典 + 来源口径表"],
  ["第二步-2", "探索性分析与洞察", "多维交叉分析、下钻/上卷、动态筛选，回答'哪些因素导致金价波动''地缘事件影响是否显著'等问题", "Smartbi OLAP 多维分析、透视分析", "因素地图、因子扫描、事件时间线"],
  ["第二步-3", "AI 增强分析（核心亮点）", "智能问数（一句话生成图表）、归因分析（问'为什么'自动生成层级归因报告）、智能生成报告、趋势预测", "Smartbi AIChat 白泽：LLM + 指标语义层 + RAG 知识增强 + AI Agent 工作流；预测建模（可融入媒体情绪因子与 CNN-QRLSTM 思路）", "问数演示、归因报告、预测结果"],
  ["第二步-4", "可视化与数据叙事", "设计交互式 Dashboard，围绕一个问题组织图表，交互响应 ≤10 秒", "Smartbi 仪表盘、联动筛选、下钻", "交互式 Dashboard（计入可视化 25 分）"],
  ["第二步-5", "落地建议", "提出可量化行动建议（如'建议在 A 区域增设 2 个快递柜，预计提升配送效率 15%'式表述）", "归因结论 → 业务建议转化", "量化建议（计入报告）"],
  ["收尾", "提交与答辩", "整理报告、xml 资源、演示视频（≤3 分钟）、合规声明；9 月 1 日前提交；11 月底现场擂台赛", "Smartbi 资源导出（xml）、视频录制", "完整参赛作品包"],
];

writeDataSheet(
  s2,
  "比赛整体流程：两步走 + 五个关键环节",
  "依据赛题原文整理：第一步选定场景；第二步在 Smartbi 平台完成数据准备→探索性分析→AI 增强分析→可视化叙事→落地建议的端到端闭环。",
  headers2,
  rows2,
  [12, 22, 52, 52, 32],
  "ProcessTable",
);

// ============ 预览 + 导出 ============
import fs from "node:fs";
for (const [name, range] of [["硬性要求与评分标准", "A1:D16"], ["整体流程", "A1:E11"]]) {
  const blob = await wb.render({ sheetName: name, range, scale: 1.0, format: "png" });
  fs.writeFileSync(`预览_${name}.png`, new Uint8Array(await blob.arrayBuffer()));
}
const out = await SpreadsheetFile.exportXlsx(wb);
const target = "XH-202612比赛硬性要求与评分标准_含技术方案.xlsx";
await out.save(target);
console.log("saved:", target);

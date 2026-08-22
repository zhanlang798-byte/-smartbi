import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workspace = process.cwd();
const root = path.resolve("research/media_sentiment_gold_paper");
const rawDir = path.join(root, "datasets/raw");
const processedDir = path.join(root, "datasets/processed");
const metadataDir = path.join(root, "metadata");
const outputDir = path.join(root, "outputs/019f56e7-91fe-7a43-b1d0-ae50e45c9d0c");
const previewDir = path.join(outputDir, "previews");
await Promise.all([processedDir, metadataDir, outputDir, previewDir].map((p) => fs.mkdir(p, { recursive: true })));

const startDate = "2022-02-01";
const endDate = "2025-02-28";
const inWindow = (s) => s >= startDate && s <= endDate;
const asDate = (s) => new Date(`${s}T00:00:00Z`);
const rel = (p) => path.relative(workspace, p).replaceAll("\\", "/");

function parseSimpleCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

function csvEscape(value) {
  if (value == null) return "";
  const s = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

async function writeCsv(filePath, headers, rows) {
  const text = "\uFEFF" + [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n") + "\r\n";
  await fs.writeFile(filePath, text, "utf8");
}

const treasurySource = path.resolve("data/processed/treasury_daily_yields.csv");
const dollarSource = path.resolve("data/processed/fed_h10_broad_dollar_daily.csv");
const commoditySource = path.resolve("data/processed/world_bank_monthly_prices.csv");

const treasuryRows = parseSimpleCsv(await fs.readFile(treasurySource, "utf8"))
  .filter((r) => inWindow(r.date) && r.real_10y_pct !== "")
  .map((r) => [r.date, Number(r.real_10y_pct), "美国财政部10年期TIPS实际收益率；论文EIR的开放代理，不是原作者数据"]);

const dollarRows = parseSimpleCsv(await fs.readFile(dollarSource, "utf8"))
  .filter((r) => inWindow(r.date) && r.broad_dollar_index !== "")
  .map((r) => [r.date, Number(r.broad_dollar_index), "美联储广义美元指数；并非ICE DXY，不能冒充论文USDX"]);

const commodityRows = parseSimpleCsv(await fs.readFile(commoditySource, "utf8"))
  .filter((r) => inWindow(r.date))
  .map((r) => [
    r.date,
    Number(r.brent_usd_bbl),
    Number(r.copper_usd_mt),
    Number(r.gold_usd_oz),
    Number(r.silver_usd_oz),
    "世界银行Pink Sheet月度价格；频率和口径均与论文图示日频序列不同",
  ]);

const epuInput = await SpreadsheetFile.importXlsx(await FileBlob.load(path.join(rawDir, "China_Mainland_Paper_EPU.xlsx")));
const epuSheet = epuInput.worksheets.getItem("EPU 2000 onwards");
const epuValues = epuSheet.getRange("A2:C319").values;
const epuRows = epuValues
  .filter((r) => Number.isFinite(r[0]) && Number.isFinite(r[1]) && Number.isFinite(r[2]))
  .map((r) => [`${r[0]}-${String(r[1]).padStart(2, "0")}-01`, Number(r[2]), "Davis-Liu-Sheng中国大陆报纸EPU；论文未注明EPU版本，故仅作候选代理"])
  .filter((r) => inWindow(r[0]));

const thuoRaw = (await fs.readFile(path.join(rawDir, "THUOCL_caijing.txt"), "utf8")).replace(/^\uFEFF/, "").trim();
const thuoRows = thuoRaw.split(/\r?\n/).filter(Boolean).map((line) => {
  const idx = line.lastIndexOf("\t");
  return [line.slice(0, idx).trim(), Number(line.slice(idx + 1))];
});

const processedFiles = {
  thuo: path.join(processedDir, "THUOCL_caijing_utf8.csv"),
  epu: path.join(processedDir, "China_Mainland_EPU_proxy_2022-02_to_2025-02.csv"),
  treasury: path.join(processedDir, "US_Treasury_real_yield_proxy_2022-02_to_2025-02.csv"),
  dollar: path.join(processedDir, "Fed_broad_dollar_proxy_2022-02_to_2025-02.csv"),
  commodity: path.join(processedDir, "World_Bank_commodity_proxies_2022-02_to_2025-02.csv"),
};

await writeCsv(processedFiles.thuo, ["word", "document_frequency"], thuoRows);
await writeCsv(processedFiles.epu, ["date", "china_mainland_epu_index", "provenance_note"], epuRows);
await writeCsv(processedFiles.treasury, ["date", "real_10y_yield_pct", "provenance_note"], treasuryRows);
await writeCsv(processedFiles.dollar, ["date", "broad_dollar_index", "provenance_note"], dollarRows);
await writeCsv(processedFiles.commodity, ["date", "brent_usd_bbl", "copper_usd_mt", "gold_usd_oz", "silver_usd_oz", "provenance_note"], commodityRows);

const catalog = [
  ["论文", "论文PDF", "完整论文", "2026-02-28", "一次性", "MDPI/PMC", "https://www.mdpi.com/1099-4300/28/3/271", "论文原文", "已下载", rel(path.join(root, "paper/Ji_et_al_2026_Entropy_CNN-QRLSTM.pdf")), "CC BY 4.0", "精确", "40页，DOI 10.3390/e28030271"],
  ["论文", "全文XML", "结构化全文与参考文献", "2026-02-28", "一次性", "Europe PMC", "https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13025532/fullTextXML", "论文原文", "已下载", rel(path.join(metadataDir, "europepmc_fulltext.xml")), "PMC开放获取", "精确", "未发现supplementary-material节点"],
  ["文本词典", "THUOCL财经词表", "论文参考文献32所列清华财经类词汇词库", "更新于2016-12-24", "3830词条", "THUNLP/Heywhale", "https://github.com/thunlp/THUOCL", "论文明确引用", "已下载", rel(path.join(rawDir, "THUOCL_caijing.txt")), "MIT；成果中应声明使用清华大学开放中文词库", "精确引用源", "词+DF值，Tab分隔；它不是论文最终55正/104负情绪词典"],
  ["目标价格", "WGC/Global黄金价格", "论文所谓WGC或Global市场金价，具体定盘价/时点未给出", "2022-02-01至2025-02-28", "日频/含非交易日", "World Gold Council/Goldhub", "https://china.gold.org/goldhub/data/gold-prices", "论文声称使用但未给数据文件", "未下载", "", "LBMA历史基准价受IBA许可约束", "不可精确复现", "论文没有定义字段、币种、时点和许可"],
  ["目标价格", "LBMA黄金价格", "LBMA Gold Price，AM/PM及币种未说明", "2022-02-01至2025-02-28", "日频/含非交易日", "LBMA/IBA", "https://www.lbma.org.uk/prices-and-data/lbma-precious-metal-prices", "论文声称使用但未给数据文件", "需授权", "", "获取、使用或再分发历史基准价通常需IBA许可", "不可精确复现", "不以第三方镜像规避许可"],
  ["目标价格", "SGE黄金价格", "上海黄金交易所金价，合约和收盘/加权均价未说明", "2022-02-01至2025-02-28", "日频/含非交易日", "上海黄金交易所", "https://www.sge.com.cn/sjzx/quotation_daily_new", "论文声称使用但未给数据文件", "官方入口可查", "", "按交易所网站条款使用", "定义不充分", "2024年起新查询页；更早数据在历史列表"],
  ["文本语料", "金投网黄金新闻", "标题与正文共1303篇", "2022-02-01至2025-02-28", "文章级→日聚合", "金投网", "https://www.cngold.org/", "论文描述但未发布", "未公开", "", "新闻正文受版权及网站条款约束", "不可复现", "作者未给URL清单、抓取时间、去重规则或文本文件"],
  ["情绪指标", "BI媒体情绪极性", "基于领域词典和语义规则的每日聚合情绪", "2022-02-01至2025-02-28", "日频", "作者构造", "https://www.mdpi.com/1099-4300/28/3/271", "论文描述但未发布", "未公开", "", "作者生成数据", "不可复现", "最终55个正向词、104个负向词及日度BI均未附"],
  ["文本词典", "HowNet情感词典", "基础情感词典之一", "未说明", "词表", "HowNet", "", "正文提及，未给参考文献或版本", "未下载", "", "版本和授权不明确", "不可精确复现", "需作者说明具体版本和许可"],
  ["解释变量", "USDX", "美元指数，论文未给供应商/代码", "2022-02-01至2025-02-28", "图示近似日频", "未注明", "", "正文变量表", "仅有代理", rel(processedFiles.dollar), "美联储数据可公开使用；代理口径需披露", "代理", `已整理${dollarRows.length}条非空观测；广义美元指数不等于ICE DXY`],
  ["解释变量", "CPI", "CPI国家、基期和季调均未说明；图示约99-103", "2022-02-01至2025-02-28", "月频阶梯", "未注明", "", "正文变量表", "未下载", "", "口径不明", "不可精确复现", "图形更像中国CPI指数，但属于推断"],
  ["解释变量", "EIR", "论文写作effective/real interest rate，期限和国家未说明", "2022-02-01至2025-02-28", "图示近似日频", "未注明", "", "正文变量表", "仅有代理", rel(processedFiles.treasury), "美国财政部公开数据", "代理", `已整理${treasuryRows.length}条10年期TIPS实际收益率`],
  ["解释变量", "M2", "国家、单位、是否同比/存量及缩放未说明", "2022-02-01至2025-02-28", "月频阶梯", "未注明", "", "正文变量表", "未下载", "", "口径不明", "不可精确复现", "图示2.45-3.15可能经过缩放，不能安全反推"],
  ["解释变量", "EPU", "经济政策不确定性指数，版本未说明", "2022-02-01至2025-02-28", "月频阶梯", "未注明", "", "正文变量表", "仅有候选代理", rel(processedFiles.epu), "CC BY 4.0；注明Davis、Liu、Sheng及policyuncertainty.com", "代理", `已整理${epuRows.length}个月；论文图示数值不能唯一锁定该版本`],
  ["解释变量", "Petroleum", "石油价格，品种和交易所未说明", "2022-02-01至2025-02-28", "图示近似日频", "未注明", "", "正文变量表", "仅有代理", rel(processedFiles.commodity), "世界银行开放数据，注明来源", "代理", "已整理月度Brent；频率与论文不同"],
  ["解释变量", "Copper", "铜价，图示约5.5万-8.5万，疑似人民币/吨", "2022-02-01至2025-02-28", "图示近似日频", "未注明", "", "正文变量表", "仅有代理", rel(processedFiles.commodity), "世界银行开放数据，注明来源", "代理", "已整理美元/吨月度铜价；不能冒充论文疑似国内铜价"],
  ["解释变量", "ACI", "Actuaries Climate Index，区域/季节聚合规则未说明", "2022-02-01至2025-02-28", "图示阶梯", "Actuaries Climate Index", "https://actuariesclimateindex.org/data/", "正文变量表（来源未引用）", "需人工接受条款", "", "仅限个人专业/非商业研究；禁止机器人抓取和再分发", "未下载", "必须由参赛者本人阅读并勾选条款后下载，不能自动抓取"],
  ["开放代理", "世界银行商品月度数据", "Brent、铜、金、银月度价格", "2022-02-01至2025-02-28", "月频", "World Bank Commodity Markets", "https://www.worldbank.org/en/research/commodity-markets", "非论文明确引用", "已整理", rel(processedFiles.commodity), "注明世界银行来源", "代理/拓展", `${commodityRows.length}个月，可用于先跑通流程及金银联合建模`],
];

const risks = [
  ["高", "样本天数矛盾", "论文称2022-02-01至2025-02-28共1093天（含非交易日），但含首尾的自然日为1124天，相差31天。", "要求作者提供最终日期索引；复现时固定交易日历并输出缺失日清单。"],
  ["高", "无数据/代码附件", "PMC XML没有supplementary-material节点，Data Availability只声称提供WGC、LBMA、SGC市场价格，实际未给文件或链接。", "把‘作者未公开’作为复现限制写入论文，必要时联系通讯作者。"],
  ["高", "价格目标口径不清", "WGC、LBMA、SGE的定盘时点、币种、合约、单位和非交易日处理均不完整；图中还混合USD/oz与CNY/g。", "比赛中只选一个可审计主目标，另两市场做稳健性检验并显式换汇换算。"],
  ["高", "全样本分解泄漏风险", "若先对全样本做EEMD再切70/30，测试期信息会进入训练期分量；论文未说明是否滚动分解。", "必须在每个walk-forward窗口内单独拟合分解/标准化/特征选择。"],
  ["高", "插值可能使用未来信息", "论文用前后各5个点做拉格朗日插值；对日内可用性和非交易日而言，后5点属于未来。", "预测任务避免双向插值；仅用截至t时点可获得的信息，或直接按交易日对齐。"],
  ["高", "新闻与BI不可复现", "1303篇文章、URL清单、最终正负词表、否定/程度规则和日度BI均未公开。", "保存URL、发布时间、抓取时间、正文哈希、去重规则、词典版本和逐日聚合明细。"],
  ["中", "外生变量定义缺失", "USDX、CPI、EIR、M2、EPU、油、铜、ACI均没有数据代码、单位或来源；图形只能提供弱线索。", "制作数据字典：source_id、ticker、unit、timezone、release_lag、frequency、revision_policy。"],
  ["中", "超高拟合表现需审计", "论文报告部分价格水平预测MAPE约0.542%、R²约0.998；价格水平高自相关会使R²偏高。", "增加naive t+1=t、随机游走、ARIMA/XGBoost基线，并预测收益率、方向和区间覆盖率。"],
  ["中", "70/30一次切分不足", "单次时间切分无法反映不同金价制度阶段，且未见多随机种子或滚动稳定性。", "采用扩展窗口walk-forward、危机/平稳分段、Diebold-Mariano检验和bootstrap置信区间。"],
  ["中", "ACI许可限制", "下载前必须勾选条款，条款允许个人专业/非商业研究但禁止机器人抓取和再分发。", "由团队成员人工下载，仓库只保存处理脚本、字段说明和原始文件哈希，不公开再分发原始数据。"],
];

const paperSummary = [
  ["论文题目", "Forecasting the Price of Gold with Integrated Media Sentiment—A Prediction Framework Based on Online News Sentiment Mining with CNN-QRLSTM"],
  ["期刊与日期", "Entropy 2026, 28(3), 271；2026-02-28发表；DOI 10.3390/e28030271"],
  ["研究窗口", "2022-02-01至2025-02-28；论文写1093天，但自然日核算为1124天"],
  ["目标市场", "WGC/Global、LBMA、上海黄金交易所（SGE；Data Availability中写成SGC）"],
  ["文本数据", "金投网黄金新闻1303篇；抽取300篇选种子词；最终55正向词、104负向词"],
  ["特征", "USDX、CPI、EIR、M2、EPU、石油、铜、ACI，以及媒体情绪BI"],
  ["处理", "缺失值拉格朗日插值；EEMD分解；Hurst与样本熵双重判据剔除IMF1/IMF2"],
  ["模型", "CNN提取局部特征 + QRLSTM分位数预测 + 注意力；点预测与区间预测"],
  ["验证", "按时间70%训练/30%测试；文中称BI使用一期滞后以降低前视偏差"],
  ["代表性结果", "WGC模型加入BI后，论文报告MAE 13.2、MAPE 0.542%、R² 0.998"],
  ["复现结论", "框架值得借鉴，但论文自身未公开数值数据、代码、最终词典或情绪指数，不能按原样复现"],
];

const recommendations = [
  [1, "先复现无情绪基线", "统一一个主目标（如Au99.99收盘或LBMA PM）；做naive、ARIMA、XGBoost、LSTM。", "证明复杂模型真的有增益"],
  [2, "建立时间可用性账本", "给每个变量记录发布时间、时区、修订状态和最早可用时点；所有特征至少滞后一期。", "阻断最常见的数据泄漏"],
  [3, "重建可审计情绪管线", "保存新闻URL/时间/哈希；使用领域词典与中文金融预训练模型双路线；输出逐篇分值。", "兼顾解释性与效果"],
  [4, "采用walk-forward", "分解、标准化、特征选择、调参全部嵌入每个滚动窗口；保留最终盲测期。", "模拟真实部署"],
  [5, "从价格水平扩展到收益与风险", "同时预测t+1对数收益、上涨概率、0.05/0.5/0.95分位数和区间覆盖率。", "避免仅靠高自相关获得漂亮R²"],
  [6, "做事件与消融实验", "比较无BI/词典BI/预训练BI；按美联储、地缘冲突、央行购金事件分段。", "形成挑战杯的机制解释和应用价值"],
];

await writeCsv(
  path.join(metadataDir, "dataset_manifest.csv"),
  ["类别", "变量或资产", "论文定义/口径", "时间范围", "频率", "来源", "来源URL", "与论文关系", "可得状态", "本地文件", "许可/使用限制", "精确或代理", "备注"],
  catalog,
);

const wb = Workbook.create();
const overview = wb.worksheets.add("导读");
const catalogSheet = wb.worksheets.add("数据清单");
const riskSheet = wb.worksheets.add("复现风险");
const lexiconSheet = wb.worksheets.add("THUOCL财经词表");
const epuOut = wb.worksheets.add("EPU代理");
const realYieldOut = wb.worksheets.add("实际利率代理");
const dollarOut = wb.worksheets.add("美元指数代理");
const commodityOut = wb.worksheets.add("商品月度代理");
const checks = wb.worksheets.add("质量检查");

for (const s of wb.worksheets) s.showGridLines = false;

const navy = "#17365D";
const blue = "#D9EAF7";
const light = "#F3F6F9";
const green = "#E2F0D9";
const amber = "#FFF2CC";
const red = "#FCE4D6";
const white = "#FFFFFF";
const muted = "#5B6573";

function styleTitle(sheet, range, title) {
  const r = sheet.getRange(range);
  r.merge();
  r.values = [[title]];
  r.format = { fill: navy, font: { bold: true, color: white, size: 16 }, verticalAlignment: "center" };
  r.format.rowHeight = 30;
}

function styleHeader(range) {
  range.format = {
    fill: navy,
    font: { bold: true, color: white },
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "outside", style: "thin", color: "#9FB3C8" },
  };
  range.format.rowHeight = 30;
}

function writeDataSheet(sheet, title, headers, rows, widths, tableName, note) {
  const cols = headers.length;
  const lastCol = String.fromCharCode(64 + cols);
  styleTitle(sheet, `A1:${lastCol}1`, title);
  sheet.getRange(`A2:${lastCol}2`).merge();
  sheet.getRange("A2").values = [[note]];
  sheet.getRange(`A2:${lastCol}2`).format = { fill: light, font: { color: muted, italic: true }, wrapText: true };
  sheet.getRange(`A4:${lastCol}4`).values = [headers];
  styleHeader(sheet.getRange(`A4:${lastCol}4`));
  if (rows.length) sheet.getRangeByIndexes(4, 0, rows.length, cols).values = rows;
  const lastRow = 4 + rows.length;
  if (rows.length) {
    const table = sheet.tables.add(`A4:${lastCol}${lastRow}`, true, tableName);
    table.style = "TableStyleMedium2";
    table.showBandedRows = true;
  }
  sheet.freezePanes.freezeRows(4);
  widths.forEach((w, i) => sheet.getRangeByIndexes(0, i, Math.max(lastRow, 5), 1).format.columnWidth = w);
  if (rows.length) sheet.getRangeByIndexes(4, 0, rows.length, cols).format.verticalAlignment = "top";
}

styleTitle(overview, "A1:H1", "融合媒体情绪的黄金价格预测：论文学习与数据复现包");
overview.getRange("A2:H2").merge();
overview.getRange("A2").values = [["结论：论文方法框架可借鉴，但原作者未公开模型数据、代码、最终情绪词典与BI。工作簿将精确引用源和开放代理严格分开。"]];
overview.getRange("A2:H2").format = { fill: amber, font: { bold: true, color: "#7F6000" }, wrapText: true, verticalAlignment: "center" };
overview.getRange("A2:H2").format.rowHeight = 42;
overview.getRange("A4:B4").values = [["项目", "论文信息/核验结果"]];
styleHeader(overview.getRange("A4:B4"));
overview.getRangeByIndexes(4, 0, paperSummary.length, 2).values = paperSummary;
overview.tables.add(`A4:B${4 + paperSummary.length}`, true, "PaperSummaryTable").style = "TableStyleMedium2";
overview.getRange("D4:G4").values = [["顺序", "竞赛复现建议", "具体动作", "目的"]];
styleHeader(overview.getRange("D4:G4"));
overview.getRangeByIndexes(4, 3, recommendations.length, 4).values = recommendations;
overview.tables.add(`D4:G${4 + recommendations.length}`, true, "RecommendationsTable").style = "TableStyleMedium4";
overview.getRange("D13:E16").values = [
  ["数据状态统计", "数量"],
  ["已下载/已整理", null],
  ["代理或候选代理", null],
  ["未公开/未下载/需授权", null],
];
styleHeader(overview.getRange("D13:E13"));
overview.getRange("E14").formulas = [[`=COUNTIF('数据清单'!$I$5:$I$${4 + catalog.length},"已下载")+COUNTIF('数据清单'!$I$5:$I$${4 + catalog.length},"已整理")`]];
overview.getRange("E15").formulas = [[`=COUNTIF('数据清单'!$I$5:$I$${4 + catalog.length},"仅有代理")+COUNTIF('数据清单'!$I$5:$I$${4 + catalog.length},"仅有候选代理")`]];
overview.getRange("E16").formulas = [[`=COUNTIF('数据清单'!$I$5:$I$${4 + catalog.length},"未公开")+COUNTIF('数据清单'!$I$5:$I$${4 + catalog.length},"未下载")+COUNTIF('数据清单'!$I$5:$I$${4 + catalog.length},"需授权")+COUNTIF('数据清单'!$I$5:$I$${4 + catalog.length},"需人工接受条款")`]];
overview.getRange("E14:E16").format.numberFormat = "0";
overview.getRange("A:A").format.columnWidth = 20;
overview.getRange("B:B").format.columnWidth = 62;
overview.getRange("C:C").format.columnWidth = 3;
overview.getRange("D:D").format.columnWidth = 9;
overview.getRange("E:E").format.columnWidth = 25;
overview.getRange("F:F").format.columnWidth = 52;
overview.getRange("G:G").format.columnWidth = 28;
overview.getRange("A5:G16").format.wrapText = true;
overview.getRange("A5:G15").format.rowHeight = 42;
overview.freezePanes.freezeRows(4);

writeDataSheet(
  catalogSheet,
  "论文数据资产清单：精确引用、受限数据与开放代理",
  ["类别", "变量或资产", "论文定义/口径", "时间范围", "频率", "来源", "来源URL", "与论文关系", "可得状态", "本地文件", "许可/使用限制", "精确或代理", "备注"],
  catalog,
  [13, 22, 38, 21, 15, 22, 45, 28, 18, 42, 42, 18, 48],
  "DatasetCatalogTable",
  "黄色/红色状态用于提醒，但判断以‘可得状态’和‘精确或代理’文本为准。所有代理数据都不能当作原作者数据。",
);
catalogSheet.getRange(`C5:M${4 + catalog.length}`).format.wrapText = true;
catalogSheet.getRange(`A5:M${4 + catalog.length}`).format.rowHeight = 42;
for (let i = 0; i < catalog.length; i++) {
  const status = catalog[i][8];
  const cell = catalogSheet.getRange(`I${5 + i}`);
  if (["已下载", "已整理"].includes(status)) cell.format.fill = green;
  else if (status.includes("代理") || status.includes("官方入口")) cell.format.fill = amber;
  else cell.format.fill = red;
}

writeDataSheet(
  riskSheet,
  "复现风险与竞赛改进清单",
  ["风险等级", "问题", "证据/影响", "竞赛中应如何处理"],
  risks,
  [12, 25, 70, 62],
  "ReproRisksTable",
  "优先处理高风险项。论文结果只能作为方法启发，不能在数据口径和防泄漏未通过前直接复刻。",
);
riskSheet.getRange(`A5:D${4 + risks.length}`).format.wrapText = true;
riskSheet.getRange(`A5:D${4 + risks.length}`).format.rowHeight = 58;
for (let i = 0; i < risks.length; i++) riskSheet.getRange(`A${5 + i}`).format.fill = risks[i][0] === "高" ? red : amber;

writeDataSheet(
  lexiconSheet,
  "THUOCL财经词表（论文参考文献32）",
  ["词条", "文档频次DF"],
  thuoRows,
  [30, 18],
  "ThuoLexiconTable",
  "来源：THUNLP THUOCL，MIT。注意：这是基础财经词库，不是论文最终55正向/104负向情绪词表。",
);
lexiconSheet.getRange(`B5:B${4 + thuoRows.length}`).format.numberFormat = "#,##0";

writeDataSheet(
  epuOut,
  "中国大陆报纸EPU候选代理（非论文原作者数据）",
  ["日期", "EPU指数", "来源说明"],
  epuRows.map((r) => [asDate(r[0]), r[1], r[2]]),
  [16, 18, 72],
  "EpuProxyTable",
  "来源：Davis、Liu、Sheng / policyuncertainty.com。论文没有说明EPU版本，不能将本表声称为论文原序列。",
);
epuOut.getRange(`A5:A${4 + epuRows.length}`).format.numberFormat = "yyyy-mm-dd";
epuOut.getRange(`B5:B${4 + epuRows.length}`).format.numberFormat = "0.000";

writeDataSheet(
  realYieldOut,
  "美国10年期实际收益率代理（非论文原作者EIR）",
  ["日期", "10年期实际收益率(%)", "来源说明"],
  treasuryRows.map((r) => [asDate(r[0]), r[1], r[2]]),
  [16, 24, 72],
  "RealYieldProxyTable",
  "来源：U.S. Treasury TIPS Real Yield Curve。论文EIR的期限、国家和单位均未说明。",
);
realYieldOut.getRange(`A5:A${4 + treasuryRows.length}`).format.numberFormat = "yyyy-mm-dd";
realYieldOut.getRange(`B5:B${4 + treasuryRows.length}`).format.numberFormat = "0.00";

writeDataSheet(
  dollarOut,
  "美联储广义美元指数代理（不等于ICE DXY）",
  ["日期", "广义美元指数", "来源说明"],
  dollarRows.map((r) => [asDate(r[0]), r[1], r[2]]),
  [16, 20, 72],
  "DollarProxyTable",
  "来源：Federal Reserve H.10 Broad Dollar Index。论文USDX来源未说明；本序列只用于开放复现。",
);
dollarOut.getRange(`A5:A${4 + dollarRows.length}`).format.numberFormat = "yyyy-mm-dd";
dollarOut.getRange(`B5:B${4 + dollarRows.length}`).format.numberFormat = "0.0000";

writeDataSheet(
  commodityOut,
  "世界银行商品月度代理（含金银扩展）",
  ["日期", "Brent(美元/桶)", "铜(美元/吨)", "金(美元/盎司)", "银(美元/盎司)", "来源说明"],
  commodityRows.map((r) => [asDate(r[0]), r[1], r[2], r[3], r[4], r[5]]),
  [16, 18, 18, 18, 18, 72],
  "CommodityProxyTable",
  "来源：World Bank Commodity Price Data (Pink Sheet)。月频开放代理，不能替代论文未说明的日频油价/铜价。",
);
commodityOut.getRange(`A5:A${4 + commodityRows.length}`).format.numberFormat = "yyyy-mm-dd";
commodityOut.getRange(`B5:E${4 + commodityRows.length}`).format.numberFormat = "#,##0.00";

styleTitle(checks, "A1:G1", "质量检查与复现边界");
checks.getRange("A3:G3").values = [["检查项", "实际值", "期望值", "差异", "容差", "状态", "说明"]];
styleHeader(checks.getRange("A3:G3"));
const checkRows = [
  ["论文时间窗自然日数", 1124, 1093, null, 0, null, "论文声称1093天，与日期范围不一致"],
  ["THUOCL词条数", null, 3830, null, 0, null, "THUNLP官方README列明3830词条"],
  ["EPU代理月数", null, 37, null, 0, null, "2022-02至2025-02，含首尾"],
  ["实际利率代理非空观测", treasuryRows.length, treasuryRows.length, null, 0, null, "处理前后数量应一致"],
  ["美元代理非空观测", dollarRows.length, dollarRows.length, null, 0, null, "处理前后数量应一致"],
  ["商品月度代理月数", commodityRows.length, 37, null, 0, null, "2022-02至2025-02，含首尾"],
  ["论文是否附原始数值数据", 0, 1, null, 0, null, "0表示未找到可下载的作者附件；这是一项复现限制，不是处理失败"],
];
checks.getRangeByIndexes(3, 0, checkRows.length, 7).values = checkRows;
checks.getRange("B5").formulas = [[`=COUNTA('THUOCL财经词表'!$A$5:$A$${4 + thuoRows.length})`]];
checks.getRange("B6").formulas = [[`=COUNTA('EPU代理'!$A$5:$A$${4 + epuRows.length})`]];
for (let i = 0; i < checkRows.length; i++) {
  const row = 4 + i;
  checks.getRange(`D${row}`).formulas = [[`=B${row}-C${row}`]];
  checks.getRange(`F${row}`).formulas = [[`=IF(ABS(D${row})<=E${row},"OK","REVIEW")`]];
}
checks.tables.add(`A3:G${3 + checkRows.length}`, true, "QualityChecksTable").style = "TableStyleMedium2";
checks.getRange(`F4:F${3 + checkRows.length}`).conditionalFormats.add("containsText", { text: "OK", format: { fill: green, font: { color: "#006100", bold: true } } });
checks.getRange(`F4:F${3 + checkRows.length}`).conditionalFormats.add("containsText", { text: "REVIEW", format: { fill: red, font: { color: "#9C0006", bold: true } } });
checks.getRange("A:A").format.columnWidth = 32;
checks.getRange("B:F").format.columnWidth = 14;
checks.getRange("G:G").format.columnWidth = 70;
checks.getRange(`A4:G${3 + checkRows.length}`).format.wrapText = true;
checks.freezePanes.freezeRows(3);

const inspectSummary = await wb.inspect({ kind: "workbook,sheet,table", maxChars: 10000, tableMaxRows: 6, tableMaxCols: 8, tableMaxCellChars: 90 });
await fs.writeFile(path.join(outputDir, "workbook_inspect.ndjson"), inspectSummary.ndjson, "utf8");
const formulaErrors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300, matchFormulas: true },
  maxChars: 5000,
});
await fs.writeFile(path.join(outputDir, "formula_error_scan.ndjson"), formulaErrors.ndjson, "utf8");

const previewRanges = {
  "导读": "A1:H18",
  "数据清单": "A1:M18",
  "复现风险": "A1:D14",
  "THUOCL财经词表": "A1:B30",
  "EPU代理": "A1:C30",
  "实际利率代理": "A1:C30",
  "美元指数代理": "A1:C30",
  "商品月度代理": "A1:F30",
  "质量检查": "A1:G12",
};
for (const [sheetName, range] of Object.entries(previewRanges)) {
  const blob = await wb.render({ sheetName, range, scale: 1.25, format: "png" });
  const safeName = sheetName.replaceAll(/[\\/:*?"<>|]/g, "_");
  await fs.writeFile(path.join(previewDir, `${safeName}.png`), new Uint8Array(await blob.arrayBuffer()));
}

const xlsxPath = path.join(outputDir, "论文数据来源与复现清单.xlsx");
const output = await SpreadsheetFile.exportXlsx(wb);
await output.save(xlsxPath);

const checksumTargets = [
  path.join(root, "README_论文学习与数据说明.md"),
  path.join(root, "paper/Ji_et_al_2026_Entropy_CNN-QRLSTM.pdf"),
  path.join(metadataDir, "europepmc_fulltext.xml"),
  path.join(rawDir, "THUOCL_caijing.txt"),
  path.join(rawDir, "THUOCL_LICENSE.txt"),
  path.join(rawDir, "China_Mainland_Paper_EPU.xlsx"),
  ...Object.values(processedFiles),
  path.join(metadataDir, "dataset_manifest.csv"),
  xlsxPath,
];
const checksumLines = ["SHA256  FILE"];
for (const file of checksumTargets) {
  const hash = crypto.createHash("sha256").update(await fs.readFile(file)).digest("hex");
  checksumLines.push(`${hash}  ${rel(file)}`);
}
await fs.writeFile(path.join(metadataDir, "checksums_sha256.txt"), checksumLines.join("\r\n") + "\r\n", "utf8");

console.log(JSON.stringify({
  xlsxPath,
  rows: { thuo: thuoRows.length, epu: epuRows.length, treasury: treasuryRows.length, dollar: dollarRows.length, commodity: commodityRows.length },
  previews: Object.keys(previewRanges).length,
}, null, 2));

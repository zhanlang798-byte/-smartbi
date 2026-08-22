# -*- coding: utf-8 -*-
"""
00_build_d0_configs.py — D0 研究口径冻结：生成四份 XLSX 配置与 G0 签字模板。
依据总计划书 V4.2 D0 步骤卡。run_id=20260817_v42。
"""
import hashlib, json, datetime, pathlib
import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[1]
CFG, QA = ROOT / "config", ROOT / "data" / "qa"
RUN_ID = "20260817_v42"
NOW = datetime.datetime.now().isoformat(timespec="seconds")

# ---------------------------------------------------------------- 指标目录
indicators = [
    # indicator_code, 中文名, 目标表, 频率, 单位, 方向/公式, 主来源, 替代来源, 许可说明, 责任, 核心
    ("fx_avg_lcu_per_usd", "官方汇率月均值", "country_monthly_risk", "monthly", "本币/美元", "值上升=本币贬值", "WB GEM", "IMF IFS / 央行", "公开", "B", 1),
    ("fx_eom_lcu_per_usd", "官方汇率月末值", "country_monthly_risk", "monthly", "本币/美元", "月末组合估值", "WB GEM", "IMF IFS / 央行", "公开", "B", 1),
    ("cpi_index", "CPI 指数", "country_monthly_risk", "monthly", "原指数", "保留基期,cpi_base_info 记录换基", "WB GEM", "统计局 / IFS", "公开", "B", 1),
    ("inflation_yoy", "通胀同比", "country_monthly_risk", "monthly", "比例", "CPI_t/CPI_{t-12}-1", "派生", "-", "派生", "B", 1),
    ("fx_reserves_usd", "外汇储备", "country_monthly_risk", "monthly", "美元", "定义范围必须稳定", "WB GEM", "IMF IFS / 央行", "公开", "B", 0),
    ("reserve_change_12m", "储备12个月变化率", "country_monthly_risk", "monthly", "比例", "R_t/R_{t-12}-1", "派生", "-", "派生", "B", 0),
    ("imports_usd", "进口额", "country_monthly_risk", "monthly", "美元/月", "覆盖月数公式分母,记录季调状态", "IMF", "央行 / 海关", "公开", "B", 0),
    ("reserve_import_months", "储备进口覆盖月数", "country_monthly_risk", "monthly", "月", "优先官方值;计算值标记 calculation_method", "IMF/央行", "计算", "公开", "B", 0),
    ("parallel_fx_lcu_per_usd", "平行汇率", "country_monthly_risk", "daily/monthly", "本币/美元", "仅可信来源覆盖国家", "经核验官方/研究源", "-", "逐源核验", "B", 0),
    ("parallel_premium", "平行价差", "country_monthly_risk", "monthly", "比例", "平行/官方-1;无可信平行价不计算", "派生", "-", "派生", "B", 0),
    ("country_gpr", "国别地缘风险指数", "country_monthly_risk", "monthly", "指数", "仅来源真实覆盖国家,不填区域平均", "Banco de España GPR", "-", "公开", "B", 0),
    ("fx_mom", "汇率月度变化", "country_monthly_risk", "monthly", "比例", "FX_t/FX_{t-1}-1", "派生", "-", "派生", "B", 0),
    ("fx_yoy", "汇率同比贬值", "country_monthly_risk", "monthly", "比例", "FX_t/FX_{t-12}-1,事件触发用", "派生", "-", "派生", "B", 1),
    ("fx_vol_12m", "汇率12个月波动率(年化)", "country_monthly_risk", "monthly", "年化", "sqrt(12)*sd(Δln FX)", "派生", "-", "派生", "C", 0),
    ("risk_score_equal", "等权风险评分(主模型)", "country_monthly_risk", "monthly", "0-100", "等权可解释", "派生", "-", "派生", "C", 1),
    ("risk_score_entropy", "熵权风险评分(挑战)", "country_monthly_risk", "monthly", "0-100", "挑战模型", "派生", "-", "派生", "C", 0),
    ("risk_score_pca", "PCA 风险评分(挑战)", "country_monthly_risk", "monthly", "标准分", "挑战模型", "派生", "-", "派生", "C", 0),
    ("model_sensitive_flag", "模型敏感标志", "country_monthly_risk", "monthly", "0/1", "排名/分组超差异阈值为1", "派生", "-", "派生", "C", 0),
    # 全球周期
    ("industrial_production_index", "工业生产指数", "global_cycle_month", "monthly", "指数", "季调状态分列", "官方统计", "-", "公开", "B", 1),
    ("industrial_production_yoy", "工业生产同比", "global_cycle_month", "monthly", "比例", "连续负值用于衰退/滞胀/通缩", "派生", "-", "派生", "B", 1),
    ("unemployment_rate", "失业率", "global_cycle_month", "monthly", "百分点", "不适用期为空", "官方劳动力资料", "-", "公开", "B", 0),
    ("sahm_realtime_value", "Sahm 实时衰退指标", "global_cycle_month", "monthly", "百分点", "阈值 0.50;3月均值相对前12月低点", "FRED SAHMREALTIME", "-", "公开", "B", 1),
    ("g_cpi_index", "全球/美国 CPI 指数", "global_cycle_month", "monthly", "指数", "保留基期", "官方统计", "-", "公开", "B", 1),
    ("g_cpi_yoy", "CPI 同比", "global_cycle_month", "monthly", "比例", "缺失不当零", "派生", "-", "派生", "B", 1),
    ("policy_rate", "政策利率", "global_cycle_month", "monthly", "百分点", "或预注册代理", "美联储/官方", "-", "公开", "B", 1),
    ("real_policy_rate", "实际政策利率", "global_cycle_month", "monthly", "百分点", "policy_rate - cpi_yoy(口径固定)", "派生", "-", "派生", "C", 1),
    ("yield_spread_10y_3m", "10年-3月期限利差", "global_cycle_month", "monthly", "基点", "-", "FRED/财政部", "-", "公开", "B", 0),
    ("broad_dollar_index", "美元广义指数", "global_cycle_month", "monthly", "指数", "来源和方法固定", "美联储", "-", "公开", "B", 0),
    ("nfci_level", "NFCI 金融条件", "global_cycle_month", "weekly→monthly", "标准化值", "正值=较历史平均更紧;聚合保留周值和 vintage", "芝加哥联储 NFCI", "FRED NFCI", "公开", "B", 1),
    ("nfci_expanding_percentile", "NFCI 扩展窗口分位", "global_cycle_month", "monthly", "分位", "只用当时及此前观测;90% 为信用候选", "派生", "-", "派生", "C", 1),
    ("hy_oas_bps", "高收益 OAS(挑战指标)", "global_cycle_month", "daily→monthly", "基点", "12月扩大≥300bp 触发", "FRED BAMLH0A0HYM2", "NFCI 替代", "受限:未经许可不再分发原始值", "B", 0),
    ("equity_index", "代表股指", "global_cycle_month", "daily→monthly", "指数", "代码固定", "公开市场源", "-", "公开", "B", 0),
    ("equity_drawdown", "股指回撤", "global_cycle_month", "monthly", "比例", "只相对当时已见峰值;≥20% 触发", "派生", "-", "派生", "C", 1),
    ("vix_level", "VIX", "global_cycle_month", "daily→monthly", "指数", "只用于周期/压力解释;储备权重恒 0", "公开市场源", "-", "公开", "B", 0),
    ("oil_price_usd", "原油价格", "global_cycle_month", "daily→monthly", "美元", "只用于传导和对照;权重恒 0", "公开市场源", "-", "公开", "B", 0),
    ("gold_price_usd", "美元黄金价格", "global_cycle_month", "daily→monthly", "美元", "与资产收益表同源对账", "国际权威市场源", "-", "公开", "B", 1),
    ("global_trade_index", "全球贸易量/值指数", "global_cycle_month", "monthly", "指数", "记录发布日期", "CPB/官方", "-", "公开", "B", 0),
    ("property_real_index", "BIS 实际房价指数", "global_cycle_month", "quarterly", "指数", "保留真实观测日/发布日期;asof 关联不伪造月度", "BIS 住宅价格", "登记季度来源", "公开", "B", 0),
    # 资产
    ("local_cash", "经营国本币现金", "asset_monthly_return", "monthly", "比例", "三口径分行", "央行/政策利率代理", "-", "公开", "C", 1),
    ("cny_short", "人民币短期资产", "asset_monthly_return", "monthly", "比例", "利息按可获得日复利或月度近似", "公开利率源", "-", "公开", "C", 1),
    ("usd_cash", "美元现金", "asset_monthly_return", "monthly", "比例", "-", "FRED/财政部", "-", "公开", "C", 1),
    ("usd_tbill_3m", "3个月美元短债代理", "asset_monthly_return", "monthly", "比例", "固定 total-return 或票息近似口径并记录", "美国财政部/FRED", "透明 ETF/指数代理(is_proxy=1)", "公开", "C", 1),
    ("gold_usd", "美元黄金", "asset_monthly_return", "monthly", "比例", "三项分解:金价+汇率+交互", "国际金价源", "-", "公开", "C", 1),
    ("gold_cny_sge", "人民币/上海金", "asset_monthly_return", "monthly", "比例", "记录交易时区、单位、纯度、月度聚合规则", "上海黄金交易所", "-", "公开", "C", 1),
    ("gold_lcu", "当地本币黄金", "asset_monthly_return", "monthly", "比例", "(1+rG,USD)(1+rUSD,L)-1", "派生", "-", "派生", "C", 1),
    ("hedge_proxy", "远期/NDF 套保代理", "asset_monthly_return", "monthly", "比例", "记录点差与交易成本", "公开远期点值", "-", "公开/代理", "C", 0),
    # 覆盖层
    ("odi_flow_usd", "中国 ODI 流量", "country_exposure", "annual", "美元", "缺失为空不填0;与存量不混用", "商务部年度公报", "相关部门官方表", "公开;记录表号页码", "B", 1),
    ("odi_stock_usd", "中国 ODI 存量", "country_exposure", "annual", "美元", "年末存量", "商务部年度公报", "相关部门官方表", "公开;记录表号页码", "B", 1),
    ("enterprise_count", "境外企业数", "country_exposure", "annual", "家", "仅公报明确披露时填,不按区域分摊", "商务部年度公报", "-", "公开", "B", 0),
    ("chinese_enterprise_presence", "中国企业存在证据", "country_exposure", "annual", "布尔/空", "未知与否定分开;必须有 source_id", "公报/企业清单/官方公告", "-", "公开", "B", 1),
    # 政策（年度，禁止复制为月度）
    ("exchange_rate_regime", "汇率制度", "country_policy_year", "annual", "枚举", "原分类与标准分类并存", "IMF AREAER", "正式法规", "公开", "B", 1),
    ("current_account_restriction", "经常项目兑换限制", "country_policy_year", "annual", "枚举", "保留原文摘录/页码/复核状态", "IMF AREAER", "-", "公开", "B", 1),
    ("capital_account_restriction", "资本项目限制", "country_policy_year", "annual", "枚举", "同上", "IMF AREAER", "-", "公开", "B", 1),
    ("fx_surrender_requirement", "外汇收入上缴/结汇要求", "country_policy_year", "annual", "枚举", "同上", "IMF AREAER", "-", "公开", "B", 1),
    ("profit_repatriation_restriction", "利润股息汇出限制", "country_policy_year", "annual", "枚举", "同上", "IMF AREAER", "-", "公开", "B", 1),
    ("capital_repatriation_restriction", "资本汇出限制", "country_policy_year", "annual", "枚举", "同上", "IMF AREAER", "-", "公开", "B", 1),
    ("multiple_currency_practice", "多重汇率做法", "country_policy_year", "annual", "布尔/空", "-", "IMF AREAER", "-", "公开", "B", 0),
    ("chinn_ito_kaopen", "Chinn-Ito 资本开放指数", "country_policy_year", "annual", "指数", "版本必须登记;不越期外推", "Chinn-Ito", "-", "公开", "B", 0),
    ("sanction_status", "制裁发布主体与适用对象", "country_policy_year", "annual/event", "文本", "只用于合规和事件标记,不提供规避路径", "OFAC/欧盟/联合国/当地监管", "-", "公开", "B", 0),
]

companies = [
    ("COMP001", "华为", "", "ICT 与电子", "ICT", "非上市;年报/报告、海外业务、风险说明"),
    ("COMP002", "联想", "000992.HK", "ICT 与电子", "ICT", ""),
    ("COMP003", "中兴通讯", "000063.SZ", "ICT 与电子", "ICT", ""),
    ("COMP004", "传音控股", "688036.SH", "ICT 与电子", "ICT", "非洲手机市场份额高,区域披露粒度注意"),
    ("COMP005", "海尔智家", "600690.SH", "家电与消费制造", "家电", ""),
    ("COMP006", "美的集团", "000333.SZ", "家电与消费制造", "家电", ""),
    ("COMP007", "海信家电", "000921.SZ", "家电与消费制造", "家电", ""),
    ("COMP008", "TCL 科技", "000100.SZ", "家电与消费制造", "家电", ""),
    ("COMP009", "比亚迪", "002594.SZ", "汽车与新能源", "汽车", ""),
    ("COMP010", "上汽集团", "600104.SH", "汽车与新能源", "汽车", ""),
    ("COMP011", "吉利汽车", "000175.HK", "汽车与新能源", "汽车", ""),
    ("COMP012", "长城汽车", "601633.SH", "汽车与新能源", "汽车", ""),
    ("COMP013", "三一重工", "600031.SH", "工程机械与装备", "工程装备", "衍生品口径区分名义本金与公允价值"),
    ("COMP014", "徐工机械", "000425.SZ", "工程机械与装备", "工程装备", ""),
    ("COMP015", "中国中车", "601766.SH", "基建与轨道交通", "基建轨交", "项目所在区域不自动拆到国家"),
    ("COMP016", "中国交建", "601800.SH", "基建与轨道交通", "基建轨交", ""),
    ("COMP017", "紫金矿业", "601899.SH", "资源与能源", "资源能源", "深度情景需记录商品价格暴露"),
    ("COMP018", "洛阳钼业", "603993.SH", "资源与能源", "资源能源", ""),
    ("COMP019", "中国海油", "600938.SH", "资源与能源", "资源能源", ""),
    ("COMP020", "中国石油", "601857.SH", "资源与能源", "资源能源", ""),
]

anchors = [
    (1, "1929—1933 大萧条", 1929, 1933, "信用、系统性危机与通缩", "历史压力层;记录金本位、银行体系和工具不可比性,不套用现代 ETF", "EVT-GREAT-DEPRESSION", 1, 0),
    (2, "1933 黄金政策变化", 1933, 1934, "政策与制度节点", "记录合法持有、兑换和征收制度变化;不单独当市场危机", "EVT-GOLD-1933", 0, 0),
    (3, "1971 布雷顿森林体系解体", 1971, 1973, "国际货币制度变化", "全球月度层起点附近的制度分界;解释自由金价与汇率制度变化", "EVT-BRETTON-WOODS", 0, 1),
    (4, "1973—1980 滞胀", 1973, 1980, "滞胀", "检验通胀、增长、实际利率、美元和黄金协同", "EVT-STAGFLATION-1970S", 1, 1),
    (5, "1987 股灾", 1987, 1987, "资产价格冲击", "检验短时股灾与系统性信用危机的区别", "EVT-CRASH-1987", 1, 1),
    (6, "1997 亚洲金融危机", 1997, 1998, "区域货币与信用危机", "连接全球状态、区域冲击和国别事件", "EVT-ASIA-1997", 1, 1),
    (7, "2000 互联网泡沫", 2000, 2002, "资产泡沫破裂", "与 2008 信用危机对照,不只按股指回撤分类", "EVT-DOTCOM-2000", 1, 1),
    (8, "2008 全球金融危机", 2008, 2009, "信用与系统性金融危机", "检验流动性挤兑、美元需求、黄金阶段性同跌和恢复", "EVT-GFC-2008", 1, 1),
    (9, "1990 日本资产泡沫破裂", 1990, 2003, "资产泡沫破裂与长期停滞", "与 1985 政策节点及失去的三十年同一事件簇", "EVT-JPN-BUBBLE", 1, 1),
    (10, "1994 墨西哥危机", 1994, 1995, "货币与债务危机", "连接国别贬值、美元融资和资本流动", "EVT-MEX-1994", 1, 1),
    (11, "2013 黄金暴跌", 2013, 2013, "黄金反例", "强制保留黄金不占优窗口", "EVT-GOLD-2013", 0, 1),
    (12, "1998 俄罗斯金融危机", 1998, 1998, "债务、货币与信用危机", "区分历史违约机制和当代制裁机制", "EVT-RUS-1998", 1, 1),
    (13, "2001 阿根廷债务危机", 2001, 2002, "债务、银行和资本管制", "检验资金可用性和汇率制度断裂", "EVT-ARG-2001", 1, 1),
    (14, "2010 欧洲主权债务危机", 2010, 2012, "主权与银行反馈", "作为全球融资条件冲击源,不进入亚非拉排名", "EVT-EU-2010", 1, 1),
    (15, "2020 疫情市场崩盘", 2020, 2020, "复合外生冲击", "股市、信用、增长、美元流动性与政策反应多标签", "EVT-COVID-2020", 1, 1),
    (16, "2022 激进加息周期", 2022, 2023, "激进紧缩", "检验美元短债收益上升、本币压力和黄金阶段差异", "EVT-TIGHTENING-2022", 1, 1),
    (17, "1980—2000 黄金熊市", 1980, 2000, "黄金长期反例", "防止用单一起止期预设长期黄金必胜", "EVT-GOLD-BEAR-1980-2000", 0, 1),
    (18, "1985《广场协议》", 1985, 1985, "政策冲击节点", "只登记为日本事件簇政策节点;连接日元升值、宽松、泡沫、破裂与长期停滞;不单独计为危机", "EVT-JPN-BUBBLE", 0, 0),
]

source_priority = [
    ("中国对外投资", "商务部年度公报", "相关部门官方表", "媒体估算替代国家数值"),
    ("月度汇率/CPI", "GEM/IFS/央行统计局", "经登记权威数据库", "WDI 年度值复制 12 月"),
    ("储备/进口覆盖", "IMF/央行/GEM", "WDI 年度补充", "混用不同储备定义"),
    ("资本与汇出限制", "AREAER/正式法规", "学术编码", "媒体标题直接编码"),
    ("资本开放", "Chinn-Ito", "其他公开学术指数", "超出版本期静默外推"),
    ("地缘风险", "真正覆盖该国的月度 GPR", "事件证据", "区域平均填所有国家"),
    ("企业披露", "年报/交易所公告", "公司正式报告", "新闻数字无页码入表"),
    ("黄金", "SGE/国际官方或权威市场源", "经登记公开源", "不同时区价格直接拼接"),
    ("美元短债", "美国财政部/FRED", "透明 ETF/指数代理", "票息与总回报混用"),
    ("衰退与就业", "NBER、FRED Sahm 实时指标", "其他官方劳动力资料", "把事后确认日期伪装为实时信号"),
    ("金融条件", "芝加哥联储 NFCI", "经许可公开信用指标", "未经许可再分发 ICE 高收益利差原始数据"),
    ("全球股市/VIX/原油", "官方或权威公开市场源", "登记透明代理", "把它们加入企业储备权重"),
    ("房地产", "BIS 住宅价格与官方房价", "登记季度来源", "把季度值复制成 3 条真实月度观测"),
    ("历史制度", "央行、监管、法规、NBER 与学术原始研究", "双 B 级权威资料", "用现代 ETF/自由金价回填早期历史"),
    ("制裁与冻结", "发布机构正式文本", "可靠二手资料辅助", "提供规避路径"),
]

log = {"run_id": RUN_ID, "built_at": NOW, "step": "D0", "outputs": []}

def dump(df, path, sheet="data"):
    path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(path, engine="openpyxl") as w:
        df.to_excel(w, sheet_name=sheet, index=False)
    h = hashlib.sha256(path.read_bytes()).hexdigest()
    log["outputs"].append({"path": str(path.relative_to(ROOT)), "rows": len(df), "sha256": h})
    print(f"[ok] {path.name}: {len(df)} rows")

dump(pd.DataFrame(indicators, columns=["indicator_code","indicator_name_zh","table_name","frequency","unit","direction_or_formula","primary_source","fallback_source","license_note","owner_role","is_core"]),
     CFG / "indicator_catalog_v41.xlsx")

dump(pd.DataFrame(companies, columns=["company_id","company_name_zh","security_code","industry","operating_model","notes"]),
     CFG / "company_master_v41.xlsx")

dump(pd.DataFrame(anchors, columns=["anchor_no","event_title_zh","start_year","end_year","core_classification","role_and_limit","event_cluster_id","is_crisis_event","modern_backtest_allowed"]),
     CFG / "historical_event_master_v41.xlsx")

dump(pd.DataFrame(source_priority, columns=["data_topic","first_source","fallback_source","forbidden_practice"]),
     CFG / "source_priority_v41.xlsx")

# G0 签字模板（双工作表）
sign_rows = [(r, "", item, "", "", "", "") for r in
             ["A 项目与平台负责人", "B 数据负责人", "C 模型与验证负责人", "D 企业证据与交付负责人"]
             for item in ["G0 口径冻结", "字段合同", "CORE/SUPPLEMENT 来源审批"]]
signoff = pd.DataFrame(sign_rows, columns=["role","name","scope_item","decision","signature","signed_at","comment"])
changelog = pd.DataFrame(columns=["change_id","proposed_by","reason","affected_tables","approved_by","effective_run_id","status"])
p = QA / "D0_scope_signoff_20260817.xlsx"
with pd.ExcelWriter(p, engine="openpyxl") as w:
    signoff.to_excel(w, sheet_name="signoff", index=False)
    changelog.to_excel(w, sheet_name="change_log", index=False)
log["outputs"].append({"path": str(p.relative_to(ROOT)), "rows": len(signoff), "sha256": hashlib.sha256(p.read_bytes()).hexdigest()})
print(f"[ok] {p.name}: {len(signoff)} signoff rows (pending)")

(QA / "D0_build_log.json").write_text(json.dumps(log, ensure_ascii=False, indent=2), encoding="utf-8")
print("[ok] D0_build_log.json")

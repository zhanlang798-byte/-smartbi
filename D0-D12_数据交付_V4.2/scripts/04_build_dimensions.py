# -*- coding: utf-8 -*-
"""
04_build_dimensions.py — 构建六张维度表与企业—地区桥表模板（D10 前置）。
dim_date 只承载真实月度骨架（1971-01..2025-12）；dim_year 承载年度事实（2010—2025）；
禁止把年度值复制成月度行。run_id=20260817_v42。
"""
import hashlib, json, datetime, pathlib
import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[1]
STG, CUR, CFG, QA = (ROOT/p for p in ["data/staging","data/curated","config","data/qa"])
RUN_ID = "20260817_v42"
LOG = {"run_id": RUN_ID, "step": "dimensions", "built_at": datetime.datetime.now().isoformat(timespec="seconds"), "outputs": []}

def dump(df, path, sheet="data"):
    path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(path, engine="openpyxl") as w:
        df.to_excel(w, sheet_name=sheet, index=False)
    LOG["outputs"].append({"path": str(path.relative_to(ROOT)), "rows": len(df),
                           "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
    print(f"[ok] {path.name}: {len(df)} rows")

# dim_country：与 country_master 同构 + 是否 40 国标志（D5 冻结前为空）
cm = pd.read_csv(STG/"country_master.csv", encoding="utf-8-sig")
dim_country = cm.assign(is_selected_40=None, is_low_risk_control=None)[
    ["iso3","country_name_zh","country_name_en","region","subregion","currency_name",
     "currency_code","country_role","is_selected_40","is_low_risk_control","run_id"]]
dump(dim_country, CUR/"dim_country.xlsx")

# dim_date：1971-01..2025-12 月末骨架 660 月；in_country_panel 标记 2010-01..2025-12
months = pd.date_range("1971-01-31", "2025-12-31", freq="ME")
dim_date = pd.DataFrame({
    "date_key": months.strftime("%Y%m%d"),
    "month_end": months.date,
    "year": months.year, "quarter": months.quarter, "month": months.month,
    "in_country_panel": ((months >= "2010-01-31") & (months <= "2025-12-31")).astype(int),
    "in_global_cycle": 1, "run_id": RUN_ID})
assert len(dim_date) == 660
dump(dim_date, CUR/"dim_date.xlsx")

# dim_year：年度事实（投资 2016—2024、政策 2010—2025、企业 2018—2025）
dim_year = pd.DataFrame({
    "year_key": range(2010, 2026),
    "in_investment_window": [1 if 2016 <= y <= 2024 else 0 for y in range(2010, 2026)],
    "in_policy_window": 1,
    "in_company_window": [1 if 2018 <= y <= 2025 else 0 for y in range(2010, 2026)],
    "run_id": RUN_ID})
dump(dim_year, CUR/"dim_year.xlsx")

# dim_company
comp = pd.read_excel(CFG/"company_master_v41.xlsx")
dim_company = comp.assign(quant_profile_eligible=None, deep_case_flag=None, run_id=RUN_ID)[
    ["company_id","company_name_zh","security_code","industry","operating_model",
     "quant_profile_eligible","deep_case_flag","run_id"]]
dump(dim_company, CUR/"dim_company.xlsx")

# dim_asset：8 类储备/套保资产 + 2 类情景工具（无市场收益行）
assets = [
    ("AST001","local_cash","经营国本币现金","现金","当地货币市场","LCU","真实"),
    ("AST002","cny_short","人民币短期资产","短债","中国货币市场","CNY","真实"),
    ("AST003","usd_cash","美元现金","现金","美国货币市场","USD","真实"),
    ("AST004","usd_tbill_3m","3个月美元短债代理","短债","美国财政部/FRED","USD","代理(is_proxy=1)"),
    ("AST005","gold_usd","美元黄金","黄金","国际金价市场","USD","真实"),
    ("AST006","gold_cny_sge","人民币/上海金","黄金","上海黄金交易所","CNY","真实"),
    ("AST007","gold_lcu","当地本币黄金","黄金","派生:美元金价×汇率","LCU","派生"),
    ("AST008","hedge_proxy","远期/NDF 套保代理","套保","离岸远期市场","USD","代理(is_proxy=1)"),
    ("AST009","natural_hedge","自然对冲(收支匹配)","情景工具","无市场收益序列","-","压力情景工具,禁止伪造收益行"),
    ("AST010","credit_line","授信(已承诺额度)","情景工具","无市场收益序列","-","压力情景工具,不等同现金"),
]
dim_asset = pd.DataFrame(assets, columns=["asset_id","asset_code","asset_name_zh","asset_class",
                                          "market","price_currency","data_note"])
dim_asset["run_id"] = RUN_ID
dump(dim_asset, CUR/"dim_asset.xlsx")

# dim_event：种子 = 17+1 历史锚点（全球/政策节点）+ 45 案例事件簇；国别事件待 D8 追加
am = pd.read_excel(CFG/"historical_event_master_v41.xlsx")
ev = []
for _, r in am.iterrows():
    ev.append(dict(event_id=r.event_cluster_id, event_name_zh=r.event_title_zh,
                   event_scope="global" if r.event_cluster_id not in ("EVT-ASIA-1997",) else "regional",
                   event_record_type=("policy_node" if r.is_crisis_event == 0 else "historical_crisis"),
                   iso3=None, start_year=r.start_year, end_year=r.end_year,
                   source="historical_event_master_v41", run_id=RUN_ID))
ci = pd.read_csv(ROOT.parent/"调研资料归档_V1.0"/"03_案例库与证据"/"case_index.csv", encoding="utf-8-sig")
for cl in sorted(ci.event_cluster_id.unique()):
    if cl not in {e["event_id"] for e in ev}:
        ev.append(dict(event_id=cl, event_name_zh=f"案例事件簇 {cl}(名称待 D 字段化)",
                       event_scope="country", event_record_type="country_event_candidate",
                       iso3=None, start_year=None, end_year=None,
                       source="case_index(45案例,待字段化)", run_id=RUN_ID))
dim_event = pd.DataFrame(ev)
dump(dim_event, CUR/"dim_event.xlsx")

# bridge_company_geography：空模板（地区行不得扩展为国家行）
bridge = pd.DataFrame(columns=["bridge_id","company_id","fiscal_year","geography_id",
    "geography_name","geography_level","iso3","disclosure_basis","source_id","run_id"])
dump(bridge, CUR/"bridge_company_geography.xlsx")

(QA/"DIM_build_log.json").write_text(json.dumps(LOG, ensure_ascii=False, indent=2), encoding="utf-8")
print("[ok] DIM_build_log.json")

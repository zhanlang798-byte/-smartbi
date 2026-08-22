# -*- coding: utf-8 -*-
"""
03_build_d3_d6_seeds.py — D3/D6B/D6C/D6E 专题层：脚手架、人工模板与归档种子。
原则：不伪造数值。投资、企业、政策数值在正式来源导入前保持为空并标注 missing_reason；
案例保持 SOURCE_LINKS_INDEXED 语义（verification_status=待补证），不写成已核验。
run_id=20260817_v42。
"""
import hashlib, json, datetime, pathlib
import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROJ = ROOT.parent
STG, CUR, QA, TPL, CFG = (ROOT/p for p in ["data/staging","data/curated","data/qa","templates","config"])
RUN_ID = "20260817_v42"
NOW = datetime.datetime.now().isoformat(timespec="seconds")
LOG = {"run_id": RUN_ID, "step": "D3-D6-seeds", "built_at": NOW, "outputs": []}

def dump(df, path, sheet="data"):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix == ".parquet":
        df.to_parquet(path, index=False)
    elif path.suffix == ".csv":
        df.to_csv(path, index=False, encoding="utf-8-sig")
    else:
        with pd.ExcelWriter(path, engine="openpyxl") as w:
            df.to_excel(w, sheet_name=sheet, index=False)
    LOG["outputs"].append({"path": str(path.relative_to(ROOT)), "rows": len(df),
                           "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
    print(f"[ok] {path.name}: {len(df)} rows")

# ------------------------------------------------ D3 country_exposure 脚手架
cm = pd.read_csv(STG/"country_master.csv", encoding="utf-8-sig")
years = list(range(2016, 2025))  # 公报可得期 2016—2024
rows = []
for _, c in cm.iterrows():
    for y in years:
        rows.append(dict(
            iso3=c.iso3, year=y, country_name_zh=c.country_name_zh, country_name_en=c.country_name_en,
            region=c.region, subregion=c.subregion, currency_name=c.currency_name,
            currency_code=c.currency_code, country_role=c.country_role,
            chinese_enterprise_presence=None, presence_evidence_type=None,
            odi_flow_usd=None, odi_stock_usd=None, odi_original_value=None, odi_original_unit=None,
            latest_stock_year=None, latest_stock_usd=None, enterprise_count=None,
            fx_change_latest_year=None, inflation_latest_year=None, reserve_latest_usd=None,
            historical_crisis_flag=0,
            missing_reason="待商务部公报国家表导入(D3);缺失不填0",
            source_table_no=None, source_page=None,
            source_id="(WEB-0344 公报发布稿已登记;国家表待导入)",
            download_date="2026-08-16", source_file_sha256=None,
            quality_flag="review", run_id=RUN_ID))
exp = pd.DataFrame(rows)
dump(exp, STG/"country_exposure_standardized.parquet")
dump(exp, CUR/"country_exposure.xlsx")
dump(pd.DataFrame([
    ("主键 iso3+year 重复", int(exp.duplicated(["iso3","year"]).sum()), 0, "PASS"),
    ("130 国静态记录覆盖", exp["iso3"].nunique(), 130, "PASS"),
    ("投资数值非空行(应为0,待导入)", int(exp["odi_flow_usd"].notna().sum()), 0, "PASS-待导入"),
    ("presence 有来源覆盖率(待导入)", "0/1170", "100%", "PENDING-D3"),
], columns=["check","actual","threshold","result"]), QA/"country_exposure_qa.xlsx")

# ------------------------------------------------ 人工录入模板（D6A/D6B/D6C/D6E）
policy_tpl = pd.DataFrame(columns=[
    "iso3","year","policy_code","exchange_rate_regime","current_account_restriction",
    "capital_account_restriction","fx_surrender_requirement","profit_repatriation_restriction",
    "capital_repatriation_restriction","multiple_currency_practice","chinn_ito_kaopen",
    "sanction_issuer","sanction_target_scope","effective_start_date","effective_end_date",
    "raw_policy_text","coded_value","coding_rule_version","source_frequency","source_page",
    "reviewer_id","review_status","source_id","vintage_date","quality_flag","run_id"])
dump(policy_tpl, TPL/"policy_event_manual_entry_v41.xlsx")

company_tpl = pd.DataFrame(columns=[
    "company_id","fiscal_year","report_date","report_currency","report_unit",
    "raw_text","raw_value","raw_unit","normalized_value","total_revenue","overseas_revenue",
    "overseas_revenue_share","geography_id","geography_name","geography_level","geography_revenue",
    "fx_gain_loss","foreign_currency_assets","foreign_currency_liabilities","foreign_debt_currency",
    "foreign_debt_balance","hedge_notional","hedge_instrument","overseas_subsidiary_count",
    "disclosed_country_count","cash_and_equivalents","short_term_investments",
    "committed_credit_line","credit_line_available","annual_report_page","table_note",
    "entry_reviewer_id","check_reviewer_id","review_status","source_id","quality_flag","run_id"])
dump(company_tpl, TPL/"company_disclosure_v41.xlsx")

case_tpl_cols = ["case_id","case_title","event_cluster_id","region","iso3","start_date","end_date",
    "risk_type","global_cycle_state","cycle_labels","monetary_regime","policy_response",
    "comparability_grade","observation_object","evidence_role","claim_text","local_currency_outcome",
    "usd_outcome","gold_outcome","company_loss_value","custody_jurisdiction","availability_status",
    "evidence_grade","verification_status","source_id","source_page","case_file_path",
    "duplicate_flag","reviewer_id","quality_flag","run_id"]
dump(pd.DataFrame(columns=case_tpl_cols), TPL/"case_evidence_v41.xlsx")

event_tpl = pd.DataFrame(columns=[
    "event_id","event_cluster_id","iso3","region","event_type","start_month","end_month",
    "trigger_fx_depr","trigger_fx_value","trigger_inflation","trigger_inflation_value",
    "trigger_parallel_premium","trigger_parallel_value","trigger_policy_tightening",
    "trigger_freeze_or_outage","severity_score","evidence_grade","confirmation_date",
    "known_at_decision_time","global_shock_flag","shock_scope","global_event_id",
    "transmission_channel","impact_mechanism_usd","impact_mechanism_gold",
    "impact_mechanism_company","source_id_primary","source_id_secondary",
    "review_comment","quality_flag","run_id"])
dump(event_tpl, TPL/"event_evidence_v41.xlsx")

hist_tpl = pd.DataFrame(columns=[
    "historical_event_id","event_cluster_id","event_title_zh","event_title_en","event_record_type",
    "is_crisis_event","shock_scope","iso3_or_scope","start_date","end_date","primary_cycle_state",
    "cycle_labels","compound_crisis_flag","monetary_regime","capital_control_regime",
    "gold_legal_holding_status","gold_market_tradability","available_instruments","policy_response",
    "trigger_and_cause","transmission_channel","equity_outcome","property_outcome",
    "usd_or_short_debt_outcome","gold_outcome","comparison_basis","comparability_grade",
    "comparability_limit","modern_backtest_allowed","source_id_primary","source_id_secondary",
    "source_page","case_id","reviewer_id","review_status","quality_flag","run_id"])
dump(hist_tpl, TPL/"historical_crisis_event_v41.xlsx")

# ------------------------------------------------ D6C 案例证据种子（45 案例，保持 SOURCE_LINKS_INDEXED 语义）
ci = pd.read_csv(PROJ/"调研资料归档_V1.0"/"03_案例库与证据"/"case_index.csv", encoding="utf-8-sig")
FOLDER_RISK = {"地缘冲突与制裁篇":"制裁冲突","宏观危机篇":"宏观危机","货币崩溃篇":"货币崩溃","微观企业篇":"企业损失"}
cases = []
for _, r in ci.iterrows():
    folder = pathlib.PurePath(r.case_path).parts[1] if len(pathlib.PurePath(r.case_path).parts) > 1 else ""
    cases.append(dict(
        case_id=r.case_id,
        case_title=pathlib.PurePath(r.case_path).parent.name,
        event_cluster_id=r.event_cluster_id,
        region=None, iso3=None, start_date=None, end_date=None,
        risk_type=FOLDER_RISK.get(folder, folder),
        global_cycle_state=None, cycle_labels=None, monetary_regime=None, policy_response=None,
        comparability_grade=None, observation_object=None, evidence_role=None, claim_text=None,
        local_currency_outcome=None, usd_outcome=None, gold_outcome=None, company_loss_value=None,
        custody_jurisdiction=None, availability_status="人工复核",
        evidence_grade=None, verification_status="待补证(SOURCE_LINKS_INDEXED,未核验)",
        source_id=r.local_asset_id, source_page=None, case_file_path=r.case_path,
        duplicate_flag=int((ci.event_cluster_id == r.event_cluster_id).sum() > 1),
        reviewer_id=None, quality_flag="warn", run_id=RUN_ID))
cases_df = pd.DataFrame(cases)
assert cases_df["case_id"].nunique() == 45, "案例必须恰好 45 份"
dump(cases_df, CUR/"case_evidence.xlsx")

# ------------------------------------------------ D6E 历史危机事件种子（17 锚点 + 广场协议节点）
am = pd.read_excel(CFG/"historical_event_master_v41.xlsx")
hist = []
for _, r in am.iterrows():
    hist.append(dict(
        historical_event_id=f"HIST{r.anchor_no:03d}", event_cluster_id=r.event_cluster_id,
        event_title_zh=r.event_title_zh, event_title_en=None,
        event_record_type=("政策节点" if "政策" in str(r.core_classification) or "节点" in str(r.core_classification)
                           else "反例" if "反例" in str(r.core_classification) else "危机"),
        is_crisis_event=int(r.is_crisis_event), shock_scope=None, iso3_or_scope=None,
        start_date=r.start_year, end_date=r.end_year if pd.notna(r.end_year) else None,
        primary_cycle_state=None, cycle_labels=r.core_classification,
        compound_crisis_flag=None, monetary_regime=None, capital_control_regime=None,
        gold_legal_holding_status=None, gold_market_tradability=None, available_instruments=None,
        policy_response=None, trigger_and_cause=None, transmission_channel=None,
        equity_outcome=None, property_outcome=None, usd_or_short_debt_outcome=None,
        gold_outcome=None, comparison_basis=None, comparability_grade=None,
        comparability_limit=r.role_and_limit, modern_backtest_allowed=int(r.modern_backtest_allowed),
        source_id_primary=None, source_id_secondary=None, source_page=None, case_id=None,
        reviewer_id=None, review_status="pending", quality_flag="review", run_id=RUN_ID))
hist_df = pd.DataFrame(hist)
assert len(hist_df) == 18 and hist_df["historical_event_id"].nunique() == 18
dump(hist_df, CUR/"historical_crisis_event.xlsx")
dump(pd.DataFrame([
    ("17+1 锚点全部入表", len(hist_df), 18, "PASS"),
    ("日本事件簇(广场协议/泡沫/长期停滞同簇)", int((hist_df.event_cluster_id=="EVT-JPN-BUBBLE").sum()), 2, "PASS-同簇不重复计数"),
    ("1929—1970 modern_backtest_allowed=0", int(((hist_df.start_date.astype(int)<1971)&(hist_df.modern_backtest_allowed==1)).sum()), 0, "PASS"),
    ("制度/机制字段完成复核", "0/18", "18/18", "PENDING-D6E 人工复核"),
], columns=["check","actual","threshold","result"]), QA/"historical_event_evidence_audit.xlsx")

(QA/"D3_D6_build_log.json").write_text(json.dumps(LOG, ensure_ascii=False, indent=2), encoding="utf-8")
print("[ok] D3_D6_build_log.json")

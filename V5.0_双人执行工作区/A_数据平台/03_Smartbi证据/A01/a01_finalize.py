# -*- coding: utf-8 -*-
# A01 收尾：字段字典 + 执行日志 + DQ41问题单
import os, sys, json
sys.path.insert(0, r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A01")
from a01_xlsx_writer import write_xlsx

EVID = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A01"
ISSUE_DIR = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\00_共享\问题单"
os.makedirs(ISSUE_DIR, exist_ok=True)
meta = json.load(open(os.path.join(EVID, 'a01_gen_meta.json'), encoding='utf-8'))
NOW = meta['generated_at']; VRUN = meta['view_run_id']

# ---------- 1) 字段字典 ----------
FD = [['表','字段','类型','含义','来源','缺失规则']]
def add(table, fields):
    for f in fields: FD.append([table] + f)
add('MVP_country_latest', [
 ['iso3','文本','国家ISO3代码，主键','dim_country','不允许空'],
 ['country_name_zh','文本','国家中文名','dim_country','不允许空'],
 ['region','文本','区域','dim_country','不允许空'],
 ['latest_fx_value','数值','最新非空月均汇率(本币/美元)','country_monthly_risk.fx_avg_lcu_per_usd','无则空+missing_reason'],
 ['latest_fx_date','日期','该汇率所属月份','同上','同上'],
 ['latest_cpi_value','数值','最新非空CPI指数','country_monthly_risk.cpi_index','同上'],
 ['latest_cpi_date','日期','该CPI所属月份','同上','同上'],
 ['latest_reserve_usd','数值','最新非空外汇储备(百万美元)','country_monthly_risk.fx_reserves_usd','同上'],
 ['latest_reserve_date','日期','储备所属月份','同上','同上'],
 ['latest_reserve_import_months','数值','最新非空储备覆盖进口月数','country_monthly_risk.reserve_import_months','同上'],
 ['latest_reserve_import_months_date','日期','该指标所属月份','同上','同上'],
 ['fx_12m_depr','数值','12个月贬值率=当月fx/12月前fx-1','计算','端点缺失则空，不填0'],
 ['cpi_yoy','数值','CPI同比=当月CPI/12月前CPI-1','计算','同上'],
 ['fx_threshold_multiple','数值','fx_12m_depr÷0.20','计算(阈值来自V5.0合同)','fx_12m_depr空则空'],
 ['cpi_threshold_multiple','数值','cpi_yoy÷0.15','计算(阈值来自V5.0合同)','cpi_yoy空则空'],
 ['max_threshold_multiple','数值','两个倍数中较大者','计算','均空则空'],
 ['trigger_label','文本','双触发/单触发/未触发/数据不足','计算','无法判断=数据不足'],
 ['crisis_event_count','整数','唯一event_id计数','country_event','无事件=0(真实计数)'],
 ['latest_odi_stock_usd','数值','最新非空中国ODI存量(美元)','country_exposure.odi_stock_usd','无则空'],
 ['latest_odi_stock_year','整数','该存量年份','country_exposure.year','同上'],
 ['source_id','文本','所用行的来源编号(分号连接)','各源表','不为空'],
 ['quality_flag','文本','original/proxy/imputed组合','源表is_proxy/is_imputed','默认original'],
 ['missing_reason','文本','缺失项说明','计算','无缺失则空'],
 ['source_run_id','文本','上游运行版','源表run_id','不允许空'],
 ['view_run_id','文本','本视图运行版 '+VRUN,'本任务','不允许空'],
 ['view_version','文本','固定V5.0','本任务','不允许空'],
 ['generated_at','文本','生成时间','本任务','不允许空'],
])
add('MVP_company_data_status', [
 ['company_id','文本','企业编号，主键','dim_company','不允许空'],
 ['company_name_zh','文本','企业中文名','dim_company','不允许空'],
 ['industry','文本','行业','dim_company','不允许空'],
 ['fiscal_year_min','整数','披露最早财年','company_overseas_exposure','无披露则空'],
 ['fiscal_year_max','整数','披露最晚财年','同上','同上'],
 ['disclosure_rows','整数','披露行数','同上','真实计数'],
 ['disclosed_field_nonnull_count','整数','21个固定披露字段的非空值总数','同上','真实计数'],
 ['region_rows','整数','地区级行数','同上','真实计数'],
 ['country_rows','整数','国家级行数(必须0)','同上','真实计数'],
 ['unique_source_count','整数','唯一来源数','同上','真实计数'],
 ['answer_scope','文本','可回答范围','按合同枚举+数据条件','不允许空'],
 ['prohibited_inference','文本','禁止推断项','按合同固定文本','不允许空'],
 ['missing_reason','文本','缺失说明','计算','不为空(收入三字段无值是事实)'],
 ['source_run_id','文本','上游运行版','源表run_id','不允许空'],
 ['view_run_id','文本',VRUN,'本任务','不允许空'],
 ['view_version','文本','V5.0','本任务','不允许空'],
 ['generated_at','文本','生成时间','本任务','不允许空'],
])
add('MVP_cycle_state', [
 ['scope_id','文本','范围代码，主键之一','global_cycle_month','不允许空'],
 ['month_end','日期','月末，主键之一','同上(序列值转ISO日期)','不允许空'],
 ['cpi_yoy','数值','CPI同比(冻结表预计算)','global_cycle_month','空则传导为空'],
 ['industrial_production_yoy','数值','工业产出同比(冻结表预计算)','同上','同上'],
 ['sahm_realtime_value','数值','实时Sahm规则值','同上','同上'],
 ['nfci_expanding_percentile','数值','NFCI扩展窗口分位(冻结列)','同上','同上'],
 ['equity_drawdown','数值','股指相对当时峰值回撤(冻结列)','同上','2016-08前无数据'],
 ['property_peak_to_trough','数值','实际房价相对当时峰值回撤','按≤t重算自property_real_index','property缺失则空'],
 ['policy_rate_12m_change_bps','数值','政策利率12月变化(基点)','计算(仅t与t-12端点)','端点缺失则空'],
 ['real_policy_rate_12m_change_bps','数值','实际政策利率12月变化(基点)','计算','同上'],
 ['hy_oas_12m_change_bps','数值','高收益利差12月变化(基点,挑战指标)','global_cycle_month','多数月空'],
 ['trig_credit_systemic','三态','信用系统性危机 1/0/空','按YAML规则','空+missing_reason'],
 ['trig_asset_bust','三态','资产泡沫破裂 1/0/空','同上','同上'],
 ['trig_recession','三态','衰退 1/0/空','同上','同上'],
 ['trig_deflation','三态','通缩 1/0/空','同上','同上'],
 ['trig_stagflation','三态','滞胀 1/0/空','同上','同上'],
 ['trig_aggressive_tightening','三态','激进紧缩 1/0/空','同上','同上'],
 ['trig_inflation_overheating','三态','通胀过热 1/0/空','同上','同上'],
 ['trig_recovery_reflation','三态','复苏再通胀 1/0/空','同上','同上'],
 ['trig_normal_expansion','三态','正常扩张(YAML剩余状态) 1/0/空','同上','同上'],
 ['labels','文本','当月全部触发标签(分号连接)','计算','无则空'],
 ['primary_state','文本','主状态(按YAML优先级)','计算','证据不足则空+missing_reason'],
 ['compound_global_crisis','三态','≥2类crisis_class=1','计算','同上'],
 ['missing_reason','文本','证据不足说明','计算','无则空'],
 ['source_run_id','文本','上游运行版','源表run_id','不允许空'],
 ['ruleset_version','文本','规则版 global_cycle_rules_v41','YAML','不允许空'],
 ['view_run_id','文本',VRUN,'本任务','不允许空'],
 ['view_version','文本','V5.0','本任务','不允许空'],
 ['generated_at','文本','生成时间','本任务','不允许空'],
])
write_xlsx(os.path.join(EVID, 'MVP_FIELD_DICTIONARY_V50.xlsx'), '字段字典', FD[0], FD[1:])
print('字段字典行数:', len(FD)-1)

# ---------- 2) 执行日志 ----------
log = f"""A01 辅助层生成 执行日志 V5.0
==================================================
执行时间：{NOW}
执行方式：AI编写并运行生成/QA脚本；读取只读镜像；未修改任何原表
view_run_id：{VRUN}　view_version：V5.0

步骤1 国别最新视图 → PASS
  dim_country is_selected_40=1 → 40国（实测）。country_monthly_risk：40国×192月，
  最新月全部为2025-12-31。每指标独立取最新非空值及日期。
  储备缺失国5个（AGO/BEN/CIV/ETH/IRN）→ 字段留空并写missing_reason，未填0。
步骤2 贬值与同比 → PASS
  fx_12m_depr=当月fx/12月前fx-1；cpi_yoy同理；端点缺失则空（本次40国端点齐全）。
步骤3 阈值倍数与触发标签 → PASS
  阈值20%/15%来自V5.0合同，未自创。触发分布：双触发2（TUR 22.0%/30.9%；ZWE 2493.5%/77.2%）、
  单触发4（BOL/ETH/NGA/SDN）、未触发34、数据不足0。
步骤4 企业数据状态 → PASS
  dim_company 20家全部保留；地区行合计8、国家行合计0。
步骤5 企业表确认 → PASS（实测读数）
  company_overseas_exposure：global 160 + region 8 = 168；
  total_revenue/overseas_revenue/overseas_revenue_share 可用值均为0；
  bridge_company_geography 8行全部region、iso3全空 → 国家桥接0。
步骤6 周期状态660行 → PASS（结构），附DQ41发现（见问题单ISS-20260823-001）
  按month_end升序逐月计算；触发器全部1/0/空三态（非法值0个）；
  空触发行100%带missing_reason；主状态优先级按YAML；
  主状态分布：inflation_overheating 181、asset_bust 142、recession 71、
  aggressive_tightening 66、credit_systemic 37、recovery_reflation 2、stagflation 1、空160。
步骤7 字典/日志/手算/审计 → PASS
  5国手算（iso3升序每8取1）：最大误差0.00e+00 ≤1e-10，明细见A01_HANDCALC_5COUNTRIES_V50.txt。
  无未来信息审计：equity_drawdown提供值与≤t截断重算113个月最大差{meta['audit_equity_max_diff']:.2e}；
  房产回撤仅用≤t最大值；12月变化仅用t-12端点；连续3月窗口缺失即不可判。

QA汇总：33项检查，PASS 27，FAIL 6（全部为DQ41历史单测，明细A01_QA_RESULT_V50.xlsx
与A01_DQ41_DETAIL_V50.txt）。DQ41不属A01验收六项标准，但按真实性原则原样上报并已开问题单。

最终判定：PASS（A01验收六项全部满足且有证据）
遗留：ISS-20260823-001（DQ41未全命中，对象属V4.2冻结数据/规则，需对象所有者裁决，建议G2前处理）。
"""
open(os.path.join(EVID, 'A01_EXECUTION_LOG_V50.txt'), 'w', encoding='utf-8').write(log)
print('执行日志已写')

# ---------- 3) DQ41问题单 ----------
issue = """# ISS-20260823-001 DQ41历史单测未全命中

- 提交时间：2026-08-23
- 提交人：A01执行过程中的AI总控记录（代执行者A登记）
- 对象：global_cycle_month.xlsx（V4.2冻结表）+ global_cycle_rules_v41.yaml（D0冻结规则）
- 对象所有者：V4.2数据交付上游（非A01可改对象）
- 截止：建议 2026-08-24 18:00（G2模型冻结）前裁决

## 现象（实测读数，可复算）
按YAML规则逐月执行后，YAML自带 expected_period_unit_tests 六段全部未完整命中：
1. 1973-1980 滞胀：命中21/96个月（其余月份滞胀标签在但主状态为recession，优先级所致）
2. 1990 资产泡沫破裂：命中0/12
3. 2000-2002 资产泡沫破裂：命中0/36
4. 2008-2009 信用系统性+复合：命中5/24（2008-10/12命中；2008-09 nfci分位0.894<0.90未达）
5. 2020-03/04 信用系统性：命中0/2（nfci分位0.751/0.723<0.90；asset_bust/recession分别触发）
6. 2022 激进紧缩：命中3/12

## 已排除的执行侧原因
- 三态逻辑、优先级、连续窗口均按YAML实现；5国手算误差0；无未来信息审计通过。
- 未修改阈值、未填0、未插值。

## 数据侧读数（疑因，供裁决）
- equity_index/equity_drawdown 仅2016-08起有值（113/660月）→1990/2000-02无法用股票条件触发asset_bust。
- grade_A_banking_event、official_recession_flag 无数据列 → 对应条件全程不可判。
- property_real_index全程有值，但峰谷跌幅未在1990/2000-02达-15%。
- historical_crisis_event.xlsx日期字段全为1970-01-01（合同已注“日期异常待审”），无法导出事件月序列。

## 期望结果
对象所有者裁决其一：
a) 确认DQ41以“标签命中”而非“主状态命中”为口径并重测；
b) 补充A级银行事件/官方衰退的可追溯数据源；
c) 修订DQ41预期使之与冻结数据一致（须留版本记录）。
任何方案都不得为通过测试而回填或篡改阈值。

## 影响面
- 不阻塞A02（P0验证上传机制）。G2冻结前建议给出裁决，否则页面4周期状态需标注该限制。
- 证据：A01_QA_RESULT_V50.xlsx 第28-33行；A01_DQ41_DETAIL_V50.txt；A01_EXECUTION_LOG_V50.txt 步骤6。
"""
p = os.path.join(ISSUE_DIR, 'ISS-20260823-001_DQ41周期单测未全命中.md')
open(p, 'w', encoding='utf-8').write(issue)
print('问题单已写:', p)

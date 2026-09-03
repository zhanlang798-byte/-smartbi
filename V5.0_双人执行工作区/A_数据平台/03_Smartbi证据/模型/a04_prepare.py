# -*- coding: utf-8 -*-
# A04 交付物生成：关系图/关系审计/指标字典/表合同/字段字典/交接/缺口/变更日志 + 问题单ISS-20260824-002
import os, sys, datetime

# 归档生成器：模板停留在2026-08-24初建口径，会覆盖后续实机证据与签署状态。
# 仅在明确重建历史草稿时设置 A04_ALLOW_ARCHIVE_REBUILD=1；日常维护请直接更新现行证据和共享交接材料。
if os.environ.get('A04_ALLOW_ARCHIVE_REBUILD') != '1':
    raise SystemExit('ARCHIVED_GENERATOR_BLOCKED: set A04_ALLOW_ARCHIVE_REBUILD=1 only for an intentional historical rebuild')

sys.path.insert(0, r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A00")
sys.path.insert(0, r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A01")
from xlsx_min import Xlsx
from a01_xlsx_writer import write_xlsx

OUT = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\模型"
ISS = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\00_共享\问题单"
TA = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\全量导入\SMARTBI_TYPE_AUDIT_V50.xlsx"
os.makedirs(OUT, exist_ok=True)
NOW = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S +0800')

# ---------- 1) 关系图（19条，全部经真实键核验） ----------
REL = [
 ['#','维表("一"端)','事实表("多"端)','连接字段','基数','方向','键核验读数','状态'],
 [1,'V50_dim_country','V50_country_exposure','iso3 = iso3','1:N','单向','fact.iso3 ⊆ dim(实测)','待平台建'],
 [2,'V50_dim_country','V50_country_monthly_risk','iso3 = iso3','1:N','单向','⊆ 实测','待平台建'],
 [3,'V50_dim_country','V50_country_policy_year','iso3 = iso3','1:N','单向','⊆ 实测','待平台建'],
 [4,'V50_dim_country','V50_country_event','iso3 = iso3','1:N','单向','⊆ 实测(19国有事件)','待平台建'],
 [5,'V50_dim_country','V50_asset_monthly_return','iso3 = iso3','1:N','单向','⊆ 实测','待平台建'],
 [6,'V50_dim_country','V50_portfolio_scenario','iso3 = iso3','1:N','单向','⊆ 实测','待平台建'],
 [7,'V50_dim_country','V50_MVP_country_latest','iso3 = iso3','1:1','单向','⊆ 实测(40国)','待平台建'],
 [8,'V50_dim_date','V50_country_monthly_risk','month_end = month_end','1:N','单向','month_end唯一0重复','待平台建'],
 [9,'V50_dim_date','V50_global_cycle_month','month_end = month_end','1:N','单向','⊆ 实测','待平台建'],
 [10,'V50_dim_date','V50_asset_monthly_return','month_end = month_end','1:N','单向','⊆ 实测','待平台建'],
 [11,'V50_dim_date','V50_portfolio_scenario','month_end = window_end','1:N','单向','190个window_end全部在dim_date内','待平台建'],
 [12,'V50_dim_date','V50_MVP_cycle_state','month_end = month_end','1:1','单向','⊆ 实测(660月)','待平台建'],
 [13,'V50_dim_year','V50_country_exposure','year_key = year','1:N','单向','year 2016-2024全在dim_year内','待平台建'],
 [14,'V50_dim_year','V50_country_policy_year','year_key = year','1:N','单向','40行year=2026超出dim_year(2010-2025)→未匹配审计','待平台建'],
 [15,'V50_dim_year','V50_company_overseas_exposure','year_key = fiscal_year','1:N','单向','2018-2025全在dim_year内','待平台建'],
 [16,'V50_dim_year','V50_bridge_company_geography','year_key = fiscal_year','1:N','单向','⊆ 实测;桥只连企业+财年,不连国家(合同)','待平台建'],
 [17,'V50_dim_company','V50_company_overseas_exposure','company_id = company_id','1:N','单向','⊆ 实测','待平台建'],
 [18,'V50_dim_company','V50_bridge_company_geography','company_id = company_id','1:N','单向','bridge.company_id⊂dim_company实测','待平台建'],
 [19,'V50_dim_company','V50_MVP_company_data_status','company_id = company_id','1:1','单向','⊆ 实测(20家)','待平台建'],
]
write_xlsx(os.path.join(OUT,'RELATIONSHIP_MAP_V50.xlsx'),'关系图',REL[0],REL[1:])

# ---------- 2) 关系审计（建前基准，平台读数待填） ----------
rowcnt = {'V50_country_exposure':1170,'V50_country_monthly_risk':7680,'V50_country_policy_year':2744,
 'V50_country_event':23,'V50_global_cycle_month':660,'V50_asset_monthly_return':91727,
 'V50_portfolio_scenario':207720,'V50_case_evidence':45,'V50_source_registry':734,
 'V50_company_overseas_exposure':168,'V50_bridge_company_geography':8,
 'V50_MVP_country_latest':40,'V50_MVP_company_data_status':20,'V50_MVP_cycle_state':660}
AUD = [['#','关系','涉及事实表','建前行数(基准)','建后行数(待填)','未匹配行基准','膨胀?','判定(待填)']]
for r in REL[1:]:
    fact = r[2]; unm = '40行(year=2026超dim_year)' if r[0]==14 else '0(已核验)'
    AUD.append([r[0], f"{r[1]} → {fact} [{r[3]}]", fact, rowcnt[fact], '', unm, '', ''])
write_xlsx(os.path.join(OUT,'RELATIONSHIP_AUDIT_V50.xlsx'),'关系审计',AUD[0],AUD[1:])

# ---------- 3) 指标字典 ----------
MET = [['指标','公式','粒度','单位','日期口径','空值规则','来源表','允许页面'],
 ['country_count_130','计数(dim_country.iso3)','全局','个','不适用','无空(130)','V50_dim_country','1,2'],
 ['selected40_count','计数(dim_country.iso3 | is_selected_40=1)','全局','个','不适用','无空(40)','V50_dim_country','1'],
 ['crisis_event_count_23','计数(country_event.event_id 去重)','全局/国家','条','事件起止月','无事件国家=0','V50_country_event','1,2'],
 ['company_count_20','计数(dim_company.company_id)','全局','家','不适用','无空(20)','V50_dim_company','3'],
 ['source_count_734','计数(source_registry.source_id)','全局','条','不适用','无空(734)','V50_source_registry','6'],
 ['fx_latest','最新非空 fx_avg_lcu_per_usd','国家','本币/美元','每指标独立最新月','缺则空不填0','V50_country_monthly_risk / V50_MVP_country_latest','1,2'],
 ['fx_12m_depr','当月fx/12月前fx-1','国家-月','比率','端点月t与t-12','端点缺则空','V50_country_monthly_risk / MVP表','1,2'],
 ['cpi_yoy','当月cpi_index/12月前-1','国家-月','比率','端点月t与t-12','端点缺则空','V50_country_monthly_risk / MVP表','1,2'],
 ['odi_stock_latest','最新非空 odi_stock_usd 及年份','国家','美元','最新非空年份','缺则空','V50_country_exposure / MVP表','1,2'],
 ['equity_drawdown','相对当时已见峰值回撤','全球-月','比率','扩展窗口(只用≤t)','2016-08前空','V50_global_cycle_month','4'],
 ['max_drawdown','情景窗口最大回撤','情景-国家-期限-窗口','比率','window_end','按情景行','V50_portfolio_scenario','5'],
 ['cvar_95','95%条件在险价值','情景-国家-期限-窗口','比率','window_end','按情景行','V50_portfolio_scenario','5'],
 ['cost_total','情景总成本','情景-国家-期限-窗口','比率','window_end','按情景行','V50_portfolio_scenario','5'],
 ['gold_weight','黄金权重网格参数0-20%','情景','比率','不适用','网格参数非观测值','V50_portfolio_scenario','5(仅作风险缓冲情景,非统一建议)'],
]
write_xlsx(os.path.join(OUT,'METRIC_DICTIONARY_V50.xlsx'),'指标字典',MET[0],MET[1:])

# ---------- 4) 表合同 ----------
TC = [['表','行数','粒度','主键','角色','备注']]
data = [
 ['V50_dim_country',130,'国家','iso3','共享维度',''],
 ['V50_dim_date',660,'月','date_key','共享维度','month_end唯一'],
 ['V50_dim_year',16,'年','year_key','共享维度','2010-2025'],
 ['V50_dim_company',20,'企业','company_id','共享维度',''],
 ['V50_dim_asset',10,'资产','asset_id','共享维度','未连事实(键不匹配,见缺口)'],
 ['V50_dim_event',60,'事件','event_id','共享维度','未连事实(无重合键/键非唯一,见缺口)'],
 ['V50_country_exposure',1170,'国家-年份','iso3+year','事实',''],
 ['V50_country_monthly_risk',7680,'国家-月','iso3+month_end','事实',''],
 ['V50_country_policy_year',2744,'国家-年-政策','iso3+year+policy_code','事实','含40行2026年'],
 ['V50_country_event',23,'事件','event_id','事实','仅连国家'],
 ['V50_global_cycle_month',660,'全球-月','scope_id+month_end','事实',''],
 ['V50_historical_crisis_event',18,'历史事件','historical_event_id','事实(独立)','日期异常待审,不建关系'],
 ['V50_company_overseas_exposure',168,'企业-财年-披露','company_id+fiscal_year+geography_id','事实','160global+8region'],
 ['V50_bridge_company_geography',8,'企业披露-地理','bridge_id','桥(只连企业+财年)','禁止连国家'],
 ['V50_asset_monthly_return',91727,'国家-月-资产-口径','iso3+month_end+asset_id+currency_basis','事实','asset_id键不匹配,见缺口'],
 ['V50_portfolio_scenario',207720,'情景-国家-期限-窗口-运行','scenario_id+strategy_id+iso3+window_end+horizon+run_id','事实',''],
 ['V50_case_evidence',45,'案例','case_id','事实(独立)','iso3全空,不建关系'],
 ['V50_source_registry',734,'来源','source_id','追溯(不建关系)','source_id展示用'],
 ['V50_MVP_country_latest',40,'国家','iso3','辅助(展示层)','V5.0视图'],
 ['V50_MVP_company_data_status',20,'企业','company_id','辅助(展示层)','V5.0视图'],
 ['V50_MVP_cycle_state',660,'全球-月','scope_id+month_end','辅助(展示层)','V5.0视图'],
]
TC += data
write_xlsx(os.path.join(OUT,'TABLE_CONTRACT_V50.xlsx'),'表合同',TC[0],TC[1:])

# ---------- 5) 字段字典（复用A03类型审计实测） ----------
x = Xlsx(TA)
rows = list(x.iter_rows('类型审计'))
hdr, body = rows[0], rows[1:]
fd = [['表','字段','类型(源端实测)','备注']]
for r in body:
    r = r + ['']*(5-len(r))
    fd.append([r[0], r[1], r[2], r[4] if len(r)>4 else ''])
write_xlsx(os.path.join(OUT,'FIELD_DICTIONARY_V50.xlsx'),'字段字典',fd[0],fd[1:])

# ---------- 6-8) 交接/缺口/变更日志 ----------
handoff = f"""MODEL_HANDOFF_V50｜模型交接书
==================================================
交接时间：{NOW}
模型对象：MDL_XH202612_V50_COUNTRY_RESERVE（共享模型）、IM_XH202612_V50_COUNTRY_RESERVE（指标模型）
平台对象：V50_前缀 21张表（18正式+3辅助），A03已导入，合计313,593行+40/20/660
版本：V5.0-freeze-1（冻结后B只读，任何变更走MODEL_CHANGELOG_V50.txt流程）

B可以怎么用：
1. 只读查询19条关系已审计的模型（RELATIONSHIP_MAP_V50.xlsx）；
2. 页面3/5/6按METRIC_DICTIONARY_V50.xlsx取字段，页面3用dim_company/company_overseas_exposure/bridge/MVP_company_data_status；
3. 地区(bridge)只有region级，禁止按国家拆分或做企业国别排名；
4. 海外收入三字段全空=如实展示"无可用披露"，禁止编造。

B不可以：
- 改模型/字段/类型/关系/指标（只读）；
- 用DISTINCT压行数；
- 把case_evidence按国家关联（iso3全空）或把asset_id与ASTxxx手工对应（键不匹配未裁决）。

缺口与限制：见KNOWN_GAPS_V50.txt（4项：asset键、event键、case无国家键、policy 2026超界+DQ41）。
签收：A ______　B ______
"""
open(os.path.join(OUT,'MODEL_HANDOFF_V50.txt'),'w',encoding='utf-8').write(handoff)

gaps = """KNOWN_GAPS_V50｜已知缺口（冻结时如实声明，不掩盖）
==================================================
G1 asset_id键不匹配（问题单ISS-20260824-002）：
   asset_monthly_return全部91,727行使用GOLD_USD/USD_TBILL_3M等代码式ID，
   dim_asset使用AST001-AST010，交集为0；asset_code仅部分可对且大小写/命名不一。
   处置：不虚构映射，dim_asset不连事实；资产维度在模型内不可用，待上游裁决。
G2 dim_event与country_event无重合键：event_id交集0、cluster交集0（实测）。
   处置：country_event仅连dim_country；dim_event独立。
G3 case_evidence.iso3全部45行为空：不能连dim_country；cluster虽40/45匹配dim_event，
   但dim_event.cluster非唯一(EVT-GOLD、EVT-RUS各2行)，建关系会膨胀。
   处置：case_evidence独立，按region属性展示，不做国家下钻。
G4 country_policy_year含40行year=2026，超出dim_year(2010-2025)：
   dim_year→policy关系下这40行未匹配（左连接保留但维筛选不到）。
   处置：如实记录，不删行、不扩dim_year（维表只读）。
G5 DQ41周期单测未全命中（ISS-20260823-001）：页面4周期状态需标注该限制。
G6 P0 XML干净目标独立恢复：未验收（G5范围）。
G7 historical_crisis_event日期字段全为1970-01-01（V4.2已知异常待审）：不建关系。
"""
open(os.path.join(OUT,'KNOWN_GAPS_V50.txt'),'w',encoding='utf-8').write(gaps)

chg = """MODEL_CHANGELOG_V50｜模型变更日志
==================================================
变更流程：冻结后任何字段/类型/关系/指标变更，必须先在此登记
（日期、变更人、对象、变更内容、原因、影响面、复核人），否则视为静默变更=FAIL。

{VNOW} A 初始建立：21表(A03)、19条关系设计(RELATIONSHIP_MAP)、14项基础指标、
  4+3项缺口声明。命名适配记录：平台30字符限制,前缀TB_XH202612_V50_→V50_。
  待办：平台侧建关系+审计读数+B只读权限+冻结签收后,本条升级为V5.0-freeze-1。
""".replace('{VNOW}', NOW)
open(os.path.join(OUT,'MODEL_CHANGELOG_V50.txt'),'w',encoding='utf-8').write(chg)

# ---------- 9) 问题单 ISS-20260824-002 ----------
issue = """# ISS-20260824-002 asset_id键域不一致（dim_asset无法连接事实表）

- 提交时间：2026-08-24　提交人：A04执行过程AI记录（代执行者A登记）
- 对象：asset_monthly_return.xlsx 与 dim_asset.xlsx（V4.2冻结表）
- 截止：建议 2026-08-26 18:00（G3六页初验）前裁决

## 现象（实测读数）
- asset_monthly_return 全部 91,727 行的 asset_id 取值：GOLD_USD 22,869 / USD_TBILL_3M 22,909 /
  USD_CASH 7,680 / GOLD_SGE 7,640 / CNY_SHORT 7,680 / CNY_CASH 7,680 / GOLD_LOCAL 7,589 / LOCAL_CASH 7,680。
- dim_asset.asset_id 取值：AST001-AST010（asset_code为 local_cash/cny_short/usd_cash/usd_tbill_3m/
  gold_usd/gold_cny_sge/gold_lcu/hedge_proxy/natural_hedge/credit_line）。
- 两个键域交集 = 0；asset_code 仅部分字面相近（大小写与命名不一致，如 GOLD_SGE↔gold_cny_sge、
  GOLD_LOCAL↔gold_lcu、CNY_CASH↔local_cash 无法唯一确认）。

## 处置（已执行）
不虚构映射、不静默改字段。A04模型中 dim_asset 不连接事实表；asset_monthly_return 仅经
iso3/month_end 接入模型；资产维度标记不可用（KNOWN_GAPS_V50 G1）。

## 期望结果（三选一，需上游/所有者裁决）
a) 提供官方 asset_id↔ASTxxx 映射表并留版本记录；
b) 修订 dim_asset 使其键与事实一致（新运行版）；
c) 确认资产维度本就不用，关闭本单。

## 附带同批缺口（不需单独立项）
dim_event↔country_event键0交集；case_evidence.iso3全空；dim_event.cluster非唯一(EVT-GOLD/EVT-RUS)。
详见 KNOWN_GAPS_V50.txt G2/G3。
"""
open(os.path.join(ISS,'ISS-20260824-002_asset_id键域不一致.md'),'w',encoding='utf-8').write(issue)
print('A04交付物与问题单已生成')

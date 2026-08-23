# -*- coding: utf-8 -*-
# A02/P0 收尾：对账表、类型表、关系表、XML说明、验收单（平台列留空待A人工填写）
import os, sys
sys.path.insert(0, r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A01")
from a01_xlsx_writer import write_xlsx

P0 = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\P0"

# 1) 导入对账表：源行数为实测，平台列留空
recon = [
 ['表','源行数(实测)','平台行数(待填)','行数一致?','主键','源主键重复','源空主键','平台主键重复(待填)','平台空主键(待填)','判定(待填)'],
 ['P0_XH202612_V50_dim_country',3,'','','iso3',0,0,'','',''],
 ['P0_XH202612_V50_dim_date',24,'','','date_key',0,0,'','',''],
 ['P0_XH202612_V50_country_monthly_risk',72,'','','iso3+month_end',0,0,'','',''],
 ['P0_XH202612_V50_global_cycle_month',24,'','','scope_id+month_end',0,0,'','',''],
]
write_xlsx(os.path.join(P0,'P0_IMPORT_RECONCILIATION.xlsx'),'导入对账',recon[0],recon[1:])

# 2) 类型检查表：每表每字段的期望类型（按月序列值/日期格式写出，Smartbi应识别为日期）
def tcols(name, cols): return [[name,c,t,'',''] for c,t in cols]
types = [['表','字段','期望类型','平台识别类型(待填)','判定(待填)']]
types += tcols('P0_dim_country', [
 ('iso3','文本'),('country_name_zh','文本'),('country_name_en','文本'),('region','文本'),('subregion','文本'),
 ('currency_name','文本'),('currency_code','文本'),('country_role','文本'),('is_selected_40','整数'),('is_low_risk_control','整数'),('run_id','文本')])
types += tcols('P0_dim_date', [
 ('date_key','整数'),('month_end','日期(非文本!)'),('year','整数'),('quarter','整数'),('month','整数'),
 ('in_country_panel','整数'),('in_global_cycle','整数'),('run_id','文本')])
types += tcols('P0_country_monthly_risk', [
 ('iso3','文本'),('month_end','日期(非文本!)'),('fx_avg_lcu_per_usd','数值'),('cpi_index','数值'),
 ('fx_reserves_usd','数值'),('reserve_import_months','数值'),('imports_usd','数值'),('source_id','文本'),
 ('source_frequency','文本'),('fetch_date','整数'),('data_version','文本'),('is_proxy','整数'),('is_imputed','整数'),
 ('run_id','文本'),('fx_eom_lcu_per_usd','数值'),('fx_eom_source','文本'),('fx_avg_source','文本'),('cpi_source','文本')])
types += tcols('P0_global_cycle_month', [
 ('month_end','日期(非文本!)'),('scope_id','文本'),('industrial_production_index','数值'),('policy_rate','数值'),
 ('unemployment_rate','数值'),('cpi_index','数值'),('yield_10y','数值'),('nfci_level','数值'),('equity_index','数值'),
 ('vix_level','数值'),('oil_price_usd','数值'),('gold_price_usd','数值'),('broad_dollar_index','数值'),('tbill_3m','数值'),
 ('broad_dollar_1973','数值'),('industrial_production_yoy','数值'),('cpi_yoy','数值'),('real_policy_rate','数值'),
 ('yield_spread_10y_3m','数值'),('sahm_realtime_value','数值'),('nfci_expanding_percentile','数值'),('equity_drawdown','数值'),
 ('hy_oas_12m_change_bps','数值'),('property_real_index','数值'),('property_observation_date','日期'),('hy_oas_bps_license','文本'),
 ('source_id','文本'),('original_frequency','文本'),('vintage_date','整数'),('fetch_date','整数'),('vintage_reconstructed','整数'),
 ('quality_flag','文本'),('run_id','文本'),('property_release_date','日期或整数'),('property_original_frequency','文本'),
 ('property_asof_carried','整数')])
write_xlsx(os.path.join(P0,'P0_TYPE_CHECK.xlsx'),'类型检查',types[0],types[1:])

# 3) 关系检查表
rel = [
 ['关系','方向','基数','建前事实行数(实测)','建后事实行数(待填)','膨胀?','判定(待填)'],
 ['P0_dim_country.iso3 → P0_country_monthly_risk.iso3','单向(维→事实)','1对多',72,'','',''],
 ['P0_dim_date.month_end → P0_country_monthly_risk.month_end','单向(维→事实)','1对多',72,'','',''],
 ['P0_dim_date.month_end → P0_global_cycle_month.month_end','单向(维→事实)','1对多',24,'','',''],
 ['说明','join键均为日期/文本，禁止多对多；建关系后事实表查询行数必须等于建前；禁止用DISTINCT掩盖膨胀','','','','',''],
]
write_xlsx(os.path.join(P0,'P0_RELATIONSHIP_CHECK.xlsx'),'关系检查',rel[0],rel[1:])

# 4) XML依赖说明
xml_txt = """P0 XML导出与依赖记录（步骤7）
==================================================
对象前缀：P0_XH202612_V50（禁止用正式资源名）

应导出的P0对象清单：
1. P0_XH202612_V50_dim_country（3行）
2. P0_XH202612_V50_dim_date（24行）
3. P0_XH202612_V50_country_monthly_risk（72行）
4. P0_XH202612_V50_global_cycle_month（24行）
5. 上述3条单向关系所在的数据模型
6. P0验收页（1个KPI + 2张折线 + 国家/月份筛选器）

导出后在此记录（A人工填写）：
- XML文件路径：__________
- XML大小(字节)：__________
- XML的SHA-256：__________（Git Bash命令：sha256sum 文件路径）
- 导出时间：__________

恢复验收规则（禁止事项5）：
- 只有在“干净目标环境”（未含这些P0对象的环境或已彻底删除后）恢复成功，才能写“独立恢复PASS”。
- 覆盖恢复到同一非空目标不算独立恢复。
- 若没有干净目标可做恢复，必须明确写：恢复未验收。
恢复结论（A人工填写）：__________
"""
open(os.path.join(P0,'P0_XML_DEPENDENCIES.txt'),'w',encoding='utf-8').write(xml_txt)

# 5) 验收单
acc = """P0验收单（A02）
==================================================
日期：2026-08-23　执行者：A　对象前缀：P0_XH202612_V50

AI已完成（有读数证据）：
[x] 步骤1 选样：TUR(完整)+NGA(储备全缺)+ZWE(fx缺20/24月,cpi全缺)，2024-01..2025-12连续24个月
[x] 步骤2 四张P0样本表：3/24/72/24行，主键/来源/run_id保留，month_end按Excel日期格式写出
[x] 本地基线：缺失单元格320个(P0_MISSING_BASELINE.csv)、KPI=3、折线72+24点(P0_CHART_BASELINE.csv)
[x] 对账/类型/关系三张检查表模板（源侧读数已填，平台列留空）

A人工完成（Smartbi平台，AI不可代点）：
[ ] 步骤3 上传4张表，逐表记录平台行数填P0_IMPORT_RECONCILIATION.xlsx，截图4张
[ ] 步骤3b 核对字段类型填P0_TYPE_CHECK.xlsx；month_end必须是日期，若是文本停止并报告
[ ] 步骤4 建3条单向关系，记录建后行数填P0_RELATIONSHIP_CHECK.xlsx，截图
[ ] 步骤5 建KPI(国家数=3)、折线1(3国fx)、折线2(全球cpi_yoy)、国家+月份筛选器，截图
[ ] 步骤6 用筛选器逐项验证：选ZWE时fx折线只有4个点且缺口不是0；行数不膨胀
[ ] 步骤7 导出XML，算SHA-256填P0_XML_DEPENDENCIES.txt；无干净目标则写“恢复未验收”

PASS标准（全部满足才签PASS）：
- 四表行数一致且主键重复0/空0
- 日期/文本/数字类型正确（month_end不是文本）
- 筛选不膨胀、缺失仍为空
- KPI和折线与基线误差≤1%
- XML已导出并有哈希

最终判定（A人工签署）：__________
"""
open(os.path.join(P0,'P0_ACCEPTANCE.txt'),'w',encoding='utf-8').write(acc)
print('全部P0文件已生成')

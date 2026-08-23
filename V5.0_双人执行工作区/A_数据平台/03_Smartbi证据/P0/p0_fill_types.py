# -*- coding: utf-8 -*-
# 按执行者提供的平台字段类型截图（2026-08-23）回填 P0_TYPE_CHECK.xlsx
import os, sys
sys.path.insert(0, r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A01")
from a01_xlsx_writer import write_xlsx

P0 = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\P0"

HDR = ['表','字段','期望类型','平台识别类型','判定']
# (表, 字段, 期望, 平台实测[来自截图], 判定)
R = []
def add(t, rows):
    for r in rows: R.append([t]+list(r))

P = 'PASS'; 
add('P0_dim_country', [
 ('iso3','文本','string',P),('country_name_zh','文本','string',P),('country_name_en','文本','string',P),
 ('region','文本','string',P),('subregion','文本','string',P),('currency_name','文本','string',P),
 ('currency_code','文本','string',P),('country_role','文本','string',P),
 ('is_selected_40','整数','integer',P),('is_low_risk_control','整数','integer',P),('run_id','文本','string',P)])
add('P0_dim_date', [
 ('date_key','整数','integer',P),('month_end','日期(非文本!)','timestamp',P),('year','整数','integer',P),
 ('quarter','整数','integer',P),('month','整数','integer',P),('in_country_panel','整数','integer',P),
 ('in_global_cycle','整数','integer',P),('run_id','文本','string',P)])
add('P0_country_monthly_risk', [
 ('iso3','文本','string',P),('month_end','日期(非文本!)','timestamp',P),
 ('fx_avg_lcu_per_usd','数值','double',P),('cpi_index','数值','double',P),
 ('fx_reserves_usd','数值','integer','PASS(小样全为整数无丢失;A03全量导入必须改double,全量表含小数如2106.2)'),
 ('reserve_import_months','数值','double',P),('imports_usd','数值','double',P),
 ('source_id','文本','string',P),('source_frequency','文本','string',P),('fetch_date','整数','integer',P),
 ('data_version','文本','string',P),('is_proxy','整数','integer',P),('is_imputed','整数','integer',P),
 ('run_id','文本','string',P),('fx_eom_lcu_per_usd','数值','double',P),('fx_eom_source','文本','string',P),
 ('fx_avg_source','文本','string',P),('cpi_source','文本','string',P)])
add('P0_global_cycle_month', [
 ('month_end','日期(非文本!)','timestamp',P),('scope_id','文本','string',P),
 ('industrial_production_index','数值','double',P),('policy_rate','数值','double',P),
 ('unemployment_rate','数值','double',P),('cpi_index','数值','double',P),('yield_10y','数值','double',P),
 ('nfci_level','数值','double',P),('equity_index','数值','double',P),('vix_level','数值','double',P),
 ('oil_price_usd','数值','double',P),
 ('gold_price_usd','数值','integer','PASS(小样全为整数无丢失;A03全量导入必须改double)'),
 ('broad_dollar_index','数值','double',P),('tbill_3m','数值','double',P),
 ('broad_dollar_1973','数值','string','偏差记录:窗口24个月该列全空(0/24),平台默认string,无数据可丢;A03须按数值复核'),
 ('industrial_production_yoy','数值','double',P),('cpi_yoy','数值','double',P),('real_policy_rate','数值','double',P),
 ('yield_spread_10y_3m','数值','string(平台误判)','文件侧24/24为数值格(已核实),已要求A手改double,待复核截图'),
 ('sahm_realtime_value','数值','double',P),('nfci_expanding_percentile','数值','double',P),
 ('equity_drawdown','数值','string(平台误判)','文件侧24/24为数值格(已核实),已要求A手改double,待复核截图'),
 ('hy_oas_12m_change_bps','数值','double',P),('property_real_index','数值','double',P),
 ('property_observation_date','日期','date',P),('hy_oas_bps_license','文本','string',P),
 ('source_id','文本','string',P),('original_frequency','文本','string',P),
 ('vintage_date','整数','integer',P),('fetch_date','整数','integer',P),('vintage_reconstructed','整数','integer',P),
 ('quality_flag','文本','string',P),('run_id','文本','string',P),
 ('property_release_date','日期或整数','string','偏差记录:窗口内全空(0/24),平台默认string;A03须按源表复核'),
 ('property_original_frequency','文本','string',P),('property_asof_carried','整数','integer',P)])

write_xlsx(os.path.join(P0,'P0_TYPE_CHECK.xlsx'),'类型检查',HDR,R)
print('已回填', len(R), '个字段')
from collections import Counter
print(Counter(r[4].split('(')[0] for r in R))

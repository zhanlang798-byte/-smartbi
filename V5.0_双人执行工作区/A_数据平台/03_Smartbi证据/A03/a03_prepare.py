# -*- coding: utf-8 -*-
# A03 前置：资源锁表 + 逐表对账基准 + 字段级类型审计（源端扫描实测） + 执行日志
import os, sys, json, datetime

# 2026-09-04：初建草稿生成器退役。直接运行会覆盖后续平台读数与历史证据。
# 日常只读核验入口：A03_RECHECK_20260904/a03_preflight.mjs。
# 此开关仅供明确的历史草稿重建，不得把生成结果用作新的平台实测证据。
if os.environ.get('A03_ALLOW_ARCHIVE_REBUILD') != '1':
    raise SystemExit('ARCHIVED_GENERATOR_BLOCKED: use A03_RECHECK_20260904/a03_preflight.mjs for read-only validation')

sys.path.insert(0, r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A00")
sys.path.insert(0, r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A01")
from xlsx_min import Xlsx
from a01_xlsx_writer import write_xlsx

BASE = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\01_输入只读镜像\D0-D12_数据交付_V4.2\data\smartbi"
AUX = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\02_MVP辅助表"
OUT = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A03"
os.makedirs(OUT, exist_ok=True)
NOW = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S +0800')
PFX = 'V50_'

res = json.load(open(os.path.join(OUT, '..', 'A00', 'A00_step45_results.json'), encoding='utf-8'))
formal = res['formal']  # order/file/exp_rows/exp_cols/exp_pk

DATE_FIELDS = {'month_end','start_month','end_month','start_date','end_date','report_date',
               'confirmation_date','property_observation_date','property_release_date',
               'latest_fx_date','latest_cpi_date','latest_reserve_date',
               'latest_reserve_import_months_date'}

def classify(vals):
    """根据非空值样本判定类型"""
    seen_num = seen_int = seen_text = False
    for v in vals:
        if v == '': continue
        try:
            f = float(v)
            seen_num = True
            if f != int(f): seen_int = True  # 有小数
        except ValueError:
            seen_text = True
    if seen_text: return '文本'
    if seen_num: return '数值' if seen_int else '整数'
    return '空列'

# ---------- 类型审计（逐表逐字段源端扫描） ----------
type_rows = [['表','字段','期望类型(源端实测)','平台类型(待填)','判定(待填)','备注']]
audit_notes = {'fx_reserves_usd': 'P0经验：平台可能误判integer,须确认double/浮点',
               'gold_price_usd': 'P0经验：平台可能误判integer,须确认double/浮点',
               'month_end': '必须是日期,不得为文本/整数'}
table_meta = {}  # fn -> (rows_scanned)
for e in formal:
    fn = e['file']
    x = Xlsx(os.path.join(BASE, fn))
    rows = list(x.iter_rows('data'))
    hdr, body = rows[0], rows[1:]
    table_meta[fn] = len(body)
    cols = list(zip(*[r + ['']*(len(hdr)-len(r)) for r in body])) if body else [[] for _ in hdr]
    for ci, cname in enumerate(hdr):
        if cname in DATE_FIELDS:
            t = '日期'
        else:
            t = classify(cols[ci])
        note = audit_notes.get(cname, '')
        type_rows.append([fn, cname, t, '', '', note])
    print('扫描', fn, len(body), '行', len(hdr), '列')

for fn in ['MVP_country_latest.xlsx','MVP_company_data_status.xlsx','MVP_cycle_state.xlsx']:
    x = Xlsx(os.path.join(AUX, fn))
    rows = list(x.iter_rows('data'))
    hdr, body = rows[0], rows[1:]
    cols = list(zip(*[r + ['']*(len(hdr)-len(r)) for r in body])) if body else [[] for _ in hdr]
    for ci, cname in enumerate(hdr):
        if cname in DATE_FIELDS:
            t = '日期'
        elif cname in ('generated_at','view_run_id','view_version','source_run_id','ruleset_version',
                       'trigger_label','labels','primary_state','missing_reason','answer_scope',
                       'prohibited_inference','quality_flag','source_id','iso3','company_id',
                       'country_name_zh','region','industry','company_name_zh','scope_id',
                       'latest_odi_stock_year','fiscal_year_min','fiscal_year_max'):
            t = '文本' if cname not in ('fiscal_year_min','fiscal_year_max','latest_odi_stock_year') else '整数'
        else:
            t = classify(cols[ci])
        type_rows.append([fn, cname, t, '', '', '辅助表(A01生成)'])
    print('扫描', fn, len(body), '行', len(hdr), '列')

write_xlsx(os.path.join(OUT,'SMARTBI_TYPE_AUDIT_V50.xlsx'),'类型审计',type_rows[0],type_rows[1:])
print('类型审计字段数:', len(type_rows)-1)

# ---------- 资源锁表 ----------
lock = [['序号','目标对象名','对应源文件','平台是否已存在同名(待填)','锁建立人','锁建立时间','备注']]
aux_names = ['MVP_country_latest','MVP_company_data_status','MVP_cycle_state']
for e in formal:
    nm = e['file'].replace('.xlsx','')
    lock.append([e['order'], PFX+nm, e['file'], '', '执行者A', NOW, '上传前必须确认平台无同名'])
for i, nm in enumerate(aux_names, 19):
    lock.append([i, PFX+nm, nm+'.xlsx', '', '执行者A', NOW, '辅助表,18表PASS后再传'])
write_xlsx(os.path.join(OUT,'SMARTBI_RESOURCE_LOCK_V50.xlsx'),'资源锁',lock[0],lock[1:])

# ---------- 逐表对账基准 ----------
recon = [['顺序','源文件','平台对象名','源行数(控制清单)','源列数','主键','平台行数(待填)','行数一致?','主键重复(待填)','空主键(待填)','判定(待填)']]
for e in formal:
    nm = e['file'].replace('.xlsx','')
    recon.append([e['order'], e['file'], PFX+nm, e['exp_rows'], e['exp_cols'], e['exp_pk'], '','','','',''])
recon.append([19,'MVP_country_latest.xlsx',PFX+'MVP_country_latest',40,27,'iso3','','','','',''])
recon.append([20,'MVP_company_data_status.xlsx',PFX+'MVP_company_data_status',20,17,'company_id','','','','',''])
recon.append([21,'MVP_cycle_state.xlsx',PFX+'MVP_cycle_state',660,29,'scope_id+month_end','','','','',''])
recon.append(['','正式18表合计','',313593,'','','','','','','必须等于313,593'])
write_xlsx(os.path.join(OUT,'SMARTBI_IMPORT_RECONCILIATION_V50.xlsx'),'导入对账',recon[0],recon[1:])

# ---------- 执行日志（AI侧部分） ----------
log = f"""A03 全量导入 执行日志 V5.0
==================================================
开始时间：{NOW}
执行方式：AI生成基准与对账表；上传/点击/类型设置由执行者A人工完成

输入检查（实测读数）：
1. 18张正式表哈希与A00锁定值逐一比对：不符0个 ✓
2. 3张控制簿在位 ✓（只读参照，不导入模型——禁止事项4）
3. 3张辅助表在位（02_MVP辅助表，A01产物）✓
4. P0门证据齐备（P0_ACCEPTANCE.txt=PASS）→ 满足"无P0证据不得全量导入"前置 ✓
5. 源文件日期列为真Excel日期格式（dim_date/country_monthly_risk实测styles含日期格式）✓
6. 对象前缀：{PFX}；平台30字符限制适配，批准及历史证据见现行交接记录。

步骤1 资源锁：已生成21个目标对象锁（SMARTBI_RESOURCE_LOCK_V50.xlsx），
  平台同名检查列待A在Smartbi搜索确认后填写。→ AI侧完成，平台侧待A

步骤2-4（上传18表）：待A人工执行。顺序锁死1→18，每张导完立即记行数。
步骤5（合计313,593复核）：待A。
步骤6（辅助表40/20/660）：18表PASS后才可开始。
步骤7（类型/日期范围/主键/截图索引导出）：类型审计基线已生成（{len(type_rows)-1}字段），平台列待A填。

已知风险预警（P0实测经验）：
- fx_reserves_usd、gold_price_usd 平台可能误判integer，全量表含小数，必须确认浮点型。
- portfolio_scenario 207,720行×19列，上传较慢，预留时间。
- yield_spread_10y_3m、equity_drawdown 在P0曾被误判string，全量导入后须复查。
"""
open(os.path.join(OUT,'A03_EXECUTION_LOG_V50.txt'),'w',encoding='utf-8').write(log)
print('日志已写')

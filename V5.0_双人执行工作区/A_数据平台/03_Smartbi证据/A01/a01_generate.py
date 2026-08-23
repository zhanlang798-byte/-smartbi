# -*- coding: utf-8 -*-
# A01 主生成器：从只读镜像生成三张MVP辅助表
# 规则：缺失保持空不填0；只用当月及此前数据；阈值全部来自合同/YAML，不自创。
import os, sys, zipfile, datetime
from xml.sax.saxutils import escape
from collections import defaultdict

EVID00 = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A00"
sys.path.insert(0, EVID00)
from xlsx_min import Xlsx

BASE = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\01_输入只读镜像\D0-D12_数据交付_V4.2\data\smartbi"
OUT = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\02_MVP辅助表"
os.makedirs(OUT, exist_ok=True)

from datetime import date, timedelta
EPOCH = date(1899, 12, 30)
def serial_to_date(s):
    return EPOCH + timedelta(days=int(float(s)))

NOW = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S +0800')
VIEW_RUN_ID = "20260823_v50_a01"
VIEW_VERSION = "V5.0"
RULESET = "global_cycle_rules_v41"

def f(v):
    """字符串→float；空→None"""
    if v is None or v == '': return None
    return float(v)

def load(fn):
    x = Xlsx(os.path.join(BASE, fn))
    rows = list(x.iter_rows('data'))
    hdr = rows[0]
    ix = {c: i for i, c in enumerate(hdr)}
    return hdr, ix, rows[1:]

# ---------- 通用xlsx写出（数字写数值格，空串跳过该格） ----------
def write_xlsx(path, sheet_name, header, data_rows):
    def col(n):
        s = ""
        while n > 0:
            n, r = divmod(n - 1, 26); s = chr(65 + r) + s
        return s
    def cell(ri, ci, v):
        ref = f"{col(ci)}{ri}"
        if v is None or v == '':
            return ''
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            return f'<c r="{ref}"><v>{v!r}</v></c>'
        return f'<c r="{ref}" t="inlineStr"><is><t xml:space="preserve">{escape(str(v))}</t></is></c>'
    srs = []
    allr = [header] + data_rows
    for ri, row in enumerate(allr, 1):
        cells = ''.join(cell(ri, ci, v) for ci, v in enumerate(row, 1))
        srs.append(f'<row r="{ri}">{cells}</row>')
    sheet = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
             '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
             + ''.join(srs) + '</sheetData></worksheet>')
    wb = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
          'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
          f'<sheets><sheet name="{escape(sheet_name)}" sheetId="1" r:id="rId1"/></sheets></workbook>')
    rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
    wb_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
               '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
               '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')
    ct = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
          '<Default Extension="xml" ContentType="application/xml"/>'
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
          '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", ct); z.writestr("_rels/.rels", rels)
        z.writestr("xl/workbook.xml", wb); z.writestr("xl/_rels/workbook.xml.rels", wb_rels)
        z.writestr("xl/worksheets/sheet1.xml", sheet)

def tri_any(conds):
    if any(c is True for c in conds): return True
    if all(c is False for c in conds): return False
    return None

def tri_all(conds):
    if any(c is False for c in conds): return False
    if all(c is True for c in conds): return True
    return None

# ======================================================================
# 表1：MVP_country_latest（40行，主键iso3）
# ======================================================================
_, cix, crows = load('dim_country.xlsx')
sel40 = [r for r in crows if r[cix['is_selected_40']] == '1']
assert len(sel40) == 40, f"is_selected_40={len(sel40)}"

_, mix, mrows = load('country_monthly_risk.xlsx')
by_iso = defaultdict(list)
for r in mrows:
    by_iso[r[mix['iso3']]].append(r)
for rs in by_iso.values():
    rs.sort(key=lambda r: float(r[mix['month_end']]))

_, eix, erows = load('country_event.xlsx')
ev_by_iso = defaultdict(set)
for r in erows:
    ev_by_iso[r[eix['iso3']]].add(r[eix['event_id']])

_, xix, xrows = load('country_exposure.xlsx')
odi_by_iso = defaultdict(list)
for r in xrows:
    if r[xix['odi_stock_usd']] != '':
        odi_by_iso[r[xix['iso3']]].append(r)

def latest_nonnull(rs, col):
    for r in reversed(rs):  # rs已按月份升序
        if r[mix[col]] != '':
            return r
    return None

T1_HDR = ["iso3","country_name_zh","region","latest_fx_value","latest_fx_date",
          "latest_cpi_value","latest_cpi_date","latest_reserve_usd","latest_reserve_date",
          "latest_reserve_import_months","latest_reserve_import_months_date",
          "fx_12m_depr","cpi_yoy","fx_threshold_multiple","cpi_threshold_multiple",
          "max_threshold_multiple","trigger_label","crisis_event_count",
          "latest_odi_stock_usd","latest_odi_stock_year","source_id","quality_flag",
          "missing_reason","source_run_id","view_run_id","view_version","generated_at"]
t1 = []
for c in sorted(sel40, key=lambda r: r[cix['iso3']]):
    iso = c[cix['iso3']]
    rs = by_iso.get(iso, [])
    # 月查找表：(年,月)->行
    by_ym = {}
    for r in rs:
        d = serial_to_date(r[mix['month_end']])
        by_ym[(d.year, d.month)] = r
    missing = []
    srcs, quals, runids = set(), set(), set()

    def take(colname, label):
        r = latest_nonnull(rs, colname)
        if r is None:
            missing.append(label)
            return None, ''
        srcs.add(r[mix['source_id']]); runids.add(r[mix['run_id']])
        if r[mix['is_proxy']] == '1': quals.add('proxy')
        if r[mix['is_imputed']] == '1': quals.add('imputed')
        return f(r[mix[colname]]), serial_to_date(r[mix['month_end']]).isoformat()

    fx_v, fx_d = take('fx_avg_lcu_per_usd', 'fx_avg_lcu_per_usd无非空值')
    cpi_v, cpi_d = take('cpi_index', 'cpi_index无非空值')
    res_v, res_d = take('fx_reserves_usd', 'fx_reserves_usd无非空值')
    rim_v, rim_d = take('reserve_import_months', 'reserve_import_months无非空值')

    def yoy(cur_row_month, colname):
        """当前月与12个月前的比-1；端点缺失→None"""
        if cur_row_month == '': return None
        d0 = date.fromisoformat(cur_row_month)
        prev = by_ym.get((d0.year - 1, d0.month))
        if prev is None or prev[mix[colname]] == '': return None
        cur = by_ym[(d0.year, d0.month)]
        return f(cur[mix[colname]]) / f(prev[mix[colname]]) - 1.0

    depr = yoy(fx_d, 'fx_avg_lcu_per_usd')
    yoyc = yoy(cpi_d, 'cpi_index')
    if depr is None: missing.append('fx_12m_depr端点缺失')
    if yoyc is None: missing.append('cpi_yoy端点缺失')
    fx_mult = depr / 0.20 if depr is not None else None
    cpi_mult = yoyc / 0.15 if yoyc is not None else None
    mults = [m for m in (fx_mult, cpi_mult) if m is not None]
    max_mult = max(mults) if mults else None
    fx_trig = depr is not None and depr >= 0.20
    cpi_trig = yoyc is not None and yoyc >= 0.15
    if depr is not None and yoyc is not None:
        label = '双触发' if (fx_trig and cpi_trig) else ('单触发' if (fx_trig or cpi_trig) else '未触发')
    else:
        label = '数据不足'

    ev_cnt = len(ev_by_iso.get(iso, set()))
    odi_rs = odi_by_iso.get(iso, [])
    if odi_rs:
        best = max(odi_rs, key=lambda r: int(float(r[xix['year']])))
        odi_v, odi_y = f(best[xix['odi_stock_usd']]), str(int(float(best[xix['year']])))
        srcs.add(best[xix['source_id']]); runids.add(best[xix['run_id']])
    else:
        odi_v, odi_y = None, ''
        missing.append('odi_stock_usd无非空值')

    t1.append([iso, c[cix['country_name_zh']], c[cix['region']],
               fx_v, fx_d, cpi_v, cpi_d, res_v, res_d, rim_v, rim_d,
               depr, yoyc, fx_mult, cpi_mult, max_mult, label, ev_cnt,
               odi_v, odi_y, ';'.join(sorted(s for s in srcs if s)),
               '+'.join(sorted(quals)) if quals else 'original',
               ';'.join(missing),
               ';'.join(sorted(runids)), VIEW_RUN_ID, VIEW_VERSION, NOW])

write_xlsx(os.path.join(OUT, 'MVP_country_latest.xlsx'), 'data', T1_HDR, t1)
print('表1 MVP_country_latest 行数:', len(t1),
      '触发分布:', {k: sum(1 for r in t1 if r[16] == k) for k in ['双触发','单触发','未触发','数据不足']})

# ======================================================================
# 表2：MVP_company_data_status（20行，主键company_id）
# ======================================================================
_, pix, prows = load('dim_company.xlsx')
_, oix, orows = load('company_overseas_exposure.xlsx')
_, bix, brows = load('bridge_company_geography.xlsx')

# 步骤5确认（同时进QA）
n_global = sum(1 for r in orows if r[oix['geography_level']] == 'global')
n_region = sum(1 for r in orows if r[oix['geography_level']] == 'region')
n_rev = {c: sum(1 for r in orows if r[oix[c]] != '') for c in ['total_revenue','overseas_revenue','overseas_revenue_share']}
n_bridge_country = sum(1 for r in brows if r[bix['iso3']] != '')
print('步骤5读数: global', n_global, 'region', n_region, '收入三字段非空', n_rev, '国家桥接', n_bridge_country)

DISCLOSE_FIELDS = ['report_date','raw_value','normalized_value','total_revenue','overseas_revenue',
                   'overseas_revenue_share','geography_revenue','fx_gain_loss','foreign_currency_assets',
                   'foreign_currency_liabilities','foreign_debt_currency','foreign_debt_balance',
                   'hedge_notional','hedge_instrument','overseas_subsidiary_count','disclosed_country_count',
                   'cash_and_equivalents','short_term_investments','committed_credit_line','credit_line_available',
                   'annual_report_page']
by_comp = defaultdict(list)
for r in orows:
    by_comp[r[oix['company_id']]].append(r)

T2_HDR = ["company_id","company_name_zh","industry","fiscal_year_min","fiscal_year_max",
          "disclosure_rows","disclosed_field_nonnull_count","region_rows","country_rows",
          "unique_source_count","answer_scope","prohibited_inference","missing_reason",
          "source_run_id","view_run_id","view_version","generated_at"]
t2 = []
for c in sorted(prows, key=lambda r: r[pix['company_id']]):
    cid = c[pix['company_id']]
    rs = by_comp.get(cid, [])
    years = sorted(int(float(r[oix['fiscal_year']])) for r in rs if r[oix['fiscal_year']] != '')
    nonnull = sum(1 for r in rs for fld in DISCLOSE_FIELDS if r[oix[fld]] != '')
    n_reg = sum(1 for r in rs if r[oix['geography_level']] == 'region')
    n_cty = sum(1 for r in rs if r[oix['geography_level']] == 'country')
    n_src = len({r[oix['source_id']] for r in rs if r[oix['source_id']] != ''})
    runids = sorted({r[oix['run_id']] for r in rs if r[oix['run_id']] != ''})
    scope = '目录/行业/财年/通用情景'
    if n_reg > 0: scope += '/地区披露'
    if nonnull > 0: scope += '/已核验单项'
    miss = []
    if not rs: miss.append('无披露行')
    if n_reg == 0: miss.append('无地区披露行')
    miss.append('海外收入三字段(total_revenue/overseas_revenue/overseas_revenue_share)无可用值')
    t2.append([cid, c[pix['company_name_zh']], c[pix['industry']],
               years[0] if years else None, years[-1] if years else None,
               len(rs), nonnull, n_reg, n_cty, n_src, scope,
               '不得生成海外收入排名/企业国家重合推断/真实现金需求与持仓推断',
               ';'.join(miss), ';'.join(runids), VIEW_RUN_ID, VIEW_VERSION, NOW])

write_xlsx(os.path.join(OUT, 'MVP_company_data_status.xlsx'), 'data', T2_HDR, t2)
print('表2 MVP_company_data_status 行数:', len(t2),
      '地区行合计:', sum(r[7] for r in t2), '国家行合计:', sum(r[8] for r in t2))

# ======================================================================
# 表3：MVP_cycle_state（660行，主键scope_id+month_end）
# ======================================================================
_, gix, grows = load('global_cycle_month.xlsx')
grows.sort(key=lambda r: float(r[gix['month_end']]))
assert len(grows) == 660

def col(r, name): return f(r[gix[name]])

n = len(grows)
prop = [col(r, 'property_real_index') for r in grows]
eq   = [col(r, 'equity_index') for r in grows]
eq_dd_provided = [col(r, 'equity_drawdown') for r in grows]
nfci_pct = [col(r, 'nfci_expanding_percentile') for r in grows]
hy_chg = [col(r, 'hy_oas_12m_change_bps') for r in grows]
sahm = [col(r, 'sahm_realtime_value') for r in grows]
ip_yoy = [col(r, 'industrial_production_yoy') for r in grows]
cpi_yoy = [col(r, 'cpi_yoy') for r in grows]
prate = [col(r, 'policy_rate') for r in grows]
rprate = [col(r, 'real_policy_rate') for r in grows]

# 截至当月峰值的回撤（只用≤t数据）
prop_dd, eq_dd_recomp = [], []
pmax = None
for i in range(n):
    if prop[i] is not None:
        pmax = prop[i] if pmax is None else max(pmax, prop[i])
        prop_dd.append(prop[i] / pmax - 1.0)
    else:
        prop_dd.append(None)
emax = None
for i in range(n):
    if eq[i] is not None:
        emax = eq[i] if emax is None else max(emax, eq[i])
        eq_dd_recomp.append(eq[i] / emax - 1.0)
    else:
        eq_dd_recomp.append(None)

# 无未来信息审计：提供的equity_drawdown vs 截断重算
audit_diffs = []
for i in range(n):
    if eq_dd_provided[i] is not None and eq_dd_recomp[i] is not None:
        audit_diffs.append(abs(eq_dd_provided[i] - eq_dd_recomp[i]))
audit_max_diff = max(audit_diffs) if audit_diffs else None
print('无未来信息审计: equity_drawdown 提供值vs≤t重算 最大差:', audit_max_diff, f'(比对{len(audit_diffs)}个月)')

def neg3(series, i):
    """i及前两月连续为负；任一缺失→None"""
    if i < 2: return None
    w = series[i-2:i+1]
    if any(v is None for v in w): return None
    return all(v < 0 for v in w)

def chg12_bps(series, i):
    if i < 12 or series[i] is None or series[i-12] is None: return None
    return (series[i] - series[i-12]) * 100.0

CRISIS4 = {'credit_systemic','asset_bust','recession','deflation'}
CRISIS_CLASS = {'credit_systemic','asset_bust','recession','deflation','stagflation'}
PRIORITY = ['credit_systemic','asset_bust','recession','deflation','stagflation',
            'aggressive_tightening','inflation_overheating','recovery_reflation','normal_expansion']

T3_HDR = ["scope_id","month_end","cpi_yoy","industrial_production_yoy","sahm_realtime_value",
          "nfci_expanding_percentile","equity_drawdown","property_peak_to_trough",
          "policy_rate_12m_change_bps","real_policy_rate_12m_change_bps","hy_oas_12m_change_bps",
          "trig_credit_systemic","trig_asset_bust","trig_recession","trig_deflation",
          "trig_stagflation","trig_aggressive_tightening","trig_inflation_overheating",
          "trig_recovery_reflation","trig_normal_expansion","labels","primary_state",
          "compound_global_crisis","missing_reason","source_run_id","ruleset_version",
          "view_run_id","view_version","generated_at"]
t3 = []
prev_primary = None
for i in range(n):
    r = grows[i]
    m_end = serial_to_date(r[gix['month_end']]).isoformat()
    scope = r[gix['scope_id']]
    pr_chg = chg12_bps(prate, i)
    rpr_chg = chg12_bps(rprate, i)
    c3 = neg3(cpi_yoy, i)   # cpi连续3月<0
    i3 = neg3(ip_yoy, i)    # ip连续3月<0
    cond_sahm = None if (sahm[i] is None or ip_yoy[i] is None) else (sahm[i] >= 0.50 and ip_yoy[i] < 0)

    trig = {}
    miss = {}
    trig['credit_systemic'] = tri_any([
        None if hy_chg[i] is None else hy_chg[i] >= 300,
        None if nfci_pct[i] is None else nfci_pct[i] >= 0.90,
        None])  # grade_A_banking_event 无数据列
    if trig['credit_systemic'] is None:
        miss['credit_systemic'] = 'grade_A_banking_event无数据源且其余条件未触发'
    trig['asset_bust'] = tri_any([
        None if eq_dd_provided[i] is None else eq_dd_provided[i] <= -0.20,
        None if prop_dd[i] is None else prop_dd[i] <= -0.15])
    if trig['asset_bust'] is None:
        miss['asset_bust'] = 'equity_drawdown缺失且房地产峰谷跌幅未达-15%'
    trig['recession'] = tri_any([cond_sahm, None])  # official_recession_flag 无数据列
    if trig['recession'] is None:
        miss['recession'] = 'official_recession_flag无数据源且Sahm规则未触发'
    trig['deflation'] = tri_all([c3, i3])
    if trig['deflation'] is None:
        miss['deflation'] = 'cpi/ip连续3月窗口内有缺失'
    trig['stagflation'] = tri_all([
        None if cpi_yoy[i] is None else cpi_yoy[i] >= 0.05, i3])
    if trig['stagflation'] is None:
        miss['stagflation'] = 'cpi_yoy或ip连续3月窗口有缺失'
    trig['aggressive_tightening'] = tri_any([
        None if pr_chg is None else pr_chg >= 300,
        None if rpr_chg is None else rpr_chg >= 200])
    if trig['aggressive_tightening'] is None:
        miss['aggressive_tightening'] = '政策利率12个月变化端点缺失'
    trig['inflation_overheating'] = tri_all([
        None if cpi_yoy[i] is None else cpi_yoy[i] >= 0.03,
        None if ip_yoy[i] is None else ip_yoy[i] > 0])
    if trig['inflation_overheating'] is None:
        miss['inflation_overheating'] = 'cpi_yoy或ip_yoy缺失'
    cond_prev = None if prev_primary in (None, '') else (prev_primary in CRISIS4)
    trig['recovery_reflation'] = tri_all([cond_prev,
        None if ip_yoy[i] is None else ip_yoy[i] > 0,
        None if cpi_yoy[i] is None else (0 < cpi_yoy[i] < 0.03)])
    if trig['recovery_reflation'] is None:
        miss['recovery_reflation'] = '前月主状态为空或cpi/ip缺失'
    others = [trig[k] for k in PRIORITY[:-1]]
    if any(v is True for v in others):
        trig['normal_expansion'] = False
    elif all(v is False for v in others):
        trig['normal_expansion'] = True   # YAML声明为剩余状态，不自创正常区间阈值
    else:
        trig['normal_expansion'] = None
        miss['normal_expansion'] = '存在证据不足的其他状态，无法确认“均未触发”'

    labels = [k for k in PRIORITY if trig[k] is True]
    primary = next((k for k in PRIORITY if trig[k] is True), None)
    crisis_true = [k for k in CRISIS_CLASS if trig[k] is True]
    crisis_unknown = [k for k in CRISIS_CLASS if trig[k] is None]
    if len(crisis_true) >= 2:
        compound = 1
    elif crisis_unknown:
        compound = None
        miss['compound_global_crisis'] = '部分crisis_class状态证据不足: ' + ','.join(crisis_unknown)
    else:
        compound = 0
    if primary is None:
        miss['primary_state'] = '无状态确认触发且存在证据不足状态'
    prev_primary = primary if primary is not None else ''

    def t01(k):
        v = trig[k]
        return 1 if v is True else (0 if v is False else None)
    t3.append([scope, m_end, cpi_yoy[i], ip_yoy[i], sahm[i], nfci_pct[i],
               eq_dd_provided[i], prop_dd[i], pr_chg, rpr_chg, hy_chg[i],
               t01('credit_systemic'), t01('asset_bust'), t01('recession'), t01('deflation'),
               t01('stagflation'), t01('aggressive_tightening'), t01('inflation_overheating'),
               t01('recovery_reflation'), t01('normal_expansion'),
               ';'.join(labels), primary if primary else '',
               compound, '; '.join(f'{k}: {v}' for k, v in miss.items()),
               r[gix['run_id']], RULESET, VIEW_RUN_ID, VIEW_VERSION, NOW])

write_xlsx(os.path.join(OUT, 'MVP_cycle_state.xlsx'), 'data', T3_HDR, t3)
from collections import Counter
pc = Counter(r[22] for r in t3)
print('表3 MVP_cycle_state 行数:', len(t3), '主状态分布:', dict(pc))

# 保存中间结果供QA/手算脚本复用
import json
meta = {
    't1_rows': len(t1), 't2_rows': len(t2), 't3_rows': len(t3),
    'step5': {'global': n_global, 'region': n_region, 'revenue_nonnull': n_rev,
              'bridge_country': n_bridge_country},
    'audit_equity_max_diff': audit_max_diff, 'audit_equity_months': len(audit_diffs),
    'view_run_id': VIEW_RUN_ID, 'generated_at': NOW,
}
evid = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A01"
os.makedirs(evid, exist_ok=True)
json.dump(meta, open(os.path.join(evid, 'a01_gen_meta.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('done')

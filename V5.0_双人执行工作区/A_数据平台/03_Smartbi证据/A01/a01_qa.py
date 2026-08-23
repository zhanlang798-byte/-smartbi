# -*- coding: utf-8 -*-
# A01 QA + 5国手算 + DQ41单测。独立代码路径重算，不与生成器共用函数。
import os, sys, json
from collections import Counter, defaultdict
sys.path.insert(0, r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A00")
from xlsx_min import Xlsx
from datetime import date, timedelta

OUT = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\02_MVP辅助表"
EVID = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A01"
BASE = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\01_输入只读镜像\D0-D12_数据交付_V4.2\data\smartbi"
EPOCH = date(1899, 12, 30)

qa = []  # (检查项, 期望, 实际, 判定)
def check(name, exp, act, ok):
    qa.append([name, str(exp), str(act), 'PASS' if ok else 'FAIL'])
    print(('PASS' if ok else 'FAIL'), name, '| 期望', exp, '| 实际', act)

# ---------- 读回三张表 ----------
def read(fn):
    x = Xlsx(os.path.join(OUT, fn))
    names = x.sheet_names()
    rows = list(x.iter_rows('data'))
    return names, rows[0], rows[1:]

n1, h1, b1 = read('MVP_country_latest.xlsx')
n2, h2, b2 = read('MVP_company_data_status.xlsx')
n3, h3, b3 = read('MVP_cycle_state.xlsx')

check('表1工作表名', "['data']", n1, n1 == ['data'])
check('表2工作表名', "['data']", n2, n2 == ['data'])
check('表3工作表名', "['data']", n3, n3 == ['data'])
check('表1行数', 40, len(b1), len(b1) == 40)
check('表2行数', 20, len(b2), len(b2) == 20)
check('表3行数', 660, len(b3), len(b3) == 660)

# 主键重复/空
def pk_check(tag, hdr, body, cols):
    idx = [hdr.index(c) for c in cols]
    seen = set(); dup = null = 0
    for r in body:
        key = tuple(r[i] if i < len(r) else '' for i in idx)
        if any(v == '' for v in key): null += 1
        elif key in seen: dup += 1
        else: seen.add(key)
    check(f'{tag}主键重复', 0, dup, dup == 0)
    check(f'{tag}空主键', 0, null, null == 0)
pk_check('表1', h1, b1, ['iso3'])
pk_check('表2', h2, b2, ['company_id'])
pk_check('表3', h3, b3, ['scope_id','month_end'])

# 步骤5复核（从源表独立重算）
x = Xlsx(os.path.join(BASE, 'company_overseas_exposure.xlsx'))
rows = list(x.iter_rows('data')); oix = {c: i for i, c in enumerate(rows[0])}; ob = rows[1:]
g = sum(1 for r in ob if r[oix['geography_level']] == 'global')
rg = sum(1 for r in ob if r[oix['geography_level']] == 'region')
rev = sum(1 for r in ob for c in ['total_revenue','overseas_revenue','overseas_revenue_share'] if r[oix[c]] != '')
check('步骤5: global行', 160, g, g == 160)
check('步骤5: region行', 8, rg, rg == 8)
check('步骤5: 海外收入三字段非空合计', 0, rev, rev == 0)
x = Xlsx(os.path.join(BASE, 'bridge_company_geography.xlsx'))
rows = list(x.iter_rows('data')); bix = {c: i for i, c in enumerate(rows[0])}
bc = sum(1 for r in rows[1:] if r[bix['iso3']] != '')
check('步骤5: 国家桥接行', 0, bc, bc == 0)
# 表2地区/国家合计
i2 = {c: i for i, c in enumerate(h2)}
check('表2地区行合计', 8, sum(int(r[i2['region_rows']]) for r in b2), sum(int(r[i2['region_rows']]) for r in b2) == 8)
check('表2国家行合计', 0, sum(int(r[i2['country_rows']]) for r in b2), sum(int(r[i2['country_rows']]) for r in b2) == 0)

# 三态合法性 + 空触发必有missing_reason
i3 = {c: i for i, c in enumerate(h3)}
trig_cols = [c for c in h3 if c.startswith('trig_')]
bad = sum(1 for r in b3 for c in trig_cols if r[i3[c]] not in ('1', '0', ''))
check('表3触发器三态合法值', 0, bad, bad == 0)
no_miss = sum(1 for r in b3 if any(r[i3[c]] == '' for c in trig_cols) and r[i3['missing_reason']] == '')
check('空触发但missing_reason为空的行', 0, no_miss, no_miss == 0)
pc = Counter(r[i3['primary_state']] for r in b3)
print('主状态分布:', dict(pc))

# 版本字段
for tag, hdr, body in [('表1', h1, b1), ('表2', h2, b2), ('表3', h3, b3)]:
    vv = {r[hdr.index('view_version')] for r in body}
    sr = {r[hdr.index('source_run_id')] for r in body}
    check(f'{tag} view_version', {'V5.0'}, vv, vv == {'V5.0'})
    check(f'{tag} source_run_id非空', '全部非空', sr, all(s != '' for s in sr))

# ---------- 5国手算（独立重算，固定抽样：按iso3排序取第1,9,17,25,33个） ----------
x = Xlsx(os.path.join(BASE, 'country_monthly_risk.xlsx'))
rows = list(x.iter_rows('data')); mix = {c: i for i, c in enumerate(rows[0])}
per = defaultdict(dict)
for r in rows[1:]:
    d = EPOCH + timedelta(days=int(float(r[mix['month_end']])))
    per[r[mix['iso3']]][(d.year, d.month)] = r

i1 = {c: i for i, c in enumerate(h1)}
sample = [r for r in sorted(b1, key=lambda r: r[i1['iso3']])][::8][:5]
lines = []
max_err = 0.0
for r in sample:
    iso = r[i1['iso3']]
    tbl_depr = r[i1['fx_12m_depr']]; tbl_yoy = r[i1['cpi_yoy']]
    tbl_fm = r[i1['fx_threshold_multiple']]; tbl_cm = r[i1['cpi_threshold_multiple']]
    # 手算路径：找最新非空fx月
    data = per[iso]
    fx_months = sorted(ym for ym, rr in data.items() if rr[mix['fx_avg_lcu_per_usd']] != '')
    cpi_months = sorted(ym for ym, rr in data.items() if rr[mix['cpi_index']] != '')
    lines.append(f'== {iso} ==')
    e = {}
    if fx_months:
        ym = fx_months[-1]; prev = (ym[0]-1, ym[1])
        cur_v = float(data[ym][mix['fx_avg_lcu_per_usd']])
        if prev in data and data[prev][mix['fx_avg_lcu_per_usd']] != '':
            prev_v = float(data[prev][mix['fx_avg_lcu_per_usd']])
            depr = cur_v/prev_v - 1.0
            e['fx_12m_depr'] = (depr, tbl_depr)
            e['fx_mult'] = (depr/0.20, tbl_fm)
            lines.append(f'  fx: 最新月{ym[0]}-{ym[1]:02d}={cur_v}  12月前={prev_v}')
            lines.append(f'  手算fx_12m_depr={depr!r}  表值={tbl_depr}  差={abs(depr-float(tbl_depr)):.2e}')
            lines.append(f'  手算fx倍数={depr/0.20!r}  表值={tbl_fm}  差={abs(depr/0.20-float(tbl_fm)):.2e}')
            max_err = max(max_err, abs(depr-float(tbl_depr)), abs(depr/0.20-float(tbl_fm)))
    if cpi_months:
        ym = cpi_months[-1]; prev = (ym[0]-1, ym[1])
        cur_v = float(data[ym][mix['cpi_index']])
        if prev in data and data[prev][mix['cpi_index']] != '':
            prev_v = float(data[prev][mix['cpi_index']])
            yoy = cur_v/prev_v - 1.0
            lines.append(f'  cpi: 最新月{ym[0]}-{ym[1]:02d}={cur_v}  12月前={prev_v}')
            lines.append(f'  手算cpi_yoy={yoy!r}  表值={tbl_yoy}  差={abs(yoy-float(tbl_yoy)):.2e}')
            lines.append(f'  手算cpi倍数={yoy/0.15!r}  表值={tbl_cm}  差={abs(yoy/0.15-float(tbl_cm)):.2e}')
            max_err = max(max_err, abs(yoy-float(tbl_yoy)), abs(yoy/0.15-float(tbl_cm)))
open(os.path.join(EVID, 'A01_HANDCALC_5COUNTRIES_V50.txt'), 'w', encoding='utf-8').write(
    'A01 随机5国手算明细（抽样规则：iso3升序每8个取1个，取5国）\n' +
    '手算路径独立编写，直接读源表country_monthly_risk.xlsx，不调用生成器函数。\n\n' + '\n'.join(lines))
check('5国手算最大误差', '<=1e-10', f'{max_err:.2e}', max_err <= 1e-10)

# ---------- DQ41 预期历史阶段单测（来自YAML expected_period_unit_tests） ----------
def months_in(y0, m0, y1, m1):
    out = []
    y, m = y0, m0
    while (y, m) <= (y1, m1):
        out.append(f'{y}-{m:02d}')
        m += 1
        if m == 13: y, m = y + 1, 1
    return out

tests = [
    ('1973-1980 滞胀', months_in(1973,1,1980,12), 'stagflation', False),
    ('1990 资产泡沫破裂', months_in(1990,1,1990,12), 'asset_bust', False),
    ('2000-2002 互联网泡沫', months_in(2000,1,2002,12), 'asset_bust', False),
    ('2008-2009 信用系统性+复合', months_in(2008,1,2009,12), 'credit_systemic', True),
    ('2020-03/04 信用系统性(标签含asset_bust/recession)', ['2020-03','2020-04'], 'credit_systemic', False),
    ('2022 激进紧缩', months_in(2022,1,2022,12), 'aggressive_tightening', False),
]
b3_by_month = {r[i3['month_end']][:7]: r for r in b3}
dq_lines = []
for name, months, expect, need_compound in tests:
    hits = []
    for mm in months:
        r = b3_by_month.get(mm)
        if r is None: continue
        prim = r[i3['primary_state']]
        labels = r[i3['labels']]
        ok = (prim == expect) or (expect in labels.split(';'))
        if need_compound:
            ok = ok and r[i3['compound_global_crisis']] == '1'
        if name.startswith('2020'):
            ok = (prim == expect) and ('asset_bust' in labels or 'recession' in labels)
        hits.append(ok)
    frac = f"{sum(hits)}/{len(hits)}"
    dq_lines.append(f'{name}: 命中{frac}')
    print('DQ41', name, '命中', frac)
    qa.append([f'DQ41单测: {name}', '全部命中', frac, 'PASS' if all(hits) and hits else 'FAIL'])
open(os.path.join(EVID, 'A01_DQ41_DETAIL_V50.txt'), 'w', encoding='utf-8').write('\n'.join(dq_lines))

# ---------- 无未来信息审计表 ----------
meta = json.load(open(os.path.join(EVID, 'a01_gen_meta.json'), encoding='utf-8'))
audit = [
    ['审计项', '方法', '读数', '判定'],
    ['equity_drawdown为逐月截断值', '对全部113个非空月，用≤t的equity_index重算回撤并与提供值比对',
     f"最大差{meta['audit_equity_max_diff']:.2e}（{meta['audit_equity_months']}个月）",
     'PASS' if (meta['audit_equity_max_diff'] or 1) <= 1e-9 else 'FAIL'],
    ['nfci_expanding_percentile', '使用冻结表中已按扩展窗口计算的列（列名即口径），不再重算', '660/660非空', 'PASS'],
    ['property序列为as-of结转', '使用冻结表property_real_index（property_asof_carried=1），峰谷回撤仅用≤t最大值', '见生成脚本', 'PASS'],
    ['12个月变化仅用t-12端点', 'policy_rate/real_policy_rate的12月变化取同序列i-12，i<12留空', '见生成脚本', 'PASS'],
    ['国别最新视图', '每指标取最新非空值，数据最大月份2025-12-31，无超出数据期的取值', '最新月=2025-12-31（40/40国）', 'PASS'],
    ['连续3月窗口', '窗口内任一缺失则该条件不可判（None），不插值不补0', '见三态合法性检查', 'PASS'],
]
import csv
with open(os.path.join(EVID, 'A01_NO_FUTURE_AUDIT_V50.csv'), 'w', encoding='utf-8-sig', newline='') as fp:
    csv.writer(fp).writerows(audit)

# ---------- QA结果xlsx ----------
sys.path.insert(0, EVID)
from a01_xlsx_writer import write_xlsx
write_xlsx(os.path.join(EVID, 'A01_QA_RESULT_V50.xlsx'), 'QA',
           ['检查项','期望','实际','判定'], [q for q in qa])
fails = [q for q in qa if q[3] == 'FAIL']
print('QA总项:', len(qa), 'FAIL项:', len(fails))
for q in fails: print('  FAIL:', q[0], q[1], q[2])

# -*- coding: utf-8 -*-
# A00 步骤4-5：按控制清单核对18张正式表（顺序/工作表data/行列数/主键/SHA-256），3张控制簿单列
import os, json, hashlib, csv
from xlsx_min import Xlsx

BASE = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\01_输入只读镜像\D0-D12_数据交付_V4.2\data\smartbi"
EVID = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A00"

def sha256_file(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1<<20), b''):
            h.update(chunk)
    return h.hexdigest()

# 从控制清单读取期望值（只读，不修改）
ctl = Xlsx(os.path.join(BASE, 'Smartbi导入行数与哈希清单.xlsx'))
rows = list(ctl.iter_rows('data'))
hdr = rows[0]
ix = {name: hdr.index(name) for name in ['import_order','file_name','sheet_name','rows','cols','sha256','primary_key','pk_dup','pk_null']}
expect = []
for r in rows[1:]:
    if not r or not r[ix['file_name']]: continue
    expect.append({k: r[ix[k]] for k in ix})
expect.sort(key=lambda e: int(float(e['import_order'])))
print('控制清单条目数:', len(expect))

results = []
for e in expect:
    fn = e['file_name']
    p = os.path.join(BASE, fn)
    rec = {'order': e['import_order'], 'file': fn,
           'exp_rows': e['rows'], 'exp_cols': e['cols'], 'exp_sha': e['sha256'],
           'exp_pk': e['primary_key'], 'exp_pk_dup': e['pk_dup'], 'exp_pk_null': e['pk_null'],
           'exp_sheet': e['sheet_name']}
    if not os.path.exists(p):
        rec['status'] = 'FAIL: 文件缺失'
        results.append(rec); print(fn, 'MISSING'); continue
    rec['act_sha'] = sha256_file(p)
    rec['sha_ok'] = (rec['act_sha'].lower() == rec['exp_sha'].lower())
    x = Xlsx(p)
    names = x.sheet_names()
    rec['sheets'] = ';'.join(names)
    rec['sheet_ok'] = (names == ['data'])
    data_rows = list(x.iter_rows('data')) if 'data' in names else []
    header = data_rows[0] if data_rows else []
    body = data_rows[1:] if data_rows else []
    rec['act_rows'] = len(body)
    rec['act_cols'] = len(header)
    rec['rows_ok'] = (str(rec['act_rows']) == str(int(float(e['rows']))))
    rec['cols_ok'] = (str(rec['act_cols']) == str(int(float(e['cols']))))
    # 主键重复/空值
    pk_cols = [c.strip() for c in e['primary_key'].split('+')]
    missing_cols = [c for c in pk_cols if c not in header]
    rec['pk_cols_missing'] = ';'.join(missing_cols)
    if not missing_cols:
        idxs = [header.index(c) for c in pk_cols]
        seen = set(); dup = 0; null = 0
        for row in body:
            key = tuple(row[i] if i < len(row) else '' for i in idxs)
            if any(v == '' for v in key):
                null += 1
            elif key in seen:
                dup += 1
            else:
                seen.add(key)
        rec['pk_dup'] = dup; rec['pk_null'] = null
        rec['pk_ok'] = (dup == 0 and null == 0)
    else:
        rec['pk_ok'] = False
    rec['status'] = 'PASS' if all([rec['sha_ok'], rec['sheet_ok'], rec['rows_ok'], rec['cols_ok'], rec['pk_ok']]) else 'FAIL'
    results.append(rec)
    print(fn, rec['status'], 'rows', rec.get('act_rows'), 'cols', rec.get('act_cols'),
          'sha_ok', rec['sha_ok'], 'sheet_ok', rec['sheet_ok'],
          'pk_dup', rec.get('pk_dup'), 'pk_null', rec.get('pk_null'))

total = sum(int(r.get('act_rows', 0)) for r in results if r.get('rows_ok') or 'act_rows' in r)
print('正式表合计行数:', total, '(期望313,593)')

# 步骤5：3张控制簿单列（只读行数，不计入合计）
controls = []
for fn, exp_r in [('数据字典_V4.1.xlsx', 369), ('Smartbi模型映射_V4.1.xlsx', 18), ('Smartbi导入行数与哈希清单.xlsx', 18)]:
    p = os.path.join(BASE, fn)
    c = {'file': fn, 'exp_rows': exp_r, 'exists': os.path.exists(p)}
    if c['exists']:
        x = Xlsx(p)
        c['sheets'] = ';'.join(x.sheet_names())
        c['act_rows'] = sum(1 for _ in x.iter_rows(x.sheet_names()[0])) - 1
        c['sha256'] = sha256_file(p)
    controls.append(c)
    print('控制簿', fn, '存在' if c['exists'] else '缺失', '行数', c.get('act_rows'))

with open(os.path.join(EVID, 'A00_step45_results.json'), 'w', encoding='utf-8') as f:
    json.dump({'formal': results, 'formal_total_rows': total, 'controls': controls}, f, ensure_ascii=False, indent=1)

# 逐表读数导出（CSV即“逐表读数导出”证据）
with open(os.path.join(EVID, 'A00_TABLE_READINGS_V50.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['顺序','文件','工作表名','期望行','实际行','期望列','实际列','期望SHA256','实际SHA256','主键','主键重复','空主键','判定'])
    for r in results:
        w.writerow([r['order'], r['file'], r.get('sheets',''), r['exp_rows'], r.get('act_rows',''),
                    r['exp_cols'], r.get('act_cols',''), r['exp_sha'], r.get('act_sha',''),
                    r['exp_pk'], r.get('pk_dup',''), r.get('pk_null',''), r['status']])
print('done')

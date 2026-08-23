# -*- coding: utf-8 -*-
# A02/P0 步骤1-2：从只读镜像复制限定小样，生成4张P0样本表+本地对账基线
# 样本：TUR（数据完整）、NGA（储备全缺）、ZWE（fx缺20/24月、cpi全缺）；窗口2024-01..2025-12连续24个月
import os, sys, csv
sys.path.insert(0, r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A00")
from xlsx_min import Xlsx
from datetime import date, timedelta
import zipfile
from xml.sax.saxutils import escape

BASE = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\01_输入只读镜像\D0-D12_数据交付_V4.2\data\smartbi"
P0 = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\P0"
os.makedirs(P0, exist_ok=True)
EPOCH = date(1899, 12, 30)
ISOS = ['TUR', 'NGA', 'ZWE']
YMS = [(2024, m) for m in range(1, 13)] + [(2025, m) for m in range(1, 13)]

# 带日期格式的xlsx写入：date_cols中的列按Excel日期格式写出（numFmt yyyy-mm-dd）
def write_xlsx_dates(path, header, data_rows, date_cols=()):
    def col(n):
        s = ""
        while n > 0:
            n, r = divmod(n - 1, 26); s = chr(65 + r) + s
        return s
    def cell(ri, ci, v):
        ref = f"{col(ci)}{ri}"
        if v is None or v == '': return ''
        name = header[ci-1]
        if ri > 1 and name in date_cols:
            return f'<c r="{ref}" s="1"><v>{v}</v></c>'
        if ri > 1 and isinstance(v, str):
            try:
                num = float(v)
                if num == int(num) and abs(num) < 1e15:
                    return f'<c r="{ref}"><v>{int(num)}</v></c>'
                return f'<c r="{ref}"><v>{num!r}</v></c>'
            except ValueError:
                pass
        if ri > 1 and isinstance(v, (int, float)) and not isinstance(v, bool):
            return f'<c r="{ref}"><v>{v!r}</v></c>'
        return f'<c r="{ref}" t="inlineStr"><is><t xml:space="preserve">{escape(str(v))}</t></is></c>'
    srs = []
    for ri, row in enumerate([header] + data_rows, 1):
        srs.append(f'<row r="{ri}">' + ''.join(cell(ri, ci, v) for ci, v in enumerate(row, 1)) + '</row>')
    sheet = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
             '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
             + ''.join(srs) + '</sheetData></worksheet>')
    styles = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
              '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
              '<numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts>'
              '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>'
              '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>'
              '<borders count="1"><border/></borders>'
              '<cellStyleXfs count="1"><xf numFmtId="0"/></cellStyleXfs>'
              '<cellXfs count="2"><xf numFmtId="0"/><xf numFmtId="164" applyNumberFormat="1"/></cellXfs>'
              '</styleSheet>')
    wb = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
          'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
          '<sheets><sheet name="data" sheetId="1" r:id="rId1"/></sheets></workbook>')
    rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
    wb_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
               '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
               '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
               '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
    ct = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
          '<Default Extension="xml" ContentType="application/xml"/>'
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
          '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
          '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>')
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", ct); z.writestr("_rels/.rels", rels)
        z.writestr("xl/workbook.xml", wb); z.writestr("xl/_rels/workbook.xml.rels", wb_rels)
        z.writestr("xl/worksheets/sheet1.xml", sheet); z.writestr("xl/styles.xml", styles)

def load(fn):
    x = Xlsx(os.path.join(BASE, fn))
    rows = list(x.iter_rows('data'))
    return rows[0], {c: i for i, c in enumerate(rows[0])}, rows[1:]

def ym(serial):
    d = EPOCH + timedelta(days=int(float(serial)))
    return (d.year, d.month)

# ---- 1) P0_dim_country：3国 ----
hdr, ix, rows = load('dim_country.xlsx')
s1 = [r for r in rows if r[ix['iso3']] in ISOS]
s1.sort(key=lambda r: ISOS.index(r[ix['iso3']]))
write_xlsx_dates(os.path.join(P0, 'P0_XH202612_V50_dim_country.xlsx'), hdr, s1)
print('P0_dim_country:', len(s1), '行')

# ---- 2) P0_dim_date：24个月 ----
hdr, ix, rows = load('dim_date.xlsx')
s2 = [r for r in rows if ym(r[ix['month_end']]) in YMS]
s2.sort(key=lambda r: float(r[ix['month_end']]))
write_xlsx_dates(os.path.join(P0, 'P0_XH202612_V50_dim_date.xlsx'), hdr, s2, date_cols=('month_end',))
print('P0_dim_date:', len(s2), '行')

# ---- 3) P0_country_monthly_risk：3国×24月=72 ----
hdr, ix, rows = load('country_monthly_risk.xlsx')
s3 = [r for r in rows if r[ix['iso3']] in ISOS and ym(r[ix['month_end']]) in YMS]
s3.sort(key=lambda r: (ISOS.index(r[ix['iso3']]), float(r[ix['month_end']])))
write_xlsx_dates(os.path.join(P0, 'P0_XH202612_V50_country_monthly_risk.xlsx'), hdr, s3, date_cols=('month_end',))
print('P0_country_monthly_risk:', len(s3), '行')
# 缺失基线（必须保持为空的单元格）
miss_base = []
for r in s3:
    d = (EPOCH + timedelta(days=int(float(r[ix['month_end']])))).isoformat()
    for c in hdr:
        if r[ix[c]] == '':
            miss_base.append([r[ix['iso3']], d, c])
print('缺失单元格基线数:', len(miss_base))
with open(os.path.join(P0, 'P0_MISSING_BASELINE.csv'), 'w', encoding='utf-8-sig', newline='') as fp:
    w = csv.writer(fp); w.writerow(['iso3','month_end','字段'])
    w.writerows(miss_base)

# ---- 4) P0_global_cycle_month：GLOBAL×24月 ----
hdr, ix, rows = load('global_cycle_month.xlsx')
s4 = [r for r in rows if ym(r[ix['month_end']]) in YMS]
s4.sort(key=lambda r: float(r[ix['month_end']]))
write_xlsx_dates(os.path.join(P0, 'P0_XH202612_V50_global_cycle_month.xlsx'), hdr, s4, date_cols=('month_end','property_observation_date'))
print('P0_global_cycle_month:', len(s4), '行')

# ---- 图表基线值（KPI与折线对账用） ----
# KPI: 不同国家数=3；折线1: fx_avg_lcu_per_usd×month（3国）；折线2: 全球cpi_yoy×month
_, i3x, _ = load('country_monthly_risk.xlsx')
_, i4x, _ = load('global_cycle_month.xlsx')
with open(os.path.join(P0, 'P0_CHART_BASELINE.csv'), 'w', encoding='utf-8-sig', newline='') as fp:
    w = csv.writer(fp)
    w.writerow(['图表','系列','month_end','基线值'])
    w.writerow(['KPI','不同国家数(distinct iso3)','', 3])
    for r in s3:
        d = (EPOCH + timedelta(days=int(float(r[i3x['month_end']])))).isoformat()
        v = r[i3x['fx_avg_lcu_per_usd']]
        w.writerow(['折线1_fx_avg_lcu_per_usd', r[i3x['iso3']], d, v])  # 空值照样写空，平台端也必须空
    for r in s4:
        d = (EPOCH + timedelta(days=int(float(r[i4x['month_end']])))).isoformat()
        w.writerow(['折线2_全球cpi_yoy', 'GLOBAL', d, r[i4x['cpi_yoy']]])
print('图表基线已写: KPI=3, 折线1=72点(含空), 折线2=24点')

"""Read-only source profile and comparison with captured Smartbi DOM evidence."""
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import json
import sys
import openpyxl

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
SOURCE = ROOT / 'A_数据平台/01_输入只读镜像/D0-D12_数据交付_V4.2/data/smartbi/country_monthly_risk.xlsx'
wb = openpyxl.load_workbook(SOURCE, read_only=True, data_only=True)
ws = wb.active
rows = list(ws.iter_rows(values_only=True))
header = rows[0]
ci = header.index('cpi_index')
iso = header.index('iso3')
dt = header.index('month_end')
valid = [r for r in rows[1:] if r[ci] is not None]
values = [Decimal(str(r[ci])) for r in valid]
lex_row = max(valid, key=lambda r: str(r[ci]))
num_row = max(valid, key=lambda r: Decimal(str(r[ci])))
display = lambda v: format(v.quantize(Decimal('.01'), rounding=ROUND_HALF_UP), ',.2f')
expected = {'SUM':sum(values),'AVG':sum(values)/len(values),'MAX':max(values)}
observed = {'SUM':'2,862,057.90','AVG':'375.80','MAX':'993.56'}
files = {'SUM':'01_SUM_PLATFORM.txt','AVG':'02_AVG_PLATFORM.txt','MAX':'04_MAX_PLATFORM.txt'}
for metric, file in files.items():
    assert observed[metric] in (HERE / file).read_text(encoding='utf-8')
report = {
    'source':str(SOURCE.relative_to(ROOT)),
    'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'grain':'iso3 + month_end; no joins, no filters, no fill-zero, no DISTINCT',
    'rows':len(rows)-1,'nonNull':len(valid),'null':len(rows)-1-len(valid),
    'comparison':[{'metric':m,'sourceExact':str(expected[m]),'sourceDisplay2dp':display(expected[m]),'platformDisplay':observed[m],'matchesAt2dp':display(expected[m])==observed[m],'evidence':files[m]} for m in expected],
    'lexicographicMax':{'value':str(lex_row[ci]),'iso3':lex_row[iso],'month_end':str(lex_row[dt]),'display2dp':display(Decimal(str(lex_row[ci])))},
    'numericMax':{'value':str(num_row[ci]),'iso3':num_row[iso],'month_end':str(num_row[dt])},
    'scope':'Native indicator card, source cpi_index copied to a temporary measure. No formal model or source modification. UI displays two decimal places; no claim of full precision equality.',
    'status':'FAIL_MAX_PENDING_REPAIR'
}
wb.close()
print(json.dumps(report,ensure_ascii=False,indent=2))
if '--write' in sys.argv:
    (HERE / 'SOURCE_COMPARISON.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')

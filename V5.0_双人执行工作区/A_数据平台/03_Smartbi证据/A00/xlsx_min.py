# -*- coding: utf-8 -*-
# 最小xlsx读取器：列工作表名、按行读出单元格值（支持sharedStrings/inlineStr/数字）
import zipfile, re
import xml.etree.ElementTree as ET

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
RNS = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'

def col_to_idx(ref):
    m = re.match(r'([A-Z]+)', ref)
    s = m.group(1); n = 0
    for ch in s: n = n*26 + (ord(ch)-64)
    return n-1

class Xlsx:
    def __init__(self, path):
        self.z = zipfile.ZipFile(path)
        wb = ET.fromstring(self.z.read('xl/workbook.xml'))
        rels = ET.fromstring(self.z.read('xl/_rels/workbook.xml.rels'))
        rid2t = {}
        for r in rels:
            rid2t[r.get('Id')] = r.get('Target')
        self.sheets = {}  # name -> sheet xml path
        for s in wb.find(NS+'sheets'):
            t = rid2t[s.get(RNS+'id')].lstrip('/')
            if not t.startswith('xl/'): t = 'xl/' + t
            self.sheets[s.get('name')] = t
        self.shared = []
        if 'xl/sharedStrings.xml' in self.z.namelist():
            root = ET.fromstring(self.z.read('xl/sharedStrings.xml'))
            for si in root:
                text = ''.join(t.text or '' for t in si.iter(NS+'t'))
                self.shared.append(text)

    def sheet_names(self):
        return list(self.sheets.keys())

    def iter_rows(self, name):
        """yield list-of-str per row (按列对齐，缺失列补空串)"""
        path = self.sheets[name]
        f = self.z.open(path)
        for ev, elem in ET.iterparse(f, events=('end',)):
            if elem.tag == NS+'row':
                cells = {}
                maxc = -1
                for c in elem:
                    if c.tag != NS+'c': continue
                    idx = col_to_idx(c.get('r'))
                    t = c.get('t')
                    v = c.find(NS+'v')
                    if t == 's':
                        val = self.shared[int(v.text)] if v is not None and v.text is not None else ''
                    elif t == 'inlineStr':
                        is_el = c.find(NS+'is')
                        val = ''.join(x.text or '' for x in is_el.iter(NS+'t')) if is_el is not None else ''
                    else:
                        val = v.text if v is not None and v.text is not None else ''
                    cells[idx] = val
                    if idx > maxc: maxc = idx
                row = [cells.get(i, '') for i in range(maxc+1)]
                yield row
                elem.clear()

def read_all(path, sheet):
    x = Xlsx(path)
    return x.sheet_names(), list(x.iter_rows(sheet))

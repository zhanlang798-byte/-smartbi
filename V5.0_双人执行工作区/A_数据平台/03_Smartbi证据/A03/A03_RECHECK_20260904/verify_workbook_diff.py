"""Read-only verification against the pre-repair Git version; never writes files."""
import collections
import io
import json
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET
import zipfile

BASE_REV = "4f58689be10c17697133b3ff86962cd1130fe23f"
task_dir = Path(__file__).resolve().parent
workbook = task_dir.parent / "SMARTBI_TYPE_AUDIT_V50.xlsx"
repo = Path(subprocess.check_output(["git", "rev-parse", "--show-toplevel"], cwd=task_dir, text=True, encoding="utf-8").strip())
relative = workbook.relative_to(repo).as_posix()
old_bytes = subprocess.check_output(["git", "show", f"{BASE_REV}:{relative}"], cwd=repo)
ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def values(blob):
    with zipfile.ZipFile(io.BytesIO(blob)) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            strings = ["".join(item.itertext()) for item in root]
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        cells = {}
        for cell in sheet.findall(".//s:sheetData/s:row/s:c", ns):
            ref, kind = cell.attrib["r"], cell.attrib.get("t")
            value = cell.find("s:v", ns)
            text = value.text if value is not None else None
            if kind == "s":
                text = strings[int(text)]
            elif kind == "inlineStr":
                inline = cell.find("s:is", ns)
                text = "".join(inline.itertext()) if inline is not None else None
            formula = cell.find("s:f", ns)
            if text is not None or formula is not None:
                cells[ref] = (text, formula.text if formula is not None else None)
        return cells, sorted(archive.namelist())


old, old_parts = values(old_bytes)
new, new_parts = values(workbook.read_bytes())
changes = sorted(ref for ref in old.keys() | new.keys() if old.get(ref) != new.get(ref))
expected = sorted(f"{col}{row}" for row in [96, 97, 136, 179] for col in ["E", "F"])
assert changes == expected, f"Unexpected changed cells: {changes}"
assert old_parts == new_parts, "Workbook ZIP part inventory changed"
for row in [96, 97, 136, 179]:
    assert old[f"E{row}"][0] == "FAIL" and new[f"E{row}"][0] == "PASS"
    assert new[f"C{row}"][0] == "布尔" and new[f"D{row}"][0] == "字符串"
counts = collections.Counter(v[0] for ref, v in new.items() if ref.startswith("E") and ref[1:].isdigit() and ref != "E1")
assert counts == {"PASS": 383, "FAIL": 59}, counts
print(json.dumps({"result": "PASS", "scope": "workbook values and package inventory only; not platform acceptance", "baselineCommit": BASE_REV, "changedCells": changes, "typeCounts": counts, "unchangedOtherValues": True, "unchangedZipPartInventory": True}, ensure_ascii=False, indent=2))

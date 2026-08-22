# -*- coding: utf-8 -*-
# A00 步骤2-3：只提取Smartbi目录与周期规则到只读镜像，排除__MACOSX/._/.DS_Store等
# 只读源ZIP，不解压任何其他目录；zipfile读取时自动校验CRC。
import zipfile, os, json, hashlib

SRC = r"C:\Users\33625\Desktop\数据创新平台-张奥.zip"
MIRROR = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\01_输入只读镜像"
EVID = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\A00"

def dec(n):
    raw = n.encode('cp437')
    for enc in ('utf-8', 'gbk'):
        try: return raw.decode(enc)
        except Exception: pass
    return n

def is_junk(d):
    parts = d.split('/')
    for p in parts:
        if p == '__MACOSX' or p.startswith('._') or p == '.DS_Store' or p in ('.venv','node_modules'):
            return True
    return False

# 允许提取的前缀（顶级目录 数据创新平台-张奥/ 剥掉，镜像根直接放 D0-D12_数据交付_V4.2）
ALLOW = [
    "数据创新平台-张奥/D0-D12_数据交付_V4.2/data/smartbi/",
    "数据创新平台-张奥/D0-D12_数据交付_V4.2/config/global_cycle_rules_v41.yaml",
]

z = zipfile.ZipFile(SRC)
extracted, ignored_in_scope = [], []
for i in z.infolist():
    d = dec(i.filename)
    if i.is_dir():
        continue
    in_scope = any(d.startswith(a) for a in ALLOW)
    if not in_scope:
        continue
    if is_junk(d):
        ignored_in_scope.append(d)
        continue
    rel = d[len("数据创新平台-张奥/"):]
    dst = os.path.join(MIRROR, *rel.split('/'))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    data = z.read(i)  # CRC自动校验
    with open(dst, 'wb') as f:
        f.write(data)
    sha = hashlib.sha256(data).hexdigest()
    extracted.append({"rel": rel, "bytes": len(data), "sha256": sha})

extracted.sort(key=lambda x: x["rel"])
os.makedirs(EVID, exist_ok=True)
with open(os.path.join(EVID, "A00_extract_manifest.json"), "w", encoding="utf-8") as f:
    json.dump({"extracted": extracted, "ignored_in_scope": ignored_in_scope}, f, ensure_ascii=False, indent=1)

print("extracted files:", len(extracted))
for e in extracted: print(" ", e["bytes"], e["rel"])
print("ignored junk in scope:", len(ignored_in_scope))
for d in ignored_in_scope: print("  [忽略]", d)

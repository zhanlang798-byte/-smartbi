# -*- coding: utf-8 -*-
"""
提交包守门员（执行者B · 8/31 B06 封包用）
功能：
  1) 凭据扫描：逐文件匹配凭据模式（红线9：凭据进提交包=硬失败）→ CREDENTIAL_SCAN_<日期>.md
     0 命中才可封包；报告本身就是"凭据扫描0命中记录"必交物
  2) SHA-256 清单：全文件哈希 → SUBMISSION_MANIFEST_V50_<日期>.csv（提交清单骨架）
用法：
    python3 submission_guard.py --dir <提交包目录>
    python3 submission_guard.py --dir <提交包目录> --out <报告输出目录>
退出码：0=扫描0命中；2=有命中（硬失败，不得封包）
"""
import argparse, hashlib, re, sys
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE = Path(__file__).resolve().parents[2]
OUT_DEFAULT = BASE / "B_AI交付" / "05_工具脚本" / "guard_out"

# 凭据模式（名称, 正则）
PATTERNS = [
    ("GitHub Token", r"\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}"),
    ("OpenAI风格Key", r"\bsk-[A-Za-z0-9_-]{20,}"),
    ("AWS AccessKey", r"\bAKIA[0-9A-Z]{16}\b"),
    ("私钥块", r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    ("密码赋值", r"(?i)(password|passwd|pwd)\s*[:=]\s*[\"']?\S{6,}"),
    ("密钥/令牌赋值", r"(?i)(secret|token|api[_-]?key|access[_-]?key|secret[_-]?key)\s*[:=]\s*[\"']?[A-Za-z0-9_\-+/=]{8,}"),
    ("HTTP授权头", r"(?i)authorization\s*[:=]\s*(bearer|basic)\s+\S+"),
    ("Cookie赋值", r"(?i)\bcookie\s*[:=]\s*\S{8,}"),
]
TEXT_EXT = {".md", ".txt", ".csv", ".py", ".json", ".yaml", ".yml", ".tex", ".mmd",
            ".html", ".xml", ".log", ".js", ".ts", ".ini", ".cfg", ".toml", ".sql", ".sh"}
SKIP_DIRS = {".git", "node_modules", "__pycache__", "guard_out", "b00_out"}  # 输出目录不滚入下次扫描
SELF_NAMES = {"submission_guard.py"}  # 脚本自身含模式串，排除


def mask(s, head=4, tail=2):
    return s if len(s) <= head + tail else s[:head] + "***" + s[-tail:]


def scan_file(path, hits):
    """文本扫描；xlsx 读单元格文本；其余跳过"""
    ext = path.suffix.lower()
    lines = []
    if ext in TEXT_EXT:
        try:
            lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
        except Exception:
            return
    elif ext == ".xlsx":
        try:
            import pandas as pd
            xl = pd.ExcelFile(path)
            for sh in xl.sheet_names:
                df = xl.parse(sh, dtype=str)
                for r, row in enumerate(df.fillna("").astype(str).values, 1):
                    lines.append(f"[{sh}#{r}] " + " | ".join(row))
        except Exception:
            return
    else:
        return
    for ln, line in enumerate(lines, 1):
        for name, pat in PATTERNS:
            for m in re.finditer(pat, line):
                hits.append({"文件": str(path), "行": ln, "模式": name, "片段": mask(m.group(0))})


def sha256_of(path, chunk=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            b = f.read(chunk)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True, help="待扫描的提交包目录")
    ap.add_argument("--out", default=str(OUT_DEFAULT))
    args = ap.parse_args()
    target, outdir = Path(args.dir).resolve(), Path(args.out).resolve()
    if not target.exists():
        print(f"目录不存在：{target}"); return 2
    outdir.mkdir(parents=True, exist_ok=True)
    date = datetime.now().strftime("%Y%m%d")

    # ---- 1. 凭据扫描 ----
    hits, files = [], []
    for p in sorted(target.rglob("*")):
        if p.is_dir() or p.name in SELF_NAMES:
            continue
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        files.append(p)
        scan_file(p, hits)

    scan_md = outdir / f"CREDENTIAL_SCAN_{date}.md"
    with open(scan_md, "w", encoding="utf-8") as f:
        f.write(f"# 凭据扫描记录（{datetime.now():%Y-%m-%d %H:%M}）\n\n")
        f.write(f"- 扫描目录：{target}\n- 扫描文件数：{len(files)}\n")
        f.write(f"- 模式数：{len(PATTERNS)}（GitHub/OpenAI/AWS Token、私钥块、密码/密钥/令牌赋值、授权头、Cookie）\n")
        f.write(f"- 命中数：**{len(hits)}**\n\n")
        if hits:
            f.write("| 文件 | 行 | 模式 | 片段(遮蔽) |\n|---|---|---|---|\n")
            for h in hits:
                f.write(f"| {h['文件']} | {h['行']} | {h['模式']} | `{h['片段']}` |\n")
            f.write("\n> 判定：**FAIL（硬失败）**——清除凭据并换密钥后重扫，0命中才可封包。\n")
        else:
            f.write("> 判定：**PASS（0命中）**——本记录可作为提交包「凭据扫描0命中」必交物。\n")

    # ---- 2. SHA-256 清单 ----
    import csv
    man_csv = outdir / f"SUBMISSION_MANIFEST_V50_{date}.csv"
    with open(man_csv, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["相对路径", "大小(字节)", "SHA-256"])
        for p in files:
            w.writerow([str(p.relative_to(target)), p.stat().st_size, sha256_of(p)])

    print("=" * 60)
    print(f"提交包守门员 | {datetime.now():%Y-%m-%d %H:%M}")
    print(f"扫描目录：{target} | 文件数 {len(files)}")
    print(f"凭据命中：{len(hits)} -> {'FAIL（硬失败，不得封包）' if hits else 'PASS（0命中）'}")
    for h in hits[:20]:
        print(f"  !! {h['文件']}:{h['行']} [{h['模式']}] {h['片段']}")
    print(f"已输出：{scan_md}")
    print(f"已输出：{man_csv}")
    return 2 if hits else 0


if __name__ == "__main__":
    sys.exit(main())

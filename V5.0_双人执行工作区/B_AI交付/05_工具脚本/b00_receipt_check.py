# -*- coding: utf-8 -*-
"""
B00 签收自动核对脚本（执行者B · G2 模型冻结用）
用法：
    python3 b00_receipt_check.py                      # 默认路径（本工作区）
    python3 b00_receipt_check.py --handoff-dir <A04交接包目录>
输出：
    1) 控制台逐项 PASS/FAIL
    2) B00_RECEIPT_CHECK_<日期>.md（可贴进共享区签收记录）
    3) B00_DIFF_<日期>.csv（差异表，无差异则为空表头）
说明：
    - 9件材料/表合同/行数：核对 A04 交接包文件（交接包未到位时如实报缺，不猜）
    - 真实边界：始终用本地只读镜像 + A01 正式MVP表独立亲核（不等交接包）
    - Smartbi 平台内的字段/关系/指标：脚本无法触达，读取已归档记录并生成人工复核清单
"""
import argparse, sys, json
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# ===== 路径配置：从脚本位置自动定位 V5.0_双人执行工作区 =====
BASE = Path(__file__).resolve().parents[2]
DEFAULT_HANDOFF = BASE / "00_共享" / "模型交接"
SRC = BASE / "A_数据平台" / "01_输入只读镜像" / "D0-D12_数据交付_V4.2" / "data" / "smartbi"
MVP = BASE / "A_数据平台" / "02_MVP辅助表"
OUT_DEFAULT = BASE / "B_AI交付" / "05_工具脚本" / "b00_out"
ACCOUNT_RECORD = BASE / "B_AI交付" / "01_模型接收" / "B00_READONLY_TEST_V50.txt"
FIELD_AUDIT = BASE / "B_AI交付" / "01_模型接收" / "B00_SMARTBI_FIELD_AUDIT_20260825.md"

EXPECTED_FILES = [
    "MODEL_HANDOFF_V50.txt", "TABLE_CONTRACT_V50.xlsx", "FIELD_DICTIONARY_V50.xlsx",
    "RELATIONSHIP_MAP_V50.xlsx", "RELATIONSHIP_AUDIT_V50.xlsx", "METRIC_DICTIONARY_V50.xlsx",
    "KNOWN_GAPS_V50.txt", "MODEL_CHANGELOG_V50.txt",
]
EXPECTED_TOTAL_ROWS = 313_593
EXPECTED_AUX = {"MVP_country_latest": 40, "MVP_company_data_status": 20, "MVP_cycle_state": 660}

results, diffs = [], []

def ck(name, ok=None, detail="", status=None):
    status = status or ("PASS" if ok else "FAIL")
    if status not in {"PASS", "FAIL", "BLOCKED"}:
        raise ValueError(f"未知状态：{status}")
    results.append((name, status, detail))
    if status != "PASS":
        diffs.append({"检查项": name, "状态": status, "差异": detail})

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--handoff-dir", default=str(DEFAULT_HANDOFF))
    ap.add_argument("--out-dir", default=str(OUT_DEFAULT))
    args = ap.parse_args()
    handoff, outdir = Path(args.handoff_dir), Path(args.out_dir)
    outdir.mkdir(parents=True, exist_ok=True)

    import pandas as pd

    print("=" * 60)
    print("B00 签收自动核对 | " + datetime.now().strftime("%Y-%m-%d %H:%M"))
    print("=" * 60)

    # ---- 1. 9件材料齐全性 ----
    print("\n[1] 交接材料齐全性（9件）")
    if not handoff.exists():
        ck("交接包目录存在", detail=f"未到位：{handoff}", status="BLOCKED")
    else:
        ck("交接包目录存在", True, str(handoff))
        for f in EXPECTED_FILES:
            present = (handoff / f).exists()
            ck(f"材料 {f}", present, "在" if present else "缺失", None if present else "BLOCKED")
        account_ok = ACCOUNT_RECORD.exists() and FIELD_AUDIT.exists()
        if account_ok:
            account_text = ACCOUNT_RECORD.read_text(encoding="utf-8")
            field_text = FIELD_AUDIT.read_text(encoding="utf-8")
            account_ok = "既定运行前提" in account_text and "27/27 可见" in field_text
        ck(
            "共用账号口径与27字段核对记录",
            account_ok,
            "A/B共用账号为既定前提；27/27字段树可见；B已审核确认（2026-08-25）" if account_ok else "记录缺失或口径不完整",
            None if account_ok else "BLOCKED",
        )

    # ---- 2. 表合同：18+3表、行数 ----
    print("\n[2] 表合同（TABLE_CONTRACT_V50.xlsx）")
    tc = handoff / "TABLE_CONTRACT_V50.xlsx"
    if tc.exists():
        try:
            df = pd.read_excel(tc, sheet_name="表合同", header=4)
            cols = {c.lower(): c for c in df.columns}
            rowcol = next((cols[c] for c in cols if "行" in c or "row" in c), None)
            namecol = next((cols[c] for c in cols if "表" in c or "table" in c or "名" in c), None)
            categorycol = next((c for c in df.columns if "类别" in str(c)), None)
            if rowcol and categorycol:
                formal = df[df[categorycol].astype(str).str.contains("正式", na=False)]
            elif rowcol and namecol:
                aux_mask = df[namecol].astype(str).str.contains("MVP_country_latest|MVP_company_data_status|MVP_cycle_state", na=False)
                formal = df[~aux_mask]
            else:
                formal = pd.DataFrame()
            total = int(formal[rowcol].sum()) if rowcol and not formal.empty else -1
            ck("表合同行数合计=313,593", total == EXPECTED_TOTAL_ROWS, f"实算 {total:,}")
            ck("表合同正式表数=18", len(formal) == 18, f"实有 {len(formal)}")
            ck("表合同总表数=21（18+3）", len(df) == 21, f"实有 {len(df)}")
            for aux_name, exp_rows in EXPECTED_AUX.items():
                hit = df[df[namecol].astype(str).str.contains(aux_name, na=False)] if namecol else pd.DataFrame()
                ok = (not hit.empty) and int(hit.iloc[0][rowcol]) == exp_rows
                ck(f"辅助表 {aux_name}={exp_rows}行", ok, "未找到或行数不符" if not ok else "")
        except Exception as e:
            ck("表合同可解析", False, str(e))
    else:
        ck("表合同文件", detail="未到位，跳过（交接后重跑）", status="BLOCKED")

    # ---- 3. 真实边界亲核（本地数据，始终可跑） ----
    print("\n[3] 真实边界亲核（本地只读镜像 + A01正式MVP表）")
    coe = pd.read_excel(SRC / "company_overseas_exposure.xlsx")
    bcg = pd.read_excel(SRC / "bridge_company_geography.xlsx")
    his = pd.read_excel(SRC / "historical_crisis_event.xlsx")
    m1 = pd.read_excel(MVP / "MVP_country_latest.xlsx")
    m2 = pd.read_excel(MVP / "MVP_company_data_status.xlsx")
    m3 = pd.read_excel(MVP / "MVP_cycle_state.xlsx")

    gl = coe["geography_level"].value_counts().to_dict() if "geography_level" in coe.columns else {}
    ck("企业 168=160 global+8 region", len(coe) == 168 and gl.get("global") == 160 and gl.get("region") == 8,
       f"168={len(coe)}, global={gl.get('global')}, region={gl.get('region')}")
    ck("国家桥=0（bridge全region且iso3空）", (bcg["geography_level"] == "region").all() and bcg["iso3"].isna().all(),
       f"{len(bcg)}行")
    rev3 = coe[["total_revenue", "overseas_revenue", "overseas_revenue_share"]].notna().sum().sum()
    ck("海外收入三字段可用值=0", rev3 == 0, f"非空 {rev3}")
    ck("历史18条 1970/pending/评级空", len(his) == 18 and (his["start_date"].astype(str).str[:10] == "1970-01-01").all()
       and (his["review_status"] == "pending").all() and his["comparability_grade"].isna().all(),
       f"{len(his)}条")
    idcol = "historical_event_id" if "historical_event_id" in his.columns else "event_id"
    mba = his.set_index(idcol)["modern_backtest_allowed"].to_dict() if idcol in his.columns else {}
    ck("HIST001/002/018 modern_backtest_allowed=0",
       all(mba.get(k) == 0 for k in ["HIST001", "HIST002", "HIST018"]),
       str({k: mba.get(k) for k in ["HIST001", "HIST002", "HIST018"]}))
    ck("MVP三表行数 40/20/660", len(m1) == 40 and len(m2) == 20 and len(m3) == 660,
       f"{len(m1)}/{len(m2)}/{len(m3)}")
    vc = m1["trigger_label"].value_counts().to_dict()
    ck("触发分布 双2/单4/未触发34/不足0",
       vc.get("双触发") == 2 and vc.get("单触发") == 4 and vc.get("未触发") == 34 and vc.get("数据不足", 0) == 0, str(vc))

    # ---- 4. 人工检查清单（脚本无法触达） ----
    manual = [
        (True, "A/B共用同一Smartbi账号为项目既定前提；B不修改A对象属于职责纪律；B已确认"),
        (True, "Smartbi共享模型字段树27/27可见记录已归档；B已审核确认（2026-08-25）"),
        (False, "RELATIONSHIP_MAP：维度→事实单向、无事实-事实多对多、地区桥不连国家（肉眼核）"),
        (False, "RELATIONSHIP_AUDIT：每条关系前后事实行数不膨胀（肉眼核）"),
        (False, "METRIC_DICTIONARY：DB03/05/06 所需指标逐项在列（对照三页线框字段）"),
        (True, "KNOWN_GAPS / MODEL_CHANGELOG：B已阅读确认（2026-08-25）"),
    ]

    # ---- 汇总输出 ----
    counts = {s: sum(1 for _, status, _ in results if status == s) for s in ("PASS", "FAIL", "BLOCKED")}
    print("\n" + "=" * 60)
    for name, s, d in results:
        print(f"  {s:4s}  {name}" + (f"  | {d}" if d else ""))
    print("=" * 60)
    print(f"合计 {len(results)} 项：PASS {counts['PASS']} / FAIL {counts['FAIL']} / BLOCKED {counts['BLOCKED']}")

    date = datetime.now().strftime("%Y%m%d")
    md = outdir / f"B00_RECEIPT_CHECK_{date}.md"
    with open(md, "w", encoding="utf-8") as f:
        f.write(f"# B00 签收自动核对结果（{datetime.now():%Y-%m-%d %H:%M}）\n\n")
        f.write(f"- 交接包目录：{handoff}\n- 合计 {len(results)} 项：PASS {counts['PASS']} / FAIL {counts['FAIL']} / BLOCKED {counts['BLOCKED']}\n\n")
        f.write("## 逐项\n\n| 检查项 | 判定 | 说明 |\n|---|---|---|\n")
        for name, s, d in results:
            f.write(f"| {name} | {s} | {d} |\n")
        f.write("\n## 需人工完成（脚本无法触达）\n\n")
        for i, (done, m) in enumerate(manual, 1):
            f.write(f"{i}. [{'x' if done else ' '}] {m}\n")
        f.write("\n> 签收规则：任何 FAIL = 不签收，写问题单退回；BLOCKED（交接未到位）不记 FAIL。\n")
    pd.DataFrame(diffs, columns=["检查项", "状态", "差异"]).to_csv(outdir / f"B00_DIFF_{date}.csv", index=False, encoding="utf-8-sig")
    print(f"\n已输出：{md}\n已输出：{outdir / ('B00_DIFF_' + date + '.csv')}")
    if counts["FAIL"]:
        return 2
    return 3 if counts["BLOCKED"] else 0

if __name__ == "__main__":
    sys.exit(main())

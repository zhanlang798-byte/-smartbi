# -*- coding: utf-8 -*-
"""
02_build_source_registry_seed.py — D2 第一步：导入 688 项归档交叉表，生成正式 source_registry 种子。
本脚本不做任何新下载；新增下载仅在正式字段仍缺来源时按 G1 执行。run_id=20260817_v42。
"""
import hashlib, json, datetime, pathlib, sys
import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROJ = ROOT.parent
REG_JSONL = PROJ/"调研资料归档_V1.1"/"00_交接入口"/"source_action_registry_V1.1.jsonl"
CROSS_CSV = PROJ/"00_当前项目交接_V4.2"/"SOURCE_REUSE_CROSSWALK_V4.2.csv"
STG, CUR, QA = ROOT/"data"/"staging", ROOT/"data"/"curated", ROOT/"data"/"qa"
RUN_ID = "20260817_v42"
ARCHIVE_RUN = "20260816_research_archive_v1"

REUSE_MAP = [
    (lambda s: s["formal_use_state_x"] == "CORE", "direct_reuse"),
    (lambda s: s["formal_use_state_x"] == "SUPPLEMENT", "direct_reuse_supplement"),
    (lambda s: s["formal_use_state_x"] == "EXCLUDED", "excluded"),
    (lambda s: s["old_download_status"] == "PAYWALL_OR_AUTH", "metadata_only_license"),
    (lambda s: s["old_download_status"] in ("BROKEN_OR_UNREACHABLE", "FETCH_FAILED"), "use_replacement"),
    (lambda s: s["old_download_status"] == "MANUAL_ACTION_REQUIRED", "manual_action_required"),
    (lambda s: s["old_download_status"] == "METADATA_ONLY_LICENSE", "metadata_only_license"),
    (lambda s: s["old_download_status"] == "DUPLICATE_CONTENT", "use_canonical_duplicate"),
]

def main():
    reg = pd.read_json(REG_JSONL, lines=True)
    cross = pd.read_csv(CROSS_CSV, encoding="utf-8-sig")
    assert len(reg) == 688, f"jsonl 行数 {len(reg)} != 688"
    assert len(cross) == 688, f"crosswalk 行数 {len(cross)} != 688"

    m = reg.merge(cross, left_on="asset_id", right_on="archive_asset_id", how="outer", indicator=True)
    conflicts = m[m["_merge"] != "both"]
    state_mismatch = m[(m["_merge"] == "both") &
                       ((m["formal_use_state_x"] != m["formal_use_state_y"]) |
                        (m["acquisition_state_x"] != m["acquisition_state_y"]) |
                        (m["content_state_x"] != m["content_state_y"]) |
                        (m["extraction_state_x"] != m["extraction_state_y"]))]
    key_conflicts = pd.concat([conflicts, state_mismatch]).drop_duplicates(subset=["asset_id"])

    base = m[m["_merge"] == "both"].copy().sort_values("asset_id").reset_index(drop=True)
    base["source_id"] = [f"SRC{i+1:04d}" for i in range(len(base))]

    def reuse(row):
        for cond, label in REUSE_MAP:
            if cond(row):
                return label
        return "metadata_only_license"
    base["reuse_status"] = base.apply(reuse, axis=1)
    base["archive_run_id"] = ARCHIVE_RUN
    base["redistribution_allowed"] = base["redistribution_scope_x"] == "shared"
    LICENSE_TXT = {"shared": "公开共享许可,原件可随提交包再分发",
                   "private_only": "仅限项目内部使用,不随提交包再分发",
                   "metadata_only": "仅题录可用,正文不再分发"}
    base["license"] = base["redistribution_scope_x"].map(LICENSE_TXT).fillna("unknown")
    base["alternative_source_id"] = base["replacement_source_x"].fillna("")
    base["alternative_reason"] = base.apply(
        lambda r: (r["failure_reason"] if str(r["failure_reason"] or "").strip()
                   else ("内容重复,使用规范资产" if r["old_download_status"] == "DUPLICATE_CONTENT" else ""))
        if str(r["replacement_source_x"] or "").strip() else "", axis=1)

    def qflag(r):
        if r["formal_use_state_x"] in ("CORE", "SUPPLEMENT"):
            return "review" if int(r["revalidation_required"]) == 1 else "pass"
        if r["formal_use_state_x"] == "EXCLUDED":
            return "reject"
        return "warn"
    base["quality_flag"] = base.apply(qflag, axis=1)

    out = pd.DataFrame({
        "source_id": base["source_id"],
        "archive_asset_id": base["asset_id"],
        "archive_run_id": base["archive_run_id"],
        "reuse_status": base["reuse_status"],
        "redistribution_scope": base["redistribution_scope_x"],
        "revalidation_required": base["revalidation_required"].astype(int),
        "publisher": base["publisher"].fillna(""),
        "dataset_name": base["title"].fillna(""),
        "source_url": base["preferred_endpoint"].fillna(""),
        "license": base["license"],
        "scope": base["data_usage"].fillna(""),
        "source_frequency": "",
        "coverage_start": "", "coverage_end": "", "publication_date": "",
        "fetch_timestamp": "", "data_version": "",
        "raw_file_name": base["raw_local_path_x"].fillna("").map(lambda p: pathlib.PurePath(p).name if p else ""),
        "raw_relative_path": base["raw_local_path_x"].fillna(""),
        "file_size_bytes": "", "sha256": "",
        "api_request_params": base["request_parameters"].fillna(""),
        "earliest_backtest_date": "",
        "data_class": base["content_type"].fillna(""),
        "is_proxy": 0, "proxy_reason": "",
        "alternative_source_id": base["alternative_source_id"],
        "alternative_reason": base["alternative_reason"],
        "access_restriction": base["old_download_status"].map({
            "PAYWALL_OR_AUTH": "受限", "MANUAL_ACTION_REQUIRED": "需接受条款",
            "METADATA_ONLY_LICENSE": "仅元数据"}).fillna("公开或本地"),
        "redistribution_allowed": base["redistribution_allowed"],
        "license_note": base["failure_reason"].fillna(""),
        "quality_tier": base["evidence_grade_x"].fillna(""),
        "owner_id": base["owner"].fillna(""),
        "acquisition_state": base["acquisition_state_x"],
        "content_state": base["content_state_x"],
        "extraction_state": base["extraction_state_x"],
        "formal_use_state": base["formal_use_state_x"],
        "target_table": base["target_table_x"].fillna(""),
        "smartbi_page": base["smartbi_page"].fillna(""),
        "next_action": base["next_action_x"].fillna(""),
        "quality_flag": base["quality_flag"],
        "run_id": RUN_ID,
    })

    # 验收断言
    assert out["archive_asset_id"].nunique() == 688 and out["source_id"].nunique() == 688
    assert not ((out["formal_use_state"] == "EXCLUDED") & out["reuse_status"].str.startswith("direct_reuse")).any()
    repl = out[out["alternative_source_id"] != ""]
    assert (repl["alternative_reason"] != "").all()
    assert (out["redistribution_scope"] != "").all(), "许可未知数必须为 0"

    for d in (STG, CUR, QA):
        d.mkdir(parents=True, exist_ok=True)
    base[["asset_id","source_id","reuse_status","formal_use_state_x","redistribution_scope_x",
          "revalidation_required"]].rename(columns={
        "formal_use_state_x":"formal_use_state","redistribution_scope_x":"redistribution_scope"}
    ).to_parquet(STG/"archive_source_crosswalk.parquet", index=False)
    with pd.ExcelWriter(CUR/"source_registry.xlsx", engine="openpyxl") as w:
        out.to_excel(w, sheet_name="data", index=False)

    summary = []
    for col in ["reuse_status","formal_use_state","redistribution_scope","quality_flag"]:
        for k, v in out[col].value_counts().items():
            summary.append({"dimension": col, "value": k, "count": int(v)})
    summary.append({"dimension": "total", "value": "archive_asset_id", "count": 688})
    summary.append({"dimension": "replacement_routes", "value": "replacement_source 非空", "count": len(repl)})
    secret = out[out["license_note"].str.contains("Cookie", na=False) | (out["reuse_status"] == "excluded")]
    with pd.ExcelWriter(QA/"archive_reuse_audit.xlsx", engine="openpyxl") as w:
        pd.DataFrame(summary).to_excel(w, sheet_name="summary", index=False)
        (key_conflicts if len(key_conflicts) else pd.DataFrame({"result": ["no conflicts"]})
         ).to_excel(w, sheet_name="conflicts", index=False)
        repl[["source_id","archive_asset_id","formal_use_state","alternative_source_id",
              "alternative_reason","next_action"]].to_excel(w, sheet_name="replacement_routes", index=False)

    pd.DataFrame(columns=["source_id","url","fetch_timestamp","http_status","file_size_bytes",
                          "sha256","retry_count","error_type","note"]
                 ).to_excel(QA/f"download_log_{RUN_ID}.xlsx", sheet_name="data", index=False)

    log = {"run_id": RUN_ID, "step": "D2-seed", "built_at": datetime.datetime.now().isoformat(timespec="seconds"),
           "note": "本轮无新增下载;新增下载仅在正式字段仍缺来源时按 G1 执行", "outputs": []}
    for p in [STG/"archive_source_crosswalk.parquet", CUR/"source_registry.xlsx",
              QA/"archive_reuse_audit.xlsx", QA/f"download_log_{RUN_ID}.xlsx"]:
        log["outputs"].append({"path": str(p.relative_to(ROOT)), "sha256": hashlib.sha256(p.read_bytes()).hexdigest()})
    (QA/"D2_build_log.json").write_text(json.dumps(log, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"source_registry 种子: {len(out)} 行;替代路由 {len(repl)} 项;冲突 {len(key_conflicts)} 项")
    print(out["reuse_status"].value_counts().to_string())

if __name__ == "__main__":
    main()

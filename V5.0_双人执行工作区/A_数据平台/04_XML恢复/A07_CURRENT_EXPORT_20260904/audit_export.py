"""Audit the native 2026-09-04 package without emitting raw XML or credentials.

Run locally with the controlled originals present. This is a configuration/
package check, NOT a live functionality, data accuracy, CPI, or restore test.
"""
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
RESTORE = HERE.parent
WORK = RESTORE.parents[1]
PACKAGE = RESTORE / "A07_PAGES_DB01_DB06_WITH_MODEL_20260904.xml"
EXPECTED_SHA = "c5b2cfbf2bcbef8aa277a1d0a5ab6f94dff07bef27168d00205d054d137ba51d"
BASELINE = WORK / "A_数据平台/03_Smartbi证据/A03/A03_CPI_REPAIR_PREFLIGHT_20260904/backups/migrate_CPI_AFTER_TRIAL_20260904.xml"
BASELINE_SHA = "688622fb50d69f04556685e060346964177402e1a15f7e95b2bf5348cd3c87eb"
MODEL_ID = "6b5dff57a4093ba3db07d2903905fe40"
MODEL_ALIAS = "MDL_XH202612_V50_COUNTRY_RESERVE"
PAGES = {
    "DB01": ("161b2c84aa6c738645e7256f75d2dc00", "DB01_XH202612_V50_RISK_OVERVIEW"),
    "DB02": ("12cbefc293d1f1cd6c76771772ede621", "DB02_XH202612_V50_COUNTRY_DRILL"),
    "DB03": ("96d3a52a55f6e16edb602fc2f6d13010", "DB03_XH202612_V50_COMPANY_BOUNDARY"),
    "DB04": ("2f546d06e3f70f0956ea8d5740e26a83", "DB04_XH202612_V50_LIQUIDITY_LAB"),
    "DB05": ("0e8d39f578a43c473088b8f7042e8331", "DB05_XH202612_V50_EVIDENCE_CENTER"),
    "DB06": ("684ef06176737964de2551a03de747e8", "DB06_XH202612_V50_CYCLE_CONTEXT"),
}
OLD = {
    "A07_PAGES_DB01_DB02_DB04_WITH_MODEL_20260831.xml": "e013a0695e0b97fd558bd90f870661bd6da2f2592b993226d4a177a54c0463c5",
    "A07_PAGES_DB03_DB05_DB06_WITH_MODEL_20260831.xml": "5b77efb3f93af4c6dbd3061261c221347bcb92761da577f1de3427c2ac5404a3",
}


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def xml_hash(node):
    return sha(ET.canonicalize(ET.tostring(node, encoding="unicode")).encode())


def json_hash(value):
    return sha(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode())


def checked_read(path, expected):
    raw = path.read_bytes()
    assert sha(raw) == expected, f"Input hash mismatch: {path.name}"
    root = ET.fromstring(raw)
    assert root.tag == "migrates"
    return raw, root


def main():
    raw, root = checked_read(PACKAGE, EXPECTED_SHA)
    _, baseline = checked_read(BASELINE, BASELINE_SHA)
    top = dict(Counter(n.tag for n in root))
    assert top == {"SMARTBIX_PAGE": 6, "AUGMENTED_DATASET": 1, "CUSTOM_ICONS": 1}, top
    model = root.find("AUGMENTED_DATASET")
    assert model.get("id") == MODEL_ID and model.get("alias") == MODEL_ALIAS
    baseline_model = baseline.find("AUGMENTED_DATASET")
    assert xml_hash(model) == xml_hash(baseline_model), "Model differs from held September 4 snapshot"
    definition = json.loads(model.findtext("define"))
    views = definition["views"]
    relations = definition["relationGraph"]["relations"]
    fields = model.findall("fields/field")
    assert len(views) == 22 and len({v["id"] for v in views}) == 22
    assert len(fields) == 460 and len({f.get("id") for f in fields}) == 460
    assert len(relations) == 19
    directions = dict(Counter(r["filterDirection"] for r in relations))
    assert directions == {"SINGLE": 18, "BOTH": 1}, directions

    old_pages = {}
    for name, digest in OLD.items():
        _, old_root = checked_read(RESTORE / name, digest)
        for page in old_root.findall("SMARTBIX_PAGE"):
            assert page.get("id") not in old_pages
            old_pages[page.get("id")] = page

    pages = {p.get("id"): p for p in root.findall("SMARTBIX_PAGE")}
    assert set(pages) == {p[0] for p in PAGES.values()}
    rows = []
    for code, (page_id, alias) in PAGES.items():
        page = pages[page_id]
        assert page.get("alias") == alias
        page_def = json.loads(page.findtext("define"))
        old_page = old_pages[page_id]
        old_def = json.loads(old_page.findtext("define"))
        # Presence proves a static reference only; target runtime not exercised.
        def_text = page.findtext("define")
        refs = [c for c, (pid, _) in PAGES.items() if c != code and pid in def_text]
        assert MODEL_ID in def_text, f"No reference to formal model in {code}"
        rows.append({
            "page": code, "id": page_id, "alias": alias,
            "lastModified": page.get("lastModified"),
            "canonicalXmlSha256": xml_hash(page),
            "defineJsonSha256": json_hash(page_def),
            "oldLastModified": old_page.get("lastModified"),
            "sameXmlAsAugust31": xml_hash(page) == xml_hash(old_page),
            "sameDefineAsAugust31": json_hash(page_def) == json_hash(old_def),
            "formalModelIdReferenced": True, "otherPageIdsInDefinition": refs,
        })
    assert "DB02" in rows[0]["otherPageIdsInDefinition"]
    assert "DB04" in rows[1]["otherPageIdsInDefinition"]

    db04 = pages[PAGES["DB04"][0]].findtext("define")
    static_markers = ["期限", "策略", "窗口截止日", "周期状态", "黄金权重", "scenario_id",
                      "grid_g0.000", "grid_g0.025", "grid_g0.050", "grid_g0.075",
                      "grid_g0.100", "grid_g0.150", "grid_g0.200", "weight_sum", "全量"]
    marker_results = {s: s in db04 for s in static_markers}
    assert all(marker_results.values()), "Reassess DB04 saved repair markers"

    text = raw.decode("utf-8-sig")
    # Broad case-insensitive lexical scan; a hit is not automatically a secret.
    # Never output matched values, JDBC addresses or database account names.
    patterns = {
        "password_passwd_pwd": r"\b(?:password|passwd|pwd)\b",
        "token_bearer_tickets": r"access[_-]?token|refresh[_-]?token|bearer|paramsTicket|opLogHeadersTicket",
        "secret_api_key": r"client[_-]?secret|api[_-]?key|secret[_-]?key",
        "cookie": r"\b(?:set-cookie|cookie)\b",
        "private_key_header": r"BEGIN [A-Z ]*PRIVATE KEY",
    }
    sensitive = {key: len(re.findall(pattern, text, re.I)) for key, pattern in patterns.items()}
    assert not any(sensitive.values()), "Sensitive keyword detected; restrict and manually review"
    jdbc_count = len(re.findall(r"jdbc:", text, re.I))
    assert jdbc_count > 0, "Reassess source metadata security classification"
    # Only key names and counts, never values.
    account_keys = Counter(re.findall(r'"([^"\s]*(?:username|userName|user)[^"\s]*)"\s*:', text, re.I))
    output = {
        "auditDate": "2026-09-04", "nativeDownloadLocalTime": "2026-09-04 17:33:13 +08:00",
        "status": "NATIVE_PACKAGE_REFRESHED_STATIC_AUDIT_PASS_NOT_RESTORE_PASS",
        "package": {"path": PACKAGE.relative_to(WORK).as_posix(), "bytes": len(raw),
                    "sha256": sha(raw), "topLevelTypes": top},
        "model": {"id": MODEL_ID, "alias": MODEL_ALIAS, "lastModified": model.get("lastModified"),
                  "viewCount": len(views), "publishedFieldCount": len(fields),
                  "relationCount": len(relations), "filterDirections": directions,
                  "canonicalXmlSha256": xml_hash(model), "defineJsonSha256": json_hash(definition),
                  "exactlyMatchesSeptember4HeldSnapshot": True,
                  "heldSnapshotSha256": BASELINE_SHA},
        "pages": rows, "db04SavedRepairMarkersPresent": marker_results,
        "security": {"lexicalSensitivePatternCounts": sensitive,
                     "jdbcReferenceCount": jdbc_count, "databaseAccountKeyCounts": dict(account_keys),
                     "exportedStandaloneDataSourceObjects": 0,
                     "classification": "CONTROLLED_INTERNAL_ONLY_NOT_PUBLIC_SAFE",
                     "targetDataSourceMappingAndCredentialsRequired": True},
        "boundaries": {"cpiRepairOrRetest": False, "skippedAiQuestionsRetested": False,
                       "sourceDataChanged": False, "modelSavedOrPublished": False,
                       "liveFunctionalityRetested": False, "independentRestoreExecuted": False,
                       "finalFreezeCreated": False, "bSignoffAdded": False},
    }
    (HERE / "EXPORT_AUDIT.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(output, ensure_ascii=False, indent=2))
    print("PASS: native six-page package; exact held model; static DB04 markers; controlled internal only.")


if __name__ == "__main__":
    main()

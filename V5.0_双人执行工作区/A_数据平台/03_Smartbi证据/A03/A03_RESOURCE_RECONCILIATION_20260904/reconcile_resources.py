"""Read-only configuration audit. Raw controlled XML never leaves the local machine.

This checks saved snapshots, not live catalogue uniqueness, historical absence,
data correctness, or successful restore. It does not query or repair CPI.
"""
import hashlib
import json
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORK = HERE.parents[3]
MODEL_ID = "6b5dff57a4093ba3db07d2903905fe40"
MODEL_ALIAS = "MDL_XH202612_V50_COUNTRY_RESERVE"
CURRENT = WORK / "A_数据平台/03_Smartbi证据/A03/A03_CPI_REPAIR_PREFLIGHT_20260904/backups/migrate_CPI_AFTER_TRIAL_20260904.xml"
CURRENT_SHA = "688622fb50d69f04556685e060346964177402e1a15f7e95b2bf5348cd3c87eb"
OLD_PACKS = {
    "A07_PAGES_DB01_DB02_DB04_WITH_MODEL_20260831.xml": "e013a0695e0b97fd558bd90f870661bd6da2f2592b993226d4a177a54c0463c5",
    "A07_PAGES_DB03_DB05_DB06_WITH_MODEL_20260831.xml": "5b77efb3f93af4c6dbd3061261c221347bcb92761da577f1de3427c2ac5404a3",
}
LOCK = HERE.parent / "SMARTBI_RESOURCE_LOCK_V50.xlsx"
SAFE_FIELD_ATTRS = ("id", "viewId", "referenceFieldId", "name", "alias", "valueType", "visible", "dataFormat")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def element_hash(node):
    return sha(ET.canonicalize(ET.tostring(node, encoding="unicode")).encode())


def read_package(path, expected):
    raw = path.read_bytes()
    assert sha(raw) == expected, f"Input snapshot hash changed: {path.name}"
    root = ET.fromstring(raw)
    models = root.findall("AUGMENTED_DATASET")
    assert len(models) == 1 and models[0].get("id") == MODEL_ID
    model = models[0]
    assert model.get("alias") == MODEL_ALIAS
    definition = json.loads(model.findtext("define"))
    views = definition["views"]
    assert len(views) == 22 and len({v["id"] for v in views}) == 22
    relations = definition["relationGraph"]["relations"]
    assert len(relations) == 19
    fields = model.findall("fields/field")
    assert len(fields) == len({f.get("id") for f in fields})
    summary = {
        "path": path.relative_to(WORK).as_posix(),
        "sha256": sha(raw), "bytes": len(raw),
        "modelId": MODEL_ID, "modelAlias": MODEL_ALIAS,
        "modelLastModified": model.get("lastModified"),
        "modelCanonicalXmlSha256": element_hash(model),
        "defineCanonicalJsonSha256": sha(canonical(definition).encode()),
        "viewCount": len(views), "publishedFieldCount": len(fields),
        "relationCount": len(relations),
        "filterDirections": dict(Counter(r["filterDirection"] for r in relations)),
        "pages": [{k: p.get(k) for k in ("id", "name", "alias", "lastModified")} for p in root.findall("SMARTBIX_PAGE")],
    }
    return summary, model, definition


def field_diff(old_model, new_model):
    old = {f.get("id"): f for f in old_model.findall("fields/field")}
    new = {f.get("id"): f for f in new_model.findall("fields/field")}
    safe = lambda f: {k: f.get(k) for k in SAFE_FIELD_ATTRS}
    changed = []
    for key in sorted(old.keys() & new.keys()):
        if element_hash(old[key]) != element_hash(new[key]):
            changes = {k: {"old": old[key].get(k), "new": new[key].get(k)} for k in SAFE_FIELD_ATTRS if old[key].get(k) != new[key].get(k)}
            changed.append({"id": key, "name": new[key].get("name"), "safeAttributeChanges": changes,
                            "otherChangedAttributeNames": sorted(k for k in old[key].attrib.keys() | new[key].attrib.keys()
                                                                 if k not in SAFE_FIELD_ATTRS and old[key].get(k) != new[key].get(k)),
                            "childContentChanged": [element_hash(c) for c in old[key]] != [element_hash(c) for c in new[key]]})
    return {"added": [safe(new[k]) for k in sorted(new.keys() - old.keys())],
            "removed": [safe(old[k]) for k in sorted(old.keys() - new.keys())], "changed": changed}


def compare(old_model, old_def, new_model, new_def):
    old_views = {v["id"]: v for v in old_def["views"]}
    new_views = {v["id"]: v for v in new_def["views"]}
    view_changes = []
    for key in sorted(old_views.keys() & new_views.keys()):
        a, b = old_views[key], new_views[key]
        changed_keys = sorted(k for k in a.keys() | b.keys() if canonical(a.get(k)) != canonical(b.get(k)))
        if changed_keys:
            # Names of changed top-level properties only; no SQL/source/credential values.
            view_changes.append({"id": key, "alias": b["alias"], "changedPropertyNames": changed_keys})
    old_rel = old_def["relationGraph"]["relations"]
    new_rel = new_def["relationGraph"]["relations"]
    return {
        "exactCanonicalModelEqual": element_hash(old_model) == element_hash(new_model),
        "defineJsonEqual": canonical(old_def) == canonical(new_def),
        "viewIdentityEqual": sorted((v["id"], v["alias"], v["name"]) for v in old_views.values()) == sorted((v["id"], v["alias"], v["name"]) for v in new_views.values()),
        "relationsEqualIgnoringOrder": sorted(canonical(r) for r in old_rel) == sorted(canonical(r) for r in new_rel),
        "viewChanges": view_changes,
        "publishedFields": field_diff(old_model, new_model),
        "changedModelChildTags": [tag for tag in sorted({c.tag for c in old_model} | {c.tag for c in new_model})
             if [element_hash(c) for c in old_model.findall(tag)] != [element_hash(c) for c in new_model.findall(tag)]],
    }


def main():
    baseline = json.loads((HERE / "LOCK_WORKBOOK_BASELINE.json").read_text(encoding="utf-8"))
    lock_sha = sha(LOCK.read_bytes())
    assert lock_sha == baseline["sha256"], "Canonical lock workbook changed since snapshot"
    targets = json.loads((HERE.parent / "A03_PK_AUDIT_20260904/A03_PK_TARGETS_20260904.json").read_text(encoding="utf-8-sig"))
    current, current_model, current_def = read_package(CURRENT, CURRENT_SHA)
    assert compare(current_model, current_def, current_model, current_def)["exactCanonicalModelEqual"]
    assert len(targets) == len(baseline["rows"]) == 21
    rows = []
    for target, row in zip(targets, baseline["rows"], strict=True):
        assert target["object"] == row[1]
        matches = [v for v in current_def["views"] if v["alias"] == target["object"]]
        assert len(matches) == 1, target["object"]
        view = matches[0]
        assert view["name"] == target["physical"]
        rows.append({"order": target["order"], "object": target["object"], "sourceFile": row[2],
                     "viewId": view["id"], "physical": view["name"], "pkKeys": target["keys"],
                     "modelAliasMatchCount": len(matches), "physicalMatchesPkTarget": True,
                     "historicalSameNameStatus": row[3], "historicalCreatedBy": row[4],
                     "historicalRecordedTime": row[5], "historicalNote": row[6]})
    aliases = {t["object"] for t in targets}
    extra = [{k: v[k] for k in ("id", "name", "alias")} for v in current_def["views"] if v["alias"] not in aliases]
    assert len(extra) == 1 and extra[0]["alias"] == "V50_monthly_risk"
    packages = []
    old_models = []
    for name, expected in OLD_PACKS.items():
        summary, model, definition = read_package(WORK / "A_数据平台/04_XML恢复" / name, expected)
        delta = compare(model, definition, current_model, current_def)
        assert not delta["exactCanonicalModelEqual"], "Reassess freshness classification"
        packages.append({**summary, "comparisonToSeptember4Snapshot": delta,
                         "status": "HISTORICAL_SNAPSHOT_NOT_CURRENT_FINAL_RESTORE"})
        old_models.append(model)
    output = {
        "auditDate": "2026-09-04", "scope": "READ_ONLY_SAVED_CONFIG_SNAPSHOTS_NOT_LIVE_CATALOGUE_OR_RESTORE",
        "cpiRepairOrRetestPerformed": False, "currentSnapshot": current,
        "lockWorkbook": {"path": LOCK.relative_to(WORK).as_posix(), "sha256BeforeAndAfter": lock_sha, "modified": False},
        "identityMatches": len(rows), "targets": rows, "extraModelViews": extra,
        "historicalPreImportAbsenceProven": False, "liveCatalogueUniquenessChecked": False,
        "oldPackagesModelsEqual": element_hash(old_models[0]) == element_hash(old_models[1]),
        "packages": packages, "independentRestoreExecuted": False,
    }
    (HERE / "RESOURCE_AND_PACKAGE_RECONCILIATION.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for p in packages:
        d = p["comparisonToSeptember4Snapshot"]
        print(json.dumps({"package": Path(p["path"]).name, "modelModified": p["modelLastModified"],
                          "fieldCount": p["publishedFieldCount"], "currentFieldCount": current["publishedFieldCount"],
                          "fieldAdded": len(d["publishedFields"]["added"]), "fieldRemoved": len(d["publishedFields"]["removed"]),
                          "fieldChanged": len(d["publishedFields"]["changed"]), "viewChanges": len(d["viewChanges"]),
                          "relationsEqual": d["relationsEqualIgnoringOrder"], "changedChildTags": d["changedModelChildTags"]}, ensure_ascii=False))
    print("PASS: 21 snapshot identity matches; lock unchanged; 2 historical packages are not current; no CPI action.")


if __name__ == "__main__":
    main()

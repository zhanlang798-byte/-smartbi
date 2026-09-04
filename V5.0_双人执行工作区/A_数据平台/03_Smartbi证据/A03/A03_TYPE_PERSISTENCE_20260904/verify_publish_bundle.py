"""Narrow pre-publication checks on staged files; not a general security audit."""
import hashlib
import json
from pathlib import Path
import re
import subprocess

here = Path(__file__).resolve().parent
repo = Path(subprocess.check_output(["git", "rev-parse", "--show-toplevel"], cwd=here, text=True, encoding="utf-8").strip())
files = [p for p in subprocess.check_output(["git", "diff", "--cached", "--name-only", "-z"], cwd=repo).decode("utf-8").split("\0") if p]
patterns = {
    "credential_assignment": r'''(?i)(?:password|passwd|access_token|api_key)\s*[=:]\s*["'][^"']{8,}''',
    "jdbc_connection": r'''jdbc:[a-zA-Z][a-zA-Z0-9]*:[^\s"<>]+''',
    "ticket_url": r"(?:paramsTicket|opLogHeadersTicket)=[^\s&]+",
}
findings = []
for name in files:
    assert not any(x in name for x in ["/node_modules/", "/backups/", "/outputs/"])
    assert not name.endswith(".xml"), "Raw XML must remain local"
    if Path(name).suffix not in {".txt", ".json", ".csv", ".md", ".py", ".mjs"}:
        continue
    text = subprocess.check_output(["git", "show", ":" + name], cwd=repo).decode("utf-8-sig")
    for label, pattern in patterns.items():
        if re.search(pattern, text):
            findings.append({"file": name, "pattern": label})
assert not findings, findings
manifest = json.loads((here / "EVIDENCE_MANIFEST.json").read_text(encoding="utf-8"))
for record in manifest["files"]:
    name = (here / record["file"]).relative_to(repo).as_posix()
    blob = subprocess.check_output(["git", "show", ":" + name], cwd=repo)
    assert hashlib.sha256(blob).hexdigest() == record["sha256"], ("Staged hash mismatch", name)
print(json.dumps({"stagedFiles": len(files), "sensitivePatternFindings": findings,
                  "manifestFilesVerified": len(manifest["files"])}, ensure_ascii=False, indent=2))

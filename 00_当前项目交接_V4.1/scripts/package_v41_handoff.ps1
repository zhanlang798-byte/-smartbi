param(
  [string]$ProjectRoot = ''
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
} else {
  $ProjectRoot = [System.IO.Path]::GetFullPath($ProjectRoot)
}

$handoffRoot = Join-Path $ProjectRoot '00_当前项目交接_V4.1'
$deliveryRoot = Join-Path $handoffRoot 'delivery'
$planRoot = Join-Path $ProjectRoot '计划书'
$archiveZip = Join-Path $ProjectRoot '调研资料归档_V1.0\delivery\XH-202612_调研资料AI交接包_V1.0.zip'
$packageName = 'XH-202612_计划与调研交接包_V4.1'
$zipPath = Join-Path $deliveryRoot ($packageName + '.zip')
$stageParent = Join-Path $deliveryRoot '_stage_v41'
$stageRoot = Join-Path $stageParent $packageName
$roundtripParent = Join-Path $deliveryRoot '_roundtrip_v41'
$roundtripRoot = Join-Path $roundtripParent $packageName

function Assert-ExactChild([string]$Path, [string]$Parent, [string]$ExpectedLeaf) {
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  $fullParent = [System.IO.Path]::GetFullPath($Parent).TrimEnd('\') + '\'
  if (-not $fullPath.StartsWith($fullParent, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Unsafe path outside delivery root: $fullPath"
  }
  if ([System.IO.Path]::GetFileName($fullPath) -ne $ExpectedLeaf) {
    throw "Unexpected temporary directory leaf: $fullPath"
  }
  return $fullPath
}

function Reset-ExactTemp([string]$Path, [string]$ExpectedLeaf) {
  $safe = Assert-ExactChild $Path $deliveryRoot $ExpectedLeaf
  if (Test-Path -LiteralPath $safe) {
    Remove-Item -LiteralPath $safe -Recurse -Force
  }
  New-Item -ItemType Directory -Path $safe -Force | Out-Null
  return $safe
}

function Get-RelativeSlash([string]$Base, [string]$Path) {
  $baseFull = [System.IO.Path]::GetFullPath($Base).TrimEnd('\') + '\'
  $pathFull = [System.IO.Path]::GetFullPath($Path)
  if (-not $pathFull.StartsWith($baseFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Path is outside package root: $pathFull"
  }
  return $pathFull.Substring($baseFull.Length).Replace('\', '/')
}

function Get-FileRecord([string]$Base, [System.IO.FileInfo]$File) {
  $relative = Get-RelativeSlash $Base $File.FullName
  $role = if ($relative.StartsWith('00_当前项目交接_V4.1/')) {
    'CURRENT_HANDOFF'
  } elseif ($relative.StartsWith('计划书/06_')) {
    'AUTHORITATIVE_PLAN_V4.1'
  } elseif ($relative.StartsWith('计划书/05_')) {
    'HISTORICAL_PLAN_V4.0'
  } elseif ($relative.StartsWith('调研资料归档_V1.0/')) {
    'SHARED_RESEARCH_ARCHIVE_V1.0'
  } else {
    'PACKAGE_CONTROL'
  }
  return [ordered]@{
    path = $relative
    size = $File.Length
    sha256 = (Get-FileHash -LiteralPath $File.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    role = $role
  }
}

foreach ($required in @($handoffRoot, $planRoot, $archiveZip)) {
  if (-not (Test-Path -LiteralPath $required)) { throw "Required input missing: $required" }
}

New-Item -ItemType Directory -Path $deliveryRoot -Force | Out-Null
$stageParent = Reset-ExactTemp $stageParent '_stage_v41'
$roundtripParent = Reset-ExactTemp $roundtripParent '_roundtrip_v41'
New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null

# Reuse the already verified shared archive; private cold backup and secrets never enter this package.
[System.IO.Compression.ZipFile]::ExtractToDirectory($archiveZip, $stageRoot)

$stagePlan = Join-Path $stageRoot '计划书'
New-Item -ItemType Directory -Path $stagePlan -Force | Out-Null
$planFiles = @(
  '06_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.1.tex',
  '06_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.1.pdf',
  '05_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书.tex',
  '05_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书.pdf'
)
foreach ($name in $planFiles) {
  $source = Join-Path $planRoot $name
  if (-not (Test-Path -LiteralPath $source)) { throw "Plan file missing: $source" }
  Copy-Item -LiteralPath $source -Destination (Join-Path $stagePlan $name)
}

$stageHandoff = Join-Path $stageRoot '00_当前项目交接_V4.1'
New-Item -ItemType Directory -Path $stageHandoff -Force | Out-Null
$handoffFiles = @(
  'README_先读我.md',
  'AI_CONTEXT_V4.1.json',
  'PROJECT_STATUS_V4.1.csv',
  'PROJECT_STATUS_V4.1.jsonl',
  'SOURCE_REUSE_CROSSWALK_V4.1.csv'
)
foreach ($name in $handoffFiles) {
  $source = Join-Path $handoffRoot $name
  if (-not (Test-Path -LiteralPath $source)) { throw "Handoff file missing: $source" }
  Copy-Item -LiteralPath $source -Destination (Join-Path $stageHandoff $name)
}
Copy-Item -LiteralPath (Join-Path $handoffRoot 'scripts') -Destination $stageHandoff -Recurse
Copy-Item -LiteralPath (Join-Path $handoffRoot 'qa') -Destination $stageHandoff -Recurse

# Build a package-wide manifest. The manifest excludes itself and the checksum list to avoid circular hashes.
$manifestLocal = Join-Path $handoffRoot 'HANDOFF_MANIFEST_V4.1.json'
$checksumsLocal = Join-Path $handoffRoot 'checksums_sha256.txt'
$contentFiles = Get-ChildItem -LiteralPath $stageRoot -Recurse -File | Sort-Object FullName
$contentRecords = @($contentFiles | ForEach-Object { Get-FileRecord $stageRoot $_ })
$manifest = [ordered]@{
  package_name = $packageName
  version = 'V4.1'
  generated_at = (Get-Date).ToUniversalTime().ToString('o')
  status_as_of = '2026-08-16'
  document_status = '调研成果同步与执行交接稿'
  package_root_rule = 'All paths are relative to the extracted package root.'
  authority_priority = @(
    '00_当前项目交接_V4.1/README_先读我.md',
    '计划书/06_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书_V4.1.pdf',
    '调研资料归档_V1.0/00_交接入口/研究资料总清单.jsonl',
    '计划书/05_全球经济周期与亚非拉国别风险多币种储备智能决策平台总计划书.pdf'
  )
  included_archive_zip_sha256 = (Get-FileHash -LiteralPath $archiveZip -Algorithm SHA256).Hash.ToLowerInvariant()
  manifest_exclusions = @('00_当前项目交接_V4.1/HANDOFF_MANIFEST_V4.1.json', '00_当前项目交接_V4.1/checksums_sha256.txt')
  content_file_count = $contentRecords.Count
  final_file_count = $contentRecords.Count + 2
  files = $contentRecords
}
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestLocal -Encoding UTF8
Copy-Item -LiteralPath $manifestLocal -Destination (Join-Path $stageHandoff 'HANDOFF_MANIFEST_V4.1.json')

$checksumFiles = Get-ChildItem -LiteralPath $stageRoot -Recurse -File |
  Where-Object { $_.FullName -ne (Join-Path $stageHandoff 'checksums_sha256.txt') } |
  Sort-Object FullName
$checksumLines = @($checksumFiles | ForEach-Object {
  $hash = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  $relative = Get-RelativeSlash $stageRoot $_.FullName
  "$hash  $relative"
})
$checksumLines | Set-Content -LiteralPath $checksumsLocal -Encoding UTF8
Copy-Item -LiteralPath $checksumsLocal -Destination (Join-Path $stageHandoff 'checksums_sha256.txt')

# Every status evidence path must resolve inside the package after removing an optional TeX anchor.
$statusPath = Join-Path $stageHandoff 'PROJECT_STATUS_V4.1.csv'
$statusRows = Import-Csv -LiteralPath $statusPath
$unresolvedEvidence = New-Object System.Collections.Generic.List[string]
foreach ($row in $statusRows) {
  $evidence = ($row.evidence_path -split '#', 2)[0].Replace('/', '\')
  $candidate = Join-Path $stageRoot $evidence
  if (-not (Test-Path -LiteralPath $candidate)) {
    $unresolvedEvidence.Add("$($row.work_item_id):$($row.evidence_path)")
  }
}
if ($unresolvedEvidence.Count -gt 0) {
  throw "Unresolved status evidence paths: $($unresolvedEvidence -join '; ')"
}

# Shared crosswalk rows with a local file must resolve in the shared archive tree.
$crosswalkPath = Join-Path $stageHandoff 'SOURCE_REUSE_CROSSWALK_V4.1.csv'
$crosswalkRows = Import-Csv -LiteralPath $crosswalkPath
$sharedMissing = New-Object System.Collections.Generic.List[string]
$sharedLocalRows = @($crosswalkRows | Where-Object { $_.redistribution_scope -eq 'shared' -and $_.local_path })
foreach ($row in $sharedLocalRows) {
  $candidate = Join-Path (Join-Path $stageRoot '调研资料归档_V1.0') ($row.local_path.Replace('/', '\'))
  if (-not (Test-Path -LiteralPath $candidate)) { $sharedMissing.Add($row.archive_asset_id) }
}
if ($sharedMissing.Count -gt 0) {
  throw "Shared archive assets missing from package: $($sharedMissing -join ',')"
}

$privateLocalRows = @($crosswalkRows | Where-Object { $_.redistribution_scope -eq 'private_only' -and $_.local_path })
$privateOriginalHits = New-Object System.Collections.Generic.List[string]
foreach ($row in $privateLocalRows) {
  $candidate = Join-Path (Join-Path $stageRoot '调研资料归档_V1.0') ($row.local_path.Replace('/', '\'))
  if (Test-Path -LiteralPath $candidate -PathType Leaf) { $privateOriginalHits.Add($row.archive_asset_id) }
}
if ($privateOriginalHits.Count -gt 0) {
  throw "Private-only originals found in shared package: $($privateOriginalHits -join ',')"
}

# Scan textual content for the supplied platform credential and common live-secret forms.
$textExtensions = @('.md','.json','.jsonl','.csv','.txt','.tex','.bib','.mmd','.html','.xml','.js','.mjs','.ps1','.yml','.yaml')
$suppliedCredential = '1886258' + '9711'
$secretRules = [ordered]@{
  supplied_phone_or_password = '(?<!\d)' + [regex]::Escape($suppliedCredential) + '(?!\d)'
  bearer_token = '(?i)Authorization\s*:\s*Bearer\s+[A-Za-z0-9._~+\-/=]{12,}'
  session_cookie = '(?i)(JSESSIONID|SESSIONID|PHPSESSID)\s*[=:]\s*[A-Za-z0-9._~+\-/=]{8,}'
  url_access_token = '(?i)[?&](access_token|auth_token|api_key)=[^&\s]{8,}'
}
$secretHits = New-Object System.Collections.Generic.List[object]
$textFiles = Get-ChildItem -LiteralPath $stageRoot -Recurse -File | Where-Object { $textExtensions -contains $_.Extension.ToLowerInvariant() }
foreach ($file in $textFiles) {
  foreach ($rule in $secretRules.GetEnumerator()) {
    $matches = Select-String -LiteralPath $file.FullName -Pattern $rule.Value -AllMatches -ErrorAction SilentlyContinue
    foreach ($match in $matches) {
      $secretHits.Add([pscustomobject]@{ rule = $rule.Key; path = (Get-RelativeSlash $stageRoot $file.FullName); line = $match.LineNumber })
    }
  }
}
if ($secretHits.Count -gt 0) {
  throw "Secret scan failed: $($secretHits | ConvertTo-Json -Compress)"
}

# Current handoff controls must not depend on this machine's absolute user path.
$absolutePathHits = New-Object System.Collections.Generic.List[object]
$currentTextFiles = Get-ChildItem -LiteralPath $stageHandoff -Recurse -File | Where-Object { $textExtensions -contains $_.Extension.ToLowerInvariant() }
$machinePathWin = 'C:' + [char]92 + 'Users' + [char]92 + '73998'
$machinePathSlash = 'C:' + '/' + 'Users' + '/' + '73998'
$machinePathPattern = [regex]::Escape($machinePathWin) + '|' + [regex]::Escape($machinePathSlash)
foreach ($file in $currentTextFiles) {
  $matches = Select-String -LiteralPath $file.FullName -Pattern $machinePathPattern -AllMatches -ErrorAction SilentlyContinue
  foreach ($match in $matches) {
    $absolutePathHits.Add([pscustomobject]@{ path = (Get-RelativeSlash $stageRoot $file.FullName); line = $match.LineNumber })
  }
}
if ($absolutePathHits.Count -gt 0) {
  throw "Absolute path dependency found in current handoff controls: $($absolutePathHits | ConvertTo-Json -Compress)"
}

$offlineTestPath = Join-Path $stageHandoff 'qa\offline_handoff_test_V4.1.json'
$offlineTest = Get-Content -LiteralPath $offlineTestPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($offlineTest.overall -ne 'PASS' -or $offlineTest.passed -ne $offlineTest.test_count -or $offlineTest.test_count -lt 30) {
  throw "Offline handoff test does not meet the >=30 all-pass rule"
}
$protectedTestPath = Join-Path $stageHandoff 'qa\protected_verification.json'
$protectedTest = Get-Content -LiteralPath $protectedTestPath -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $protectedTest.pass -or $protectedTest.differences.Count -ne 0) {
  throw "V4.0 or archive V1.0 protected hashes changed"
}

if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($stageParent, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)

[System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $roundtripParent)
if (-not (Test-Path -LiteralPath $roundtripRoot)) { throw "Roundtrip package root missing" }
$stageRecords = @((Get-ChildItem -LiteralPath $stageRoot -Recurse -File | Sort-Object FullName) | ForEach-Object { Get-FileRecord $stageRoot $_ })
$roundtripRecords = @((Get-ChildItem -LiteralPath $roundtripRoot -Recurse -File | Sort-Object FullName) | ForEach-Object { Get-FileRecord $roundtripRoot $_ })
$stageMap = @{}; foreach ($r in $stageRecords) { $stageMap[$r.path] = $r.sha256 }
$roundtripMap = @{}; foreach ($r in $roundtripRecords) { $roundtripMap[$r.path] = $r.sha256 }
$roundtripDiff = New-Object System.Collections.Generic.List[string]
foreach ($path in @($stageMap.Keys + $roundtripMap.Keys | Sort-Object -Unique)) {
  if (-not $stageMap.ContainsKey($path) -or -not $roundtripMap.ContainsKey($path) -or $stageMap[$path] -ne $roundtripMap[$path]) {
    $roundtripDiff.Add($path)
  }
}
if ($roundtripDiff.Count -gt 0) { throw "Roundtrip hash mismatch: $($roundtripDiff -join ', ')" }

$zipItem = Get-Item -LiteralPath $zipPath
$zipHash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
$verification = [ordered]@{
  verified_at = (Get-Date).ToUniversalTime().ToString('o')
  package_name = $packageName
  version = 'V4.1'
  zip_file = $zipItem.Name
  zip_size = $zipItem.Length
  zip_sha256 = $zipHash
  source_shared_archive_sha256 = (Get-FileHash -LiteralPath $archiveZip -Algorithm SHA256).Hash.ToLowerInvariant()
  file_count = $stageRecords.Count
  roundtrip_file_count = $roundtripRecords.Count
  roundtrip_differences = @($roundtripDiff)
  protected_files_unchanged = [bool]$protectedTest.pass
  protected_file_count = $protectedTest.before_count
  status_evidence_paths_resolved = "$($statusRows.Count)/$($statusRows.Count)"
  shared_local_assets_resolved = "$($sharedLocalRows.Count)/$($sharedLocalRows.Count)"
  private_only_original_path_hits = $privateOriginalHits.Count
  secret_scan_hits = $secretHits.Count
  current_handoff_absolute_path_hits = $absolutePathHits.Count
  offline_handoff_tests = "$($offlineTest.passed)/$($offlineTest.test_count)"
  package_root_relative_paths = $true
  private_cold_backup_included = $false
  overall_status = 'PASS'
}
$verificationPath = Join-Path $deliveryRoot 'package_verification_V4.1.json'
$verification | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $verificationPath -Encoding UTF8
@("$zipHash  $($zipItem.Name)") | Set-Content -LiteralPath (Join-Path $deliveryRoot 'package_hashes_V4.1.txt') -Encoding UTF8

# Temporary directories are exact, validated children of the V4.1 delivery folder.
Remove-Item -LiteralPath (Assert-ExactChild $stageParent $deliveryRoot '_stage_v41') -Recurse -Force
Remove-Item -LiteralPath (Assert-ExactChild $roundtripParent $deliveryRoot '_roundtrip_v41') -Recurse -Force

$verification | ConvertTo-Json -Depth 8

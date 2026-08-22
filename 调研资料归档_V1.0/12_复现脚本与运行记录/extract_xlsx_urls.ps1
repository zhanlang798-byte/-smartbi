param(
    [Parameter(Mandatory = $true)]
    [string]$WorkbookPath,
    [switch]$Metadata
)

$ErrorActionPreference = 'Stop'
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$resolved = [System.IO.Path]::GetFullPath($WorkbookPath)
if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
    throw "Workbook not found: $resolved"
}

$results = [System.Collections.Generic.List[object]]::new()
$seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$stream = [System.IO.File]::OpenRead($resolved)
$archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Read, $false)

try {
    if ($Metadata) {
        $workbookEntry = $archive.GetEntry('xl/workbook.xml')
        if ($null -eq $workbookEntry) { throw 'xl/workbook.xml not found' }
        $metadataReader = [System.IO.StreamReader]::new($workbookEntry.Open(), [System.Text.Encoding]::UTF8, $true)
        try { [xml]$workbookXml = $metadataReader.ReadToEnd() }
        finally { $metadataReader.Dispose() }
        $sheetNames = @($workbookXml.SelectNodes("//*[local-name()='sheet']") | ForEach-Object { $_.GetAttribute('name') })
        $worksheetEntries = @($archive.Entries | Where-Object { $_.FullName -match '^xl/worksheets/sheet\d+\.xml$' })
        [pscustomobject]@{
            workbook_path = $resolved
            sheet_count = $sheetNames.Count
            sheet_names = $sheetNames
            worksheet_xml_count = $worksheetEntries.Count
        } | ConvertTo-Json -Depth 4 -Compress
        return
    }
    foreach ($entry in $archive.Entries) {
        if ($entry.FullName -notmatch '\.(xml|rels)$') { continue }
        if ($entry.Length -gt 100MB) { continue }

        $reader = [System.IO.StreamReader]::new($entry.Open(), [System.Text.Encoding]::UTF8, $true)
        try {
            $content = $reader.ReadToEnd()
        }
        finally {
            $reader.Dispose()
        }

        $decoded = [System.Net.WebUtility]::HtmlDecode($content)
        foreach ($match in [regex]::Matches($decoded, 'https?://[^\s<>,()\[\]]+')) {
            $url = $match.Value.TrimEnd([char[]]'.,;:)]}"''')
            try { $hostName = ([System.Uri]$url).Host.ToLowerInvariant() }
            catch { continue }
            if ($hostName -in @(
                'schemas.openxmlformats.org',
                'schemas.microsoft.com',
                'www.w3.org',
                'purl.oclc.org'
            )) { continue }
            $key = "$($entry.FullName)|$url"
            if ($seen.Add($key)) {
                $results.Add([pscustomobject]@{
                    url = $url
                    entry = $entry.FullName
                })
            }
        }
    }
}
finally {
    $archive.Dispose()
    $stream.Dispose()
}

$results | ConvertTo-Json -Depth 4 -Compress

param(
  [Parameter(Mandatory=$true)][string]$PdfPath,
  [Parameter(Mandatory=$true)][string]$OutputRoot
)

$ErrorActionPreference = 'Stop'
$pdfResolved = (Resolve-Path -LiteralPath $PdfPath).Path
$outputResolved = [System.IO.Path]::GetFullPath($OutputRoot)
$handoffRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not $outputResolved.StartsWith($handoffRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "OutputRoot must stay under the V4.1 handoff folder: $outputResolved"
}

$pagesDir = Join-Path $outputResolved 'pages'
$contactsDir = Join-Path $outputResolved 'contacts'
New-Item -ItemType Directory -Path $pagesDir -Force | Out-Null
New-Item -ItemType Directory -Path $contactsDir -Force | Out-Null

$prefix = Join-Path $pagesDir 'page'
& pdftoppm.exe -png -r 110 $pdfResolved $prefix
if ($LASTEXITCODE -ne 0) { throw "pdftoppm failed with exit code $LASTEXITCODE" }

Add-Type -AssemblyName System.Drawing
$pageFiles = Get-ChildItem -LiteralPath $pagesDir -Filter 'page-*.png' -File | Sort-Object Name
if ($pageFiles.Count -eq 0) { throw 'No rendered pages found' }

$metrics = New-Object System.Collections.Generic.List[object]
foreach ($file in $pageFiles) {
  $bitmap = [System.Drawing.Bitmap]::FromFile($file.FullName)
  try {
    $step = 8
    $sampleCount = 0
    $inkCount = 0
    for ($y = 0; $y -lt $bitmap.Height; $y += $step) {
      for ($x = 0; $x -lt $bitmap.Width; $x += $step) {
        $pixel = $bitmap.GetPixel($x, $y)
        $sampleCount++
        if ($pixel.R -lt 247 -or $pixel.G -lt 247 -or $pixel.B -lt 247) { $inkCount++ }
      }
    }
    $number = [int]([regex]::Match($file.BaseName, '(\d+)$').Groups[1].Value)
    $metrics.Add([pscustomobject]@{
      page = $number
      file = $file.Name
      width = $bitmap.Width
      height = $bitmap.Height
      ink_ratio = [math]::Round($inkCount / [double]$sampleCount, 6)
      nearly_blank = (($inkCount / [double]$sampleCount) -lt 0.002)
    })
  } finally {
    $bitmap.Dispose()
  }
}

$font = New-Object System.Drawing.Font('Arial', 16, [System.Drawing.FontStyle]::Bold)
$brush = [System.Drawing.Brushes]::Black
$thumbWidth = 220
$thumbHeight = 311
$labelHeight = 26
$cols = 5
$rows = 4
$perSheet = $cols * $rows
for ($start = 0; $start -lt $pageFiles.Count; $start += $perSheet) {
  $sheetIndex = [int]($start / $perSheet) + 1
  $canvas = New-Object System.Drawing.Bitmap(($cols * $thumbWidth), ($rows * ($thumbHeight + $labelHeight)))
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  try {
    $graphics.Clear([System.Drawing.Color]::White)
    for ($offset = 0; $offset -lt $perSheet -and ($start + $offset) -lt $pageFiles.Count; $offset++) {
      $file = $pageFiles[$start + $offset]
      $col = $offset % $cols
      $row = [int]($offset / $cols)
      $x = $col * $thumbWidth
      $y = $row * ($thumbHeight + $labelHeight)
      $page = [System.Drawing.Image]::FromFile($file.FullName)
      try {
        $graphics.DrawImage($page, $x, $y, $thumbWidth, $thumbHeight)
      } finally {
        $page.Dispose()
      }
      $pageNumber = $metrics[$start + $offset].page
      $graphics.DrawString("Page $pageNumber", $font, $brush, $x + 5, $y + $thumbHeight + 2)
    }
    $contactPath = Join-Path $contactsDir ("contact_{0:D2}.png" -f $sheetIndex)
    $canvas.Save($contactPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $canvas.Dispose()
  }
}
$font.Dispose()

$metricsPath = Join-Path $outputResolved 'page_metrics.csv'
$metrics | Export-Csv -LiteralPath $metricsPath -NoTypeInformation -Encoding UTF8
$summary = [ordered]@{
  rendered_at = (Get-Date).ToUniversalTime().ToString('o')
  pdf_path = $pdfResolved
  page_count = $pageFiles.Count
  contact_sheet_count = [math]::Ceiling($pageFiles.Count / [double]$perSheet)
  nearly_blank_pages = @($metrics | Where-Object nearly_blank | Select-Object -ExpandProperty page)
  min_ink_ratio = ($metrics | Measure-Object ink_ratio -Minimum).Minimum
  max_ink_ratio = ($metrics | Measure-Object ink_ratio -Maximum).Maximum
  render_status = if (($metrics | Where-Object nearly_blank).Count -eq 0) { 'PASS_NO_NEARLY_BLANK_PAGES' } else { 'REVIEW_REQUIRED' }
}
$summary | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $outputResolved 'render_summary.json') -Encoding UTF8
$summary | ConvertTo-Json -Depth 5

# Applies Arabic translations to the hardcoded strings in the
# @medusajs/draft-order admin bundle (ESM entry used by the admin build).
# Translation pairs live in draft-order-i18n.txt (UTF-8) as FIND|||REPLACE.
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
$target = Join-Path $root "node_modules/@medusajs/draft-order/.medusa/server/src/admin/index.mjs"
$dataFile = Join-Path $scriptDir "draft-order-i18n.txt"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$lines = [System.IO.File]::ReadAllLines($dataFile, [System.Text.Encoding]::UTF8)
$content = [System.IO.File]::ReadAllText($target, [System.Text.Encoding]::UTF8)

$applied = 0
$missing = @()
foreach ($line in $lines) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $idx = $line.IndexOf("|||")
  if ($idx -lt 0) { continue }
  $find = $line.Substring(0, $idx)
  $repl = $line.Substring($idx + 3)
  if ($content.Contains($find)) {
    $content = $content.Replace($find, $repl)
    $applied++
  } else {
    $missing += $find
  }
}

[System.IO.File]::WriteAllText($target, $content, $utf8NoBom)

Write-Output ("Applied " + $applied + " replacement group(s).")
if ($missing.Count -gt 0) {
  Write-Output ("MISSING (" + $missing.Count + " not found):")
  $missing | ForEach-Object { Write-Output ("  - " + $_) }
}

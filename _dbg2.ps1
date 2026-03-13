$f = [IO.File]::ReadAllText("c:\capitunecax\src\pages\dashboard.astro", [Text.Encoding]::UTF8)

# Test CSS anchor - section
$a1 = "DOCUMENTS"
$idx = $f.IndexOf($a1)
if ($idx -gt 0) {
  $ctx = $f.Substring([Math]::Max(0,$idx-40), 100)
  $bytes = [Text.Encoding]::UTF8.GetBytes($ctx)
  Write-Host "Bytes around DOCUMENTS: $([BitConverter]::ToString($bytes))"
  Write-Host ""
}

# Test dash-container
$a2 = "projet-steps"
$idx2 = $f.IndexOf($a2)
if ($idx2 -gt 0) {
  $ctx2 = $f.Substring([Math]::Max(0,$idx2-80), 120)
  $bytes2 = [Text.Encoding]::UTF8.GetBytes($ctx2)
  Write-Host "Bytes around projet-steps: $([BitConverter]::ToString($bytes2))"
  Write-Host ""
}

# Check if proj-view was already inserted
Write-Host "projViewMode exists: $($f.Contains('projViewMode'))"
Write-Host "loadProjetTab exists: $($f.Contains('loadProjetTab'))"

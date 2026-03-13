$f = [IO.File]::ReadAllText("c:\capitunecax\src\pages\dashboard.astro", [Text.Encoding]::UTF8)
Write-Host "CSS anchor test1: $($f.Contains("/* ── DOCUMENTS"))"
Write-Host "CSS anchor test2: $($f.Contains("/* -- DOCUMENTS"))"
Write-Host "proj-steps test: $($f.Contains("          <div class=`"projet-steps`">"))"
$i1 = $f.IndexOf("DOCUMENTS")
if ($i1 -gt 0) {
  $ctx = $f.Substring([Math]::Max(0,$i1-30),80)
  $bytes = [Text.Encoding]::UTF8.GetBytes($ctx)
  Write-Host "Bytes: $([BitConverter]::ToString($bytes))"
}

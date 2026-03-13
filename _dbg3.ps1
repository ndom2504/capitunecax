$src = "c:\capitunecax\src\pages\dashboard.astro"
$f = [IO.File]::ReadAllText($src, [Text.Encoding]::UTF8)

# Trouver l'index de DOCUMENTS et afficher 200 chars avant
$i = $f.IndexOf("DOCUMENTS")
Write-Host "DOCUMENTS index: $i"
$before = $f.Substring([Math]::Max(0,$i-250), 250)
Write-Host "=== 250 chars BEFORE DOCUMENTS ==="
Write-Host $before
Write-Host "==="

# Chercher <div class="dash-container"> dans la section HTML (apres la ligne 789 donc apres char index ~20000)
$htmlIdx = $f.IndexOf("<div class=`"dash-container`">", 100000)
Write-Host "`nFirst dash-container HTML idx (after CSS): $htmlIdx"
if ($htmlIdx -gt 0) {
  $ctx = $f.Substring($htmlIdx, 200)
  Write-Host $ctx
  $bytes = [Text.Encoding]::UTF8.GetBytes($ctx)
  Write-Host "Bytes: $([BitConverter]::ToString($bytes))"
}

# Test si la sequence LF existe
$t1 = "        <div class=`"dash-container`">`n          <div class=`"projet-steps`">"
$t2 = "        <div class=`"dash-container`">`r`n          <div class=`"projet-steps`">"
Write-Host "`nLF version found: $($f.Contains($t1))"
Write-Host "CRLF version found: $($f.Contains($t2))"

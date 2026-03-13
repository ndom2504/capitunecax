$src = "c:\capitunecax\src\pages\dashboard.astro"
$f = [IO.File]::ReadAllText($src, [Text.Encoding]::UTF8)
$ori = $f.Length

# 1. projFormMode explicitement visible
$old1 = '<div id="projFormMode">'
$new1 = '<div id="projFormMode" style="display:block">'
$c1 = ($f -split [regex]::Escape($old1)).Count - 1
Write-Host "projFormMode occurrences: $c1"
if ($c1 -gt 0) { $f = $f.Replace($old1, $new1); Write-Host "OK 1 projFormMode style" }

# 2. loadProjetTab: montrer formulaire en premier
$oldFn = 'window.loadProjetTab = async function(force) {'
Write-Host "loadProjetTab found: $($f.Contains($oldFn))"

# Trouver le bloc complet et le remplacer par index
$startIdx = $f.IndexOf($oldFn)
if ($startIdx -lt 0) { Write-Host "FAIL: loadProjetTab not found"; exit }

# Fin du bloc = la ligne }; apres le catch
$endMarker = '    };'
$endIdx = $f.IndexOf($endMarker, $startIdx + 50)
Write-Host "Block startIdx=$startIdx endIdx=$endIdx"

$nl = "`r`n"
$newFn = '    window.loadProjetTab = async function(force) {' + $nl
$newFn += '      if (_projetViewLoaded && !force) return;' + $nl
$newFn += '      _projetViewLoaded = true;' + $nl
$newFn += '      showProjFormMode(); // toujours visible en premier' + $nl
$newFn += '      try {' + $nl
$newFn += "        var res = await fetch('/api/projet', { headers: { Accept: 'application/json' } });" + $nl
$newFn += '        if (!res.ok) return;' + $nl
$newFn += '        var data = await res.json().catch(function(){ return {}; });' + $nl
$newFn += '        var project = data && data.project ? data.project : null;' + $nl
$newFn += '        if (!project || !project.type) return;' + $nl
$newFn += '        ST.projet = project;' + $nl
$newFn += '        restoreProjetForm(project);' + $nl
$newFn += '        renderProjetView(project);' + $nl
$newFn += '        showProjViewMode();' + $nl
$newFn += '      } catch(e) { /* formulaire deja visible */ }' + $nl
$newFn += '    };'

# Extraire le bloc actuel pour verification
$oldBlock = $f.Substring($startIdx, $endIdx - $startIdx + $endMarker.Length)
Write-Host "Old block length: $($oldBlock.Length)"
Write-Host "Old block: [$oldBlock]"

$f = $f.Remove($startIdx, $endIdx - $startIdx + $endMarker.Length)
$f = $f.Insert($startIdx, $newFn)
Write-Host "New length: $($f.Length)"

$tmp = "c:\capitunecax\_fix4.tmp"
[IO.File]::WriteAllText($tmp, $f, [Text.Encoding]::UTF8)
$check = [IO.File]::ReadAllText($tmp, [Text.Encoding]::UTF8)
if ($check.Length -gt ($ori - 100)) {
  [IO.File]::WriteAllText($src, $check, [Text.Encoding]::UTF8)
  Write-Host "SAVED OK len=$($check.Length)"
  Remove-Item $tmp
} else { Write-Host "ABORT" }

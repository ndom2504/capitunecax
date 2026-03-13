$f=[IO.File]::ReadAllText("c:\capitunecax\src\pages\dashboard.astro",[Text.Encoding]::UTF8)
Write-Host "Length: $($f.Length)"
Write-Host "56px: $($f.Contains('width:56px;height:56px'))"
Write-Host "projViewMode: $($f.Contains('projViewMode'))"
Write-Host "projFormMode: $($f.Contains('projFormMode'))"
Write-Host "loadProjetTab: $($f.Contains('loadProjetTab'))"
Write-Host "proj-subtabs CSS: $($f.Contains('.proj-subtabs-row'))"
Write-Host "switchProjetSubtab: $($f.Contains('switchProjetSubtab'))"
Write-Host "renderProjetView: $($f.Contains('renderProjetView'))"
Write-Host "proj-info-card: $($f.Contains('.proj-info-card'))"



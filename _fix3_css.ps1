$src = "c:\capitunecax\src\pages\dashboard.astro"
$f = [IO.File]::ReadAllText($src, [Text.Encoding]::UTF8)
$originalLen = $f.Length
Write-Host "Original len: $originalLen"

# ─── Trouver le bon nombre de tirets ─────────────────────────────────────────
$dash = [string][char]0x2500
# Chercher la suite exacte /* ── DOCUMENTS
$prefix = "      /* " + $dash + $dash + " DOCUMENTS "
$startIdx = $f.IndexOf($prefix)
if ($startIdx -lt 0) {  Write-Host "Prefix not found with [char]0x2500"; exit }
# Trouver la fin */ sur cette ligne
$endIdx = $f.IndexOf("*/", $startIdx)
$fullAnchor = $f.Substring($startIdx, $endIdx - $startIdx + 2)
Write-Host "Found anchor: [$fullAnchor]"
Write-Host "Anchor length: $($fullAnchor.Length)"

# ─── Construire le CSS proj-view ─────────────────────────────────────────────
$nl = "`r`n"
$css  = "      /* " + $dash + $dash + " PROJET VIEW MODE " + ($dash * 25) + " */" + $nl
$css += "      .proj-view-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:20px;flex-wrap:wrap;}" + $nl
$css += "      .proj-view-title{display:flex;align-items:center;gap:14px;}" + $nl
$css += "      .proj-view-title i{font-size:28px;color:var(--cap-orange);}" + $nl
$css += "      .proj-view-type-label{font-size:18px;font-weight:700;color:#1a1a2e;}" + $nl
$css += "      .proj-view-sub{font-size:13px;color:#666;margin-top:2px;}" + $nl
$css += "      .proj-edit-btn{background:var(--cap-orange);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:opacity .2s;}" + $nl
$css += "      .proj-edit-btn:hover{opacity:.85;}" + $nl
$css += "      .proj-refresh-btn{background:#1a1a2e;padding:8px 12px;}" + $nl
$css += "      .proj-progress-section{background:#fff;border-radius:12px;padding:16px 20px;margin-bottom:20px;box-shadow:0 1px 6px rgba(0,0,0,.06);}" + $nl
$css += "      .proj-progress-top{display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;font-weight:600;}" + $nl
$css += "      .proj-progress-bar-bg{height:10px;background:#f0f0f0;border-radius:99px;overflow:hidden;margin-bottom:8px;}" + $nl
$css += "      .proj-progress-bar-fill{height:100%;background:linear-gradient(90deg,var(--cap-orange),#f7c59f);border-radius:99px;transition:width .5s ease;}" + $nl
$css += "      .proj-progress-steps-txt{font-size:12px;color:#888;}" + $nl
$css += "      .proj-subtabs-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;}" + $nl
$css += "      .proj-subtab-btn{background:transparent;border:1.5px solid #e0e0e0;color:#666;border-radius:20px;padding:7px 16px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:.15s;}" + $nl
$css += "      .proj-subtab-btn.active{background:var(--cap-orange);color:#fff;border-color:var(--cap-orange);}" + $nl
$css += "      .proj-subtab-btn:hover:not(.active){background:#fff5ec;border-color:var(--cap-orange);color:var(--cap-orange);}" + $nl
$css += "      .proj-subtab-content{display:none;}" + $nl
$css += "      .proj-subtab-content.active{display:block;}" + $nl
$css += "      .proj-infos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:20px;}" + $nl
$css += "      .proj-info-card{background:#fff;border-radius:10px;padding:14px 16px;box-shadow:0 1px 6px rgba(0,0,0,.06);}" + $nl
$css += "      .proj-info-card label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px;}" + $nl
$css += "      .proj-info-card span{font-size:14px;font-weight:600;color:#1a1a2e;}" + $nl
$css += "      .proj-step-row{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #f5f5f5;}" + $nl
$css += "      .proj-step-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;margin-top:4px;}" + $nl
$css += "      .proj-step-dot.completed{background:#27ae60;}" + $nl
$css += "      .proj-step-dot.in_progress{background:var(--cap-orange);}" + $nl
$css += "      .proj-step-dot.pending{background:#ccc;}" + $nl
$css += "      .proj-step-dot.blocked{background:#e74c3c;}" + $nl
$css += "      .proj-step-body{flex:1;}" + $nl
$css += "      .proj-step-title{font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:2px;}" + $nl
$css += "      .proj-step-badge{display:inline-block;font-size:11px;font-weight:600;border-radius:99px;padding:2px 10px;margin-bottom:4px;}" + $nl
$css += "      .proj-step-badge.completed{background:#e8f5e9;color:#27ae60;}" + $nl
$css += "      .proj-step-badge.in_progress{background:#fff3e0;color:var(--cap-orange);}" + $nl
$css += "      .proj-step-badge.pending{background:#f5f5f5;color:#888;}" + $nl
$css += "      .proj-step-badge.blocked{background:#fce8e8;color:#e74c3c;}" + $nl
$css += "      .proj-step-desc{font-size:12px;color:#666;}" + $nl
$css += "      .proj-empty-state{text-align:center;padding:40px 20px;color:#888;}" + $nl
$css += "      .proj-empty-state i{font-size:40px;color:#ddd;margin-bottom:12px;display:block;}" + $nl
$css += "      .proj-empty-state strong{display:block;font-size:15px;color:#555;margin-bottom:6px;}" + $nl
$css += "      .proj-cta-btn{background:var(--cap-orange);color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;}" + $nl
$css += $fullAnchor  # reinsere l'ancre DOCUMENTS originale

$f = $f.Replace($fullAnchor, $css)
Write-Host "CSS inserted. Contains proj-view-header: $($f.Contains('.proj-view-header'))"

# ─── Write ────────────────────────────────────────────────────────────────────
$tmp = "c:\capitunecax\_fix3.tmp"
[IO.File]::WriteAllText($tmp, $f, [Text.Encoding]::UTF8)
$check = [IO.File]::ReadAllText($tmp, [Text.Encoding]::UTF8)
Write-Host "New length: $($check.Length)"
if ($check.Length -gt ($originalLen + 500)) {
  [IO.File]::WriteAllText($src, $check, [Text.Encoding]::UTF8)
  Write-Host "SAVED OK"
  Remove-Item $tmp -Force
} else {
  Write-Host "ABORT"
}

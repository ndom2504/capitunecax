$src = "c:\capitunecax\src\pages\dashboard.astro"
$f = [IO.File]::ReadAllText($src, [Text.Encoding]::UTF8)
$originalLen = $f.Length
Write-Host "Original length: $originalLen"

# ─── A. CSS proj-view (anchor avec char Unicode reconstruit) ─────────────────
$dash = [string][char]0x2500  # ─ (U+2500)
$dashx2 = $dash + $dash
$dashx37 = $dash * 37
$cssAnchor = "      /* $dashx2 DOCUMENTS $dashx37 */"
Write-Host "CSS anchor found: $($f.Contains($cssAnchor))"

if ($f.Contains($cssAnchor)) {
  $cssProjView = "      /* $dashx2 PROJET VIEW MODE $($dash*27) */`r`n"
  $cssProjView += "      .proj-view-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:20px;flex-wrap:wrap;}`r`n"
  $cssProjView += "      .proj-view-title{display:flex;align-items:center;gap:14px;}`r`n"
  $cssProjView += "      .proj-view-title i{font-size:28px;color:var(--cap-orange);}`r`n"
  $cssProjView += "      .proj-view-type-label{font-size:18px;font-weight:700;color:#1a1a2e;}`r`n"
  $cssProjView += "      .proj-view-sub{font-size:13px;color:#666;margin-top:2px;}`r`n"
  $cssProjView += "      .proj-edit-btn{background:var(--cap-orange);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:opacity .2s;}`r`n"
  $cssProjView += "      .proj-edit-btn:hover{opacity:.85;}`r`n"
  $cssProjView += "      .proj-refresh-btn{background:#1a1a2e;padding:8px 12px;}`r`n"
  $cssProjView += "      .proj-progress-section{background:#fff;border-radius:12px;padding:16px 20px;margin-bottom:20px;box-shadow:0 1px 6px rgba(0,0,0,.06);}`r`n"
  $cssProjView += "      .proj-progress-top{display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;font-weight:600;}`r`n"
  $cssProjView += "      .proj-progress-bar-bg{height:10px;background:#f0f0f0;border-radius:99px;overflow:hidden;margin-bottom:8px;}`r`n"
  $cssProjView += "      .proj-progress-bar-fill{height:100%;background:linear-gradient(90deg,var(--cap-orange),#f7c59f);border-radius:99px;transition:width .5s ease;}`r`n"
  $cssProjView += "      .proj-progress-steps-txt{font-size:12px;color:#888;}`r`n"
  $cssProjView += "      .proj-subtabs-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;}`r`n"
  $cssProjView += "      .proj-subtab-btn{background:transparent;border:1.5px solid #e0e0e0;color:#666;border-radius:20px;padding:7px 16px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:.15s;}`r`n"
  $cssProjView += "      .proj-subtab-btn.active{background:var(--cap-orange);color:#fff;border-color:var(--cap-orange);}`r`n"
  $cssProjView += "      .proj-subtab-btn:hover:not(.active){background:#fff5ec;border-color:var(--cap-orange);color:var(--cap-orange);}`r`n"
  $cssProjView += "      .proj-subtab-content{display:none;}`r`n"
  $cssProjView += "      .proj-subtab-content.active{display:block;}`r`n"
  $cssProjView += "      .proj-infos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:20px;}`r`n"
  $cssProjView += "      .proj-info-card{background:#fff;border-radius:10px;padding:14px 16px;box-shadow:0 1px 6px rgba(0,0,0,.06);}`r`n"
  $cssProjView += "      .proj-info-card label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px;}`r`n"
  $cssProjView += "      .proj-info-card span{font-size:14px;font-weight:600;color:#1a1a2e;}`r`n"
  $cssProjView += "      .proj-step-row{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #f5f5f5;}`r`n"
  $cssProjView += "      .proj-step-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;margin-top:4px;}`r`n"
  $cssProjView += "      .proj-step-dot.completed{background:#27ae60;}`r`n"
  $cssProjView += "      .proj-step-dot.in_progress{background:var(--cap-orange);}`r`n"
  $cssProjView += "      .proj-step-dot.pending{background:#ccc;}`r`n"
  $cssProjView += "      .proj-step-dot.blocked{background:#e74c3c;}`r`n"
  $cssProjView += "      .proj-step-body{flex:1;}`r`n"
  $cssProjView += "      .proj-step-title{font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:2px;}`r`n"
  $cssProjView += "      .proj-step-badge{display:inline-block;font-size:11px;font-weight:600;border-radius:99px;padding:2px 10px;margin-bottom:4px;}`r`n"
  $cssProjView += "      .proj-step-badge.completed{background:#e8f5e9;color:#27ae60;}`r`n"
  $cssProjView += "      .proj-step-badge.in_progress{background:#fff3e0;color:var(--cap-orange);}`r`n"
  $cssProjView += "      .proj-step-badge.pending{background:#f5f5f5;color:#888;}`r`n"
  $cssProjView += "      .proj-step-badge.blocked{background:#fce8e8;color:#e74c3c;}`r`n"
  $cssProjView += "      .proj-step-desc{font-size:12px;color:#666;}`r`n"
  $cssProjView += "      .proj-empty-state{text-align:center;padding:40px 20px;color:#888;}`r`n"
  $cssProjView += "      .proj-empty-state i{font-size:40px;color:#ddd;margin-bottom:12px;display:block;}`r`n"
  $cssProjView += "      .proj-empty-state strong{display:block;font-size:15px;color:#555;margin-bottom:6px;}`r`n"
  $cssProjView += "      .proj-cta-btn{background:var(--cap-orange);color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;}`r`n"
  $cssProjView += $cssAnchor
  $f = $f.Replace($cssAnchor, $cssProjView)
  Write-Host "OK A CSS proj-view inserted"
}

# ─── B. HTML: inserter projViewMode + wrapper projFormMode ───────────────────
$htmlOldOpen = "        <div class=`"dash-container`">`r`n          <div class=`"projet-steps`">"
Write-Host "HTML open found: $($f.Contains($htmlOldOpen))"

if ($f.Contains($htmlOldOpen)) {
  $nl = "`r`n"
  $h = "        <div id=`"projViewMode`" style=`"display:none`">" + $nl
  $h += "          <div class=`"dash-container`">" + $nl
  $h += "            <div class=`"proj-view-header`">" + $nl
  $h += "              <div class=`"proj-view-title`">" + $nl
  $h += "                <i class=`"fa fa-folder-open`"></i>" + $nl
  $h += "                <div>" + $nl
  $h += "                  <div id=`"projViewType`" class=`"proj-view-type-label`">Mon Projet</div>" + $nl
  $h += "                  <div id=`"projViewSub`" class=`"proj-view-sub`"></div>" + $nl
  $h += "                </div>" + $nl
  $h += "              </div>" + $nl
  $h += "              <div style=`"display:flex;gap:8px;flex-wrap:wrap;align-items:center;`">" + $nl
  $h += "                <button class=`"proj-edit-btn proj-refresh-btn`" onclick=`"loadProjetTab(true)`" title=`"Rafraichir`"><i class=`"fa fa-refresh`"></i></button>" + $nl
  $h += "                <button class=`"proj-edit-btn`" onclick=`"editProjet()`"><i class=`"fa fa-edit`"></i> Modifier</button>" + $nl
  $h += "              </div>" + $nl
  $h += "            </div>" + $nl
  $h += "            <div class=`"proj-progress-section`">" + $nl
  $h += "              <div class=`"proj-progress-top`">" + $nl
  $h += "                <span>Avancement dossier</span>" + $nl
  $h += "                <span id=`"projProgressPct`" style=`"color:var(--cap-orange);font-size:16px;`">0%</span>" + $nl
  $h += "              </div>" + $nl
  $h += "              <div class=`"proj-progress-bar-bg`">" + $nl
  $h += "                <div id=`"projProgressBar`" class=`"proj-progress-bar-fill`" style=`"width:0%`"></div>" + $nl
  $h += "              </div>" + $nl
  $h += "              <div id=`"projProgressSteps`" class=`"proj-progress-steps-txt`">En attente</div>" + $nl
  $h += "            </div>" + $nl
  $h += "            <div class=`"proj-subtabs-row`">" + $nl
  $h += "              <button class=`"proj-subtab-btn active`" data-subtab=`"infos`" onclick=`"switchProjetSubtab('infos')`"><i class=`"fa fa-info-circle`"></i> Infos</button>" + $nl
  $h += "              <button class=`"proj-subtab-btn`" data-subtab=`"etapes`" onclick=`"switchProjetSubtab('etapes')`"><i class=`"fa fa-list-ol`"></i> Etapes</button>" + $nl
  $h += "              <button class=`"proj-subtab-btn`" data-subtab=`"documents`" onclick=`"switchProjetSubtab('documents')`"><i class=`"fa fa-file`"></i> Documents</button>" + $nl
  $h += "              <button class=`"proj-subtab-btn`" data-subtab=`"paiements`" onclick=`"switchProjetSubtab('paiements')`"><i class=`"fa fa-credit-card`"></i> Paiements</button>" + $nl
  $h += "              <button class=`"proj-subtab-btn`" data-subtab=`"conseiller`" onclick=`"switchProjetSubtab('conseiller')`"><i class=`"fa fa-user-tie`"></i> Conseiller</button>" + $nl
  $h += "            </div>" + $nl
  $h += "            <div id=`"projSubtabContent`"></div>" + $nl
  $h += "          </div>" + $nl
  $h += "        </div>" + $nl
  $h += "        <div id=`"projFormMode`">" + $nl
  $h += "        <div class=`"dash-container`">" + $nl
  $h += "          <div class=`"projet-steps`">"
  $f = $f.Replace($htmlOldOpen, $h)
  Write-Host "OK B HTML projViewMode inserted"
}

# ─── C. HTML: fermer projFormMode ────────────────────────────────────────────
$htmlOldClose = "          </div>`r`n        </div>`r`n      </section>`r`n`r`n      <!-- ===== ONGLET 2 : SERVICES ===== -->"
$htmlNewClose = "          </div>`r`n        </div>`r`n        </div><!-- /projFormMode -->`r`n      </section>`r`n`r`n      <!-- ===== ONGLET 2 : SERVICES ===== -->"
Write-Host "HTML close found: $($f.Contains($htmlOldClose))"
if ($f.Contains($htmlOldClose)) {
  $f = $f.Replace($htmlOldClose, $htmlNewClose)
  Write-Host "OK C HTML projFormMode close"
}

# ─── Write ────────────────────────────────────────────────────────────────────
$tmp = "c:\capitunecax\_fix2.tmp"
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

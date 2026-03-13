$src = "c:\capitunecax\src\pages\dashboard.astro"
$f = [IO.File]::ReadAllText($src, [Text.Encoding]::UTF8)
$originalLen = $f.Length
Write-Host "Original length: $originalLen"

# Normaliser vers LF pour comparaisons multi-lignes
function NLF($s){ return $s.Replace("`r`n","`n").Replace("`r","`n") }

# ─── 1. CSS fb-nav-avatar: 36px → 56px ───────────────────────────────────────
$old1 = '.fb-nav-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1a1a2e,#0f3460);display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;flex-shrink:0;border:2px solid var(--cap-orange);overflow:hidden;}'
$new1 = '.fb-nav-avatar{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#1a1a2e,#0f3460);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;flex-shrink:0;border:2px solid var(--cap-orange);overflow:hidden;}'
if ($f.Contains($old1)) { $f = $f.Replace($old1, $new1); Write-Host "OK 1 CSS fb-nav-avatar" }
else { Write-Host "FAIL 1 CSS fb-nav-avatar NOT FOUND" }

# ─── 2. CSS: Ajouter bloc proj-view avant /* ── DOCUMENTS ── ─────────────────
$cssAnchor = '      /* ── DOCUMENTS ─────────────────────────────────────────── */'
$cssProjView = NLF(@"
      /* ── PROJET VIEW MODE ──────────────────────────────────── */
      .proj-view-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:20px;flex-wrap:wrap;}
      .proj-view-title{display:flex;align-items:center;gap:14px;}
      .proj-view-title i{font-size:28px;color:var(--cap-orange);}
      .proj-view-type-label{font-size:18px;font-weight:700;color:#1a1a2e;}
      .proj-view-sub{font-size:13px;color:#666;margin-top:2px;}
      .proj-edit-btn{background:var(--cap-orange);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:opacity .2s;}
      .proj-edit-btn:hover{opacity:.85;}
      .proj-refresh-btn{background:#1a1a2e;padding:8px 12px;}
      .proj-progress-section{background:#fff;border-radius:12px;padding:16px 20px;margin-bottom:20px;box-shadow:0 1px 6px rgba(0,0,0,.06);}
      .proj-progress-top{display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;font-weight:600;}
      .proj-progress-bar-bg{height:10px;background:#f0f0f0;border-radius:99px;overflow:hidden;margin-bottom:8px;}
      .proj-progress-bar-fill{height:100%;background:linear-gradient(90deg,var(--cap-orange),#f7c59f);border-radius:99px;transition:width .5s ease;}
      .proj-progress-steps-txt{font-size:12px;color:#888;}
      .proj-subtabs-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;}
      .proj-subtab-btn{background:transparent;border:1.5px solid #e0e0e0;color:#666;border-radius:20px;padding:7px 16px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:.15s;}
      .proj-subtab-btn.active{background:var(--cap-orange);color:#fff;border-color:var(--cap-orange);}
      .proj-subtab-btn:hover:not(.active){background:#fff5ec;border-color:var(--cap-orange);color:var(--cap-orange);}
      .proj-subtab-content{display:none;}
      .proj-subtab-content.active{display:block;}
      .proj-infos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:20px;}
      .proj-info-card{background:#fff;border-radius:10px;padding:14px 16px;box-shadow:0 1px 6px rgba(0,0,0,.06);}
      .proj-info-card label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px;}
      .proj-info-card span{font-size:14px;font-weight:600;color:#1a1a2e;}
      .proj-step-row{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #f5f5f5;}
      .proj-step-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;margin-top:4px;}
      .proj-step-dot.completed{background:#27ae60;}
      .proj-step-dot.in_progress{background:var(--cap-orange);}
      .proj-step-dot.pending{background:#ccc;}
      .proj-step-dot.blocked{background:#e74c3c;}
      .proj-step-body{flex:1;}
      .proj-step-title{font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:2px;}
      .proj-step-badge{display:inline-block;font-size:11px;font-weight:600;border-radius:99px;padding:2px 10px;margin-bottom:4px;}
      .proj-step-badge.completed{background:#e8f5e9;color:#27ae60;}
      .proj-step-badge.in_progress{background:#fff3e0;color:var(--cap-orange);}
      .proj-step-badge.pending{background:#f5f5f5;color:#888;}
      .proj-step-badge.blocked{background:#fce8e8;color:#e74c3c;}
      .proj-step-desc{font-size:12px;color:#666;}
      .proj-empty-state{text-align:center;padding:40px 20px;color:#888;}
      .proj-empty-state i{font-size:40px;color:#ddd;margin-bottom:12px;display:block;}
      .proj-empty-state strong{display:block;font-size:15px;color:#555;margin-bottom:6px;}
      .proj-advisor-card{background:#fff;border-radius:12px;padding:20px;display:flex;gap:16px;align-items:flex-start;box-shadow:0 1px 6px rgba(0,0,0,.06);}
      .proj-advisor-avatar{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--cap-orange),#1a1a2e);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:700;flex-shrink:0;}
      .proj-advisor-info{flex:1;}
      .proj-advisor-name{font-size:16px;font-weight:700;color:#1a1a2e;}
      .proj-advisor-title{font-size:12px;color:#888;margin-bottom:10px;}
      .proj-cta-btn{background:var(--cap-orange);color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;}
      /* ── DOCUMENTS ─────────────────────────────────────────── */
"@)
if ($f.Contains($cssAnchor)) { $f = $f.Replace($cssAnchor, $cssProjView); Write-Host "OK 2 CSS proj-view" }
else { Write-Host "FAIL 2 CSS anchor NOT FOUND" }

# ─── 3. HTML: insérer projViewMode + wrapper projFormMode ────────────────────
$htmlOldOpen = NLF('        <div class="dash-container">
          <div class="projet-steps">')

$htmlNewOpen = NLF('        <div id="projViewMode" style="display:none">
          <div class="dash-container">
            <div class="proj-view-header">
              <div class="proj-view-title">
                <i class="fa fa-folder-open"></i>
                <div>
                  <div id="projViewType" class="proj-view-type-label">Mon Projet</div>
                  <div id="projViewSub" class="proj-view-sub"></div>
                </div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <button class="proj-edit-btn proj-refresh-btn" onclick="loadProjetTab(true)" title="Rafraîchir"><i class="fa fa-refresh"></i></button>
                <button class="proj-edit-btn" onclick="editProjet()"><i class="fa fa-edit"></i> Modifier</button>
              </div>
            </div>
            <div class="proj-progress-section">
              <div class="proj-progress-top">
                <span>Avancement dossier</span>
                <span id="projProgressPct" style="color:var(--cap-orange);font-size:16px;">—</span>
              </div>
              <div class="proj-progress-bar-bg">
                <div id="projProgressBar" class="proj-progress-bar-fill" style="width:0%"></div>
              </div>
              <div id="projProgressSteps" class="proj-progress-steps-txt">En attente de traitement</div>
            </div>
            <div class="proj-subtabs-row">
              <button class="proj-subtab-btn active" data-subtab="infos" onclick="switchProjetSubtab(''infos'')"><i class="fa fa-info-circle"></i> Infos</button>
              <button class="proj-subtab-btn" data-subtab="etapes" onclick="switchProjetSubtab(''etapes'')"><i class="fa fa-list-ol"></i> Étapes</button>
              <button class="proj-subtab-btn" data-subtab="documents" onclick="switchProjetSubtab(''documents'')"><i class="fa fa-file"></i> Documents</button>
              <button class="proj-subtab-btn" data-subtab="paiements" onclick="switchProjetSubtab(''paiements'')"><i class="fa fa-credit-card"></i> Paiements</button>
              <button class="proj-subtab-btn" data-subtab="conseiller" onclick="switchProjetSubtab(''conseiller'')"><i class="fa fa-user-tie"></i> Conseiller</button>
            </div>
            <div id="projSubtabContent"></div>
          </div>
        </div>
        <div id="projFormMode">
        <div class="dash-container">
          <div class="projet-steps">')

if ($f.Contains($htmlOldOpen)) { $f = $f.Replace($htmlOldOpen, $htmlNewOpen); Write-Host "OK 3a HTML projViewMode" }
else { Write-Host "FAIL 3a HTML open anchor NOT FOUND" }

# Fermer le projFormMode (juste avant </section> de tab-projet)
$htmlOldClose = NLF('          </div>
        </div>
      </section>

      <!-- ===== ONGLET 2 : SERVICES ===== -->')
$htmlNewClose = NLF('          </div>
        </div>
        </div><!-- /projFormMode -->
      </section>

      <!-- ===== ONGLET 2 : SERVICES ===== -->')
if ($f.Contains($htmlOldClose)) { $f = $f.Replace($htmlOldClose, $htmlNewClose); Write-Host "OK 3b HTML projFormMode close" }
else { Write-Host "FAIL 3b HTML close anchor NOT FOUND" }

# ─── 4a. JS switchTab: ajouter hook projet ───────────────────────────────────
$swOld = "      if (tabId==='documents') loadDocumentsTab();"
$swNew = NLF("      if (tabId==='documents') loadDocumentsTab();
      if (tabId==='projet') loadProjetTab();")
if ($f.Contains($swOld)) { $f = $f.Replace($swOld, $swNew); Write-Host "OK 4a switchTab hook" }
else { Write-Host "FAIL 4a switchTab anchor NOT FOUND" }

# ─── 4b. JS: ajouter fonctions projet avant confirmCancelDemande ─
$jsAnchor = "    window.confirmCancelDemande"
$jsNewFunctions = NLF(@'
    // ============================================================
    //  PROJET VIEW MODE — logique style mobile
    // ============================================================
    var _projetViewLoaded = false;

    window.loadProjetTab = async function(force) {
      if (_projetViewLoaded && !force) return;
      _projetViewLoaded = true;
      try {
        var res = await fetch('/api/projet', { headers: { Accept: 'application/json' } });
        if (!res.ok) { showProjFormMode(); return; }
        var data = await res.json().catch(function(){ return {}; });
        var project = data && data.project ? data.project : null;
        if (!project || !project.type) { showProjFormMode(); return; }
        // Mettre à jour le formulaire local
        ST.projet = project;
        restoreProjetForm(project);
        renderProjetView(project);
        showProjViewMode();
      } catch(e) {
        // Fallback : afficher le formulaire
        showProjFormMode();
      }
    };

    function showProjViewMode() {
      var vm = document.getElementById('projViewMode');
      var fm = document.getElementById('projFormMode');
      if (vm) vm.style.display = '';
      if (fm) fm.style.display = 'none';
    }

    function showProjFormMode() {
      var vm = document.getElementById('projViewMode');
      var fm = document.getElementById('projFormMode');
      if (vm) vm.style.display = 'none';
      if (fm) fm.style.display = '';
    }

    window.editProjet = function() {
      _projetViewLoaded = false;
      showProjFormMode();
    };

    window.switchProjetSubtab = function(key) {
      document.querySelectorAll('.proj-subtab-btn').forEach(function(b){
        b.classList.toggle('active', b.dataset.subtab === key);
      });
      document.querySelectorAll('.proj-subtab-content').forEach(function(c){ c.classList.remove('active'); });
      var pane = document.getElementById('projPane-'+key);
      if (pane) pane.classList.add('active');
    };

    function renderProjetView(p) {
      var TYPE_LABELS = {
        rp:'Résidence Permanente', travail:'Visa Travail', etudes:'Permis Études',
        famille:'Regroupement Familial', investissement:'Immigration Investisseur',
        refugie:'Protection Internationale', tourisme:'Visa Tourisme'
      };
      var PROVINCE_LABELS = { QC:'Québec', ON:'Ontario', BC:'Colombie-Brit.', AB:'Alberta', MB:'Manitoba', SK:'Saskatchewan', NS:'Nouvelle-Écosse', NB:'Nouveau-Brunswick', autre:'Flexible' };
      var DIPLOME_LABELS = { sans:'Sans diplôme', technique:'Technique/Métier', college:'Collège', bac:'Baccalauréat', licence:'Licence (BAC+3)', master:'Master (BAC+5)', doctorat:'Doctorat/PhD' };
      var STATUT_CFG = {
        proposition:{ label:'Proposition', pct:15, txt:'Votre dossier a été reçu' },
        demarre:{ label:'Démarré', pct:40, txt:'Votre dossier est en cours de traitement' },
        en_cours:{ label:'En cours', pct:55, txt:'Traitement avancé' },
        soumis:{ label:'Soumis', pct:70, txt:'Dossier soumis aux autorités' },
        termine:{ label:'Terminé', pct:100, txt:'Dossier complété' }
      };
      var statusKey = String(p.status || 'proposition').toLowerCase();
      var sc = STATUT_CFG[statusKey] || { label: p.status || 'Proposition', pct: 15, txt: 'En attente' };

      // Titre
      var titleEl = document.getElementById('projViewType');
      if (titleEl) titleEl.textContent = TYPE_LABELS[p.type] || p.type || 'Mon Projet';
      var subEl = document.getElementById('projViewSub');
      if (subEl) subEl.textContent = [PROVINCE_LABELS[p.province]||p.province, p.pays].filter(Boolean).join(' · ');

      // Barre progression
      var bar = document.getElementById('projProgressBar');
      if (bar) bar.style.width = sc.pct + '%';
      var pct = document.getElementById('projProgressPct');
      if (pct) pct.textContent = sc.pct + '%';
      var stxt = document.getElementById('projProgressSteps');
      if (stxt) stxt.textContent = sc.txt;

      // Render sous-onglets
      var content = document.getElementById('projSubtabContent');
      if (!content) return;

      var languesStr = Array.isArray(p.langues) ? p.langues.map(function(l){
        var lm={fr:'Français',en:'Anglais',es:'Espagnol',ar:'Arabe',pt:'Portugais',zh:'Mandarin',de:'Allemand',it:'Italien'};
        return lm[l]||l;
      }).join(', ') : '—';

      var infosHtml = '<div class="proj-subtab-content active" id="projPane-infos">'
        + '<div class="proj-infos-grid">'
        + infoCard('Type de projet', TYPE_LABELS[p.type]||p.type||'—')
        + infoCard('Province cible', PROVINCE_LABELS[p.province]||p.province||'—')
        + infoCard('Pays d\'origine', p.pays||'—')
        + infoCard('Délai souhaité', p.delai||'—')
        + infoCard('Personnes', p.nbpersonnes||'—')
        + infoCard('Diplôme', DIPLOME_LABELS[p.diplome]||p.diplome||'—')
        + infoCard('Domaine', p.domaine||'—')
        + infoCard('Expérience', p.experience||'—')
        + infoCard('Situation fam.', p.famille||'—')
        + infoCard('Statut dossier', '<span style="color:var(--cap-orange);font-weight:700;">'+sc.label+'</span>')
        + infoCard('Langues', languesStr)
        + '</div>'
        + (p.notes ? '<div style="background:#fff;border-radius:10px;padding:14px 16px;box-shadow:0 1px 6px rgba(0,0,0,.06);"><label style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px;">Notes</label><p style="font-size:13px;color:#444;margin:0;">'+p.notes+'</p></div>' : '')
        + '</div>';

      var etapesHtml = '<div class="proj-subtab-content" id="projPane-etapes">'
        + buildEtapesFromStatus(statusKey, p)
        + '</div>';

      var docsHtml = '<div class="proj-subtab-content" id="projPane-documents">'
        + '<div class="proj-empty-state"><i class="fa fa-file-text-o"></i><strong>Documents à fournir</strong>'
        + '<p style="font-size:13px;max-width:320px;margin:0 auto 16px;">Vos documents requis seront listés ici une fois votre conseiller assigné.</p>'
        + '<button class="proj-cta-btn" onclick="switchTab(\'documents\')"><i class="fa fa-arrow-right"></i> Aller à l\'espace Documents</button></div>'
        + '</div>';

      var paiementsHtml = '<div class="proj-subtab-content" id="projPane-paiements">'
        + '<div class="proj-empty-state"><i class="fa fa-credit-card"></i><strong>Paiements</strong>'
        + '<p style="font-size:13px;max-width:320px;margin:0 auto 16px;">Consultez et gérez vos paiements dans l\'onglet dédié.</p>'
        + '<button class="proj-cta-btn" onclick="switchTab(\'paiements\')"><i class="fa fa-arrow-right"></i> Voir les paiements</button></div>'
        + '</div>';

      var conseillerHtml = '<div class="proj-subtab-content" id="projPane-conseiller">'
        + '<div class="proj-empty-state"><i class="fa fa-user-tie"></i><strong>Conseiller assigné</strong>'
        + '<p style="font-size:13px;max-width:320px;margin:0 auto 16px;">Un conseiller vous sera assigné selon votre profil. Vous recevrez une notification.</p>'
        + '<button class="proj-cta-btn" onclick="switchTab(\'messagerie\')"><i class="fa fa-comments"></i> Contacter CAPITUNE</button></div>'
        + '</div>';

      content.innerHTML = infosHtml + etapesHtml + docsHtml + paiementsHtml + conseillerHtml;
    }

    function infoCard(label, val) {
      return '<div class="proj-info-card"><label>'+label+'</label><span>'+val+'</span></div>';
    }

    function buildEtapesFromStatus(statusKey, p) {
      var etapes = [
        { key:'profil', label:'Profil projet soumis', desc:'Vos informations personnelles et objectifs.' },
        { key:'attribution', label:'Attribution d\'un conseiller', desc:'Un conseiller CAPITUNE est assigné à votre dossier.' },
        { key:'documents', label:'Collecte des documents', desc:'Rassemblement et vérification des pièces justificatives.' },
        { key:'preparation', label:'Préparation du dossier', desc:'Montage complet du dossier d\'immigration.' },
        { key:'soumission', label:'Soumission officielle', desc:'Transmission aux autorités compétentes.' },
        { key:'suivi', label:'Suivi et réponse', desc:'Suivi de la décision et accompagnement post-soumission.' }
      ];
      var doneMap = { proposition:['profil'], demarre:['profil','attribution'], en_cours:['profil','attribution','documents'], soumis:['profil','attribution','documents','preparation','soumission'], termine:['profil','attribution','documents','preparation','soumission','suivi'] };
      var done = doneMap[statusKey] || ['profil'];
      var inProgKeys = { proposition:'attribution', demarre:'documents', en_cours:'preparation', soumis:'suivi', termine:'' };
      var inProg = inProgKeys[statusKey] || '';
      var html = '';
      etapes.forEach(function(e) {
        var st = done.indexOf(e.key) !== -1 ? 'completed' : (e.key === inProg ? 'in_progress' : 'pending');
        var badges = { completed:'Complété', in_progress:'En cours', pending:'En attente', blocked:'Bloqué' };
        html += '<div class="proj-step-row">'
          + '<div class="proj-step-dot '+st+'"></div>'
          + '<div class="proj-step-body">'
          + '<div class="proj-step-title">'+e.label+'</div>'
          + '<span class="proj-step-badge '+st+'">'+badges[st]+'</span>'
          + '<div class="proj-step-desc">'+e.desc+'</div>'
          + '</div></div>';
      });
      return html || '<div class="proj-empty-state"><i class="fa fa-list-ol"></i><strong>Aucune étape disponible</strong></div>';
    }

    window.confirmCancelDemande
'@)
if ($f.Contains($jsAnchor)) {
  $f = $f.Replace($jsAnchor, $jsNewFunctions)
  Write-Host "OK 4b JS functions"
} else { Write-Host "FAIL 4b JS anchor NOT FOUND" }

# ─── Write ────────────────────────────────────────────────────────────────────
$tmp = "c:\capitunecax\_patch_projet.tmp"
[IO.File]::WriteAllText($tmp, $f, [Text.Encoding]::UTF8)
$check = [IO.File]::ReadAllText($tmp, [Text.Encoding]::UTF8)
Write-Host "New length: $($check.Length)"
if ($check.Length -gt ($originalLen + 1000)) {
  [IO.File]::WriteAllText($src, $check, [Text.Encoding]::UTF8)
  Write-Host "SAVED dashboard.astro OK"
  Remove-Item $tmp -Force
} else {
  Write-Host "ABORT file too small len=$($check.Length)"
}

# Fix encodage CAPI block + injection CSS wizard
$file = "src\pages\dashboard.astro"
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)
Write-Host "Total lignes: $($lines.Length)"

# Le nouveau bloc CAPI (lignes 5493..5983 dans le fichier actuel = indices 5492..5982)
$newCapiBlock = @'
    // ============================================================
    //  CAPI WIZARD – parcours orientation 8 etapes
    // ============================================================
    var _capiState = {};

    var CAPI_OUTSIDE_OBJ = [
      { id:'visiter', motif:'visiter', emoji:'✈️', label:'Visiter / Tourisme', desc:'Voyager ou visiter de la famille' },
      { id:'travailler', motif:'travailler', emoji:'💼', label:'Travailler', desc:'Permis de travail temporaire ou ouvert' },
      { id:'etudier', motif:'etudier', emoji:'🎓', label:'Étudier', desc:"Permis d'études, établissement canadien" },
      { id:'rp', motif:'residence_permanente', emoji:'🏡', label:'Immigrer (Résidence permanente)', desc:'Entrée Express, PNP, RNIP…' },
      { id:'famille', motif:'famille', emoji:'👨‍👩‍👧', label:'Rejoindre la famille', desc:'Parrainage conjoint ou enfant' },
      { id:'entreprendre', motif:'entreprendre', emoji:'🚀', label:'Investir / Entreprendre', desc:'Créer ou développer une entreprise' },
      { id:'refugie', motif:'regularisation', emoji:'🛡️', label:'Protection (réfugié / asile)', desc:"Réinstallation/parrainage depuis l'extérieur" },
    ];
    var CAPI_INSIDE_OBJ = [
      { id:'prolonger', motif:'visiter', programmeId:'imm5708', emoji:'⏳', label:'Prolonger mon séjour (visiteur)', desc:'Extension du séjour visiteur au Canada' },
      { id:'renouv_etudes', motif:'etudier', programmeId:'imm5709', emoji:'🎓', label:"Renouveler mon permis d'études", desc:"Prorogation du permis d'études depuis le Canada" },
      { id:'changer_statut', motif:'travailler', emoji:'🔄', label:'Changer de statut / permis', desc:'PTPD post-diplôme ou changement employeur' },
      { id:'rp_inland', motif:'residence_permanente', emoji:'🏡', label:'Devenir Résident Permanent', desc:'Demander la RP depuis le Canada (CEC, PEQ…)' },
      { id:'parrainer', motif:'famille', emoji:'❤️', label:'Parrainer un proche', desc:'Faire venir un membre de la famille' },
      { id:'asile', motif:'regularisation', programmeId:'asile_en_ligne', emoji:'🛡️', label:"Demander l'asile", desc:'Démarches en ligne depuis le Canada' },
      { id:'recours', motif:'regularisation', emoji:'⚖️', label:'Régularisation / Recours', desc:'Refus, appel, motifs humanitaires' },
    ];

    var CAPI_PROGRAMMES = {
      visiter:[
        { id:'ave', titre:'Autorisation de voyage électronique (AVE)', description:'Pour les ressortissants de pays exemptés de visa.', delai:'72h', complexite:'faible', conditions:['Passeport pays éligible','Pas de refus antérieur'] },
        { id:'visa_visiteur', titre:'Visa de visiteur', description:"Pour séjourner au Canada jusqu'à 6 mois.", delai:'2-8 semaines', complexite:'faible', conditions:["Liens avec pays d'origine",'Fonds suffisants'] },
        { id:'super_visa', titre:'Super Visa parents/grands-parents', description:'Séjour de 5 ans renouvelable pour famille.', delai:'4-8 semaines', complexite:'moyenne', conditions:['Invitation enfant/petit-enfant canadien','Assurance santé privée'] },
      ],
      travailler:[
        { id:'pvt', titre:'Programme Vacances-Travail (PVT)', description:'Pour les 18-35 ans de pays participants.', delai:'4-8 semaines', complexite:'faible', conditions:['Âge 18-35 ans','Pays participant'] },
        { id:'permis_ferme', titre:"Permis de travail fermé (offre d'emploi)", description:"Lié à un employeur canadien spécifique.", delai:'4-6 semaines', complexite:'moyenne', conditions:["Offre d'emploi valide",'EIMT si requis'] },
        { id:'lmia_exempt', titre:'Permis EIMT exempté', description:'Transfert intra-entreprise, accords internationaux.', delai:'2-4 semaines', complexite:'faible', conditions:['Accord ACEUMC / intra-entreprise'] },
      ],
      etudier:[
        { id:'permis_etudiant', titre:"Permis d'étudiant", description:"Pour études à temps plein dans un établissement désigné (EFD).", delai:'4-12 semaines', complexite:'faible', conditions:["Lettre d'admission EFD",'Preuve de fonds'] },
        { id:'imm5709', titre:"Prorogation permis d'études (IMM 5709)", description:"Prolonger un permis d'études depuis le Canada.", delai:'4-12 semaines', complexite:'moyenne', conditions:['Être au Canada','Déposer avant expiration'] },
      ],
      residence_permanente:[
        { id:'entree_express', titre:'Entrée Express', description:'Programme fédéral basé sur le score CRS.', delai:'6 mois', complexite:'moyenne', conditions:['Score CRS suffisant','Expérience professionnelle'] },
        { id:'pnp', titre:'Programme des Nominees Provinciaux (PNP)', description:'Nomination par une province selon ses besoins.', delai:'12-18 mois', complexite:'moyenne', conditions:['Lien avec une province','Compétences recherchées'] },
        { id:'rnip', titre:'Programme Rural et du Nord (RNIP)', description:'Pour les communautés rurales désignées.', delai:'12-24 mois', complexite:'moyenne', conditions:["Offre d'emploi admissible"] },
      ],
      famille:[
        { id:'parrainage_conjoint', titre:'Parrainage – Conjoint/Partenaire', description:'RP pour époux/épouse ou partenaire.', delai:'12 mois', complexite:'moyenne', conditions:['Répondant citoyen ou RP canadien','Relation authentique'] },
        { id:'parrainage_enfant', titre:'Parrainage – Enfant à charge', description:'Pour enfants de moins de 22 ans.', delai:'12-18 mois', complexite:'faible', conditions:['Moins de 22 ans'] },
        { id:'parrainage_parents', titre:'Parrainage – Parents et grands-parents', description:'Via la loterie annuelle PGP.', delai:'24-48 mois', complexite:'elevee', conditions:['Invitation via loterie','Revenus suffisants'] },
      ],
      entreprendre:[
        { id:'startup_visa', titre:'Visa Démarrage (Start-up Visa)', description:"Pour entrepreneurs avec soutien d'organisation désignée.", delai:'12-16 mois', complexite:'elevee', conditions:["Lettre de soutien org. désignée",'CLN 5'] },
        { id:'pnp_entrepreneur', titre:'PNP Voie Entrepreneuriale', description:"Investissement dans une province.", delai:'18-36 mois', complexite:'elevee', conditions:["Capital d'investissement"] },
      ],
      regularisation:[
        { id:'asile_canada', titre:'Demande d'asile (depuis le Canada)', description:'Démarche de protection internationale.', delai:'18-36 mois', complexite:'elevee', conditions:['Présence au Canada'] },
        { id:'ch', titre:"Motifs d'ordre humanitaire (CH)", description:"Intérêt supérieur des enfants ou situation exceptionnelle.", delai:'24-48 mois', complexite:'elevee', conditions:['Établissement au Canada'] },
        { id:'retablissement', titre:'Rétablissement de statut', description:'Si votre statut a expiré récemment.', delai:'4-12 semaines', complexite:'moyenne', conditions:['Statut expiré récemment'] },
      ],
    };

    var CAPI_FRAIS = {
      visiter:     { label:'Visa visiteur', frais:[{l:'Visa visiteur (IRCC)',m:'100 $'},{l:'Biométrie',m:'85 $'}], total:185 },
      travailler:  { label:'Permis de travail', frais:[{l:'Permis de travail (IRCC)',m:'155 $'},{l:'Biométrie',m:'85 $'}], total:240 },
      etudier:     { label:"Permis d'études", frais:[{l:"Permis d'études (IRCC)",m:'150 $'},{l:'Biométrie',m:'85 $'},{l:'Examen médical (si > 6 mois)',m:'150-300 $'}], total:460 },
      residence_permanente: { label:'Résidence permanente', frais:[{l:'RP - requérant principal',m:'1 365 $'},{l:'RP - conjoint',m:'1 365 $'},{l:'Biométrie / personne',m:'85 $'},{l:'Examen médical',m:'150-300 $'},{l:'Évaluation diplômes (WES)',m:'~320 $'},{l:'Test langue (IELTS/TEF)',m:'290-320 $'}], total:2275 },
      famille:     { label:'Regroupement familial', frais:[{l:'Parrainage (répondant)',m:'75 $'},{l:'RP - parrainé',m:'1 155 $'},{l:'Biométrie',m:'85 $'}], total:1315 },
      entreprendre:{ label:'Visa entrepreneur', frais:[{l:'Frais gouvernementaux',m:'~1 500 $'},{l:'Examen médical',m:'150-300 $'}], total:1500 },
      regularisation:{label:'Régularisation', frais:[{l:'Frais variables',m:'variable'},{l:'Consultation juridique recommandée',m:''}], total:0 },
    };

    function capiComputeEval(state) {
      var motif = state.motif || 'visiter';
      var profil = state.profil || {};
      var score = 60;
      var complexite = 'faible';
      var delai = '4-8 semaines';
      var commentaire = 'Dossier accessible avec un accompagnement approprié.';

      if (motif === 'residence_permanente') {
        var age = Number(profil.age || 35);
        var exp = Number(profil.experience || 0);
        var diplome = profil.diplome || '';
        if (age >= 25 && age <= 35) score += 10;
        if (exp >= 3) score += 10;
        if (diplome === 'Maîtrise' || diplome === 'Doctorat') score += 10;
        if (profil.langues && profil.langues.length >= 2) score += 8;
        if (profil.refus) score -= 20;
        complexite = score >= 80 ? 'faible' : score >= 60 ? 'moyenne' : 'elevee';
        delai = '6-18 mois';
      } else if (motif === 'travailler') {
        score = 70;
        if (profil.experience && Number(profil.experience) >= 2) score += 10;
        if (profil.refus) score -= 15;
        complexite = 'moyenne'; delai = '4-8 semaines';
      } else if (motif === 'etudier') {
        score = 75; complexite = 'faible'; delai = '4-12 semaines';
        if (profil.refus) score -= 12;
      } else if (motif === 'famille') {
        score = 65; complexite = 'moyenne'; delai = '12-18 mois';
      } else if (motif === 'entreprendre') {
        score = 50; complexite = 'elevee'; delai = '12-24 mois';
      } else if (motif === 'regularisation') {
        score = 45; complexite = 'elevee'; delai = '18-36 mois';
        commentaire = 'Dossier complexe, consultation juridique fortement recommandée.';
      } else {
        score = 78; complexite = 'faible'; delai = '2-8 semaines';
        commentaire = 'Démarche accessible avec les bons documents.';
      }
      score = Math.max(20, Math.min(95, score));
      return { score:score, complexite:complexite, delai:delai, commentaire:commentaire };
    }

    function capiBuildServices(motif, complexite) {
      var svcMap = {
        visiter: [
          {id:'analyse_v',nom:"Analyse d'admissibilité visiteur",desc:"Étude de votre profil et recommandations.",prio:'obligatoire',prix:149,sel:true},
          {id:'lettre_v',nom:"Rédaction de la lettre d'explication",desc:"Lettre structurée pour l'itinéraire et vos attaches.",prio:'obligatoire',prix:99,sel:true},
          {id:'prep_v',nom:'Préparation complète du dossier',desc:"Collecte et vérification des documents requis.",prio:'obligatoire',prix:199,sel:true},
          {id:'soum_v',nom:'Soumission de la demande',desc:"Dépôt officiel auprès de l'IRCC.",prio:'obligatoire',prix:199,sel:true},
          {id:'brdv_v',nom:'Prise de RDV biométrie',desc:'Aide à la réservation au CRDV.',prio:'recommande',prix:49,sel:false},
        ],
        travailler: [
          {id:'analyse_t',nom:"Analyse d'admissibilité emploi",desc:"Étude du profil et stratégie EIMT.",prio:'obligatoire',prix:149,sel:true},
          {id:'montage_t',nom:'Montage dossier permis de travail',desc:'Collecte et organisation de tous les documents.',prio:'obligatoire',prix:299,sel:true},
          {id:'soum_t',nom:'Soumission de la demande',desc:'Dépôt officiel de la demande.',prio:'obligatoire',prix:199,sel:true},
          {id:'prep_eimt',nom:"Préparation EIMT (si requis)",desc:"Accompagnement de l'employeur.",prio:'recommande',prix:299,sel:false},
        ],
        etudier: [
          {id:'analyse_e',nom:"Analyse d'admissibilité études",desc:"Vérification DLI et éligibilité.",prio:'obligatoire',prix:149,sel:true},
          {id:'montage_e',nom:"Montage dossier permis d'études",desc:'Collecte et vérification complète.',prio:'obligatoire',prix:249,sel:true},
          {id:'soum_e',nom:'Soumission de la demande',desc:'Dépôt officiel.',prio:'obligatoire',prix:149,sel:true},
          {id:'caq',nom:"CAQ – Certificat d'acceptation Québec",desc:'Obligatoire pour les études au Québec.',prio:'recommande',prix:99,sel:false},
        ],
        residence_permanente: [
          {id:'analyse_rp',nom:'Analyse Express Entry / PNP',desc:'Calcul score CRS et feuille de route.',prio:'obligatoire',prix:299,sel:true},
          {id:'montage_rp',nom:'Montage dossier RP complet',desc:'Tous les documents pour la demande RP.',prio:'obligatoire',prix:899,sel:true},
          {id:'soum_rp',nom:"Soumission de la demande RP",desc:"Dépôt officiel suite à l'ITA.",prio:'obligatoire',prix:499,sel:true},
          {id:'coaching_langue',nom:'Coaching IELTS / TEF',desc:'Préparation intensive aux tests de langue.',prio:'recommande',prix:350,sel:false},
          {id:'aide_wes',nom:'Aide évaluation diplômes (WES)',desc:'Accompagnement dans la démarche WES.',prio:'recommande',prix:149,sel:false},
        ],
        famille: [
          {id:'analyse_f',nom:'Analyse parrainage',desc:'Vérification admissibilité répondant.',prio:'obligatoire',prix:199,sel:true},
          {id:'montage_f',nom:'Montage dossier parrainage',desc:'Collecte et organisation.',prio:'obligatoire',prix:599,sel:true},
          {id:'soum_f',nom:'Soumission de la demande',desc:'Dépôt officiel.',prio:'obligatoire',prix:299,sel:true},
        ],
        entreprendre: [
          {id:'analyse_en',nom:'Analyse Visa Démarrage',desc:'Éligibilité et stratégie.',prio:'obligatoire',prix:499,sel:true},
          {id:'montage_en',nom:'Montage dossier entrepreneur',desc:'Préparation complète.',prio:'obligatoire',prix:1299,sel:true},
        ],
        regularisation: [
          {id:'consultation_r',nom:'Consultation juridique',desc:'Analyse de votre situation et options.',prio:'obligatoire',prix:299,sel:true},
          {id:'montage_r',nom:'Montage dossier',desc:'Préparation selon le type de recours.',prio:'obligatoire',prix:899,sel:true},
        ],
      };
      return (svcMap[motif] || []).map(function(s){ return Object.assign({},s); });
    }

    window.startCapiWizard = function() {
      _capiState = { step:1, where:null, motif:null, programme:null, profil:{}, eval:null, services:[], mode:null };
      var wiz = document.getElementById('capiWizard');
      var em = document.getElementById('projEmptyMode');
      if (em) em.style.display = 'none';
      if (wiz) wiz.style.display = '';
      capiRender();
    };

    function capiShowEmpty() {
      var wiz = document.getElementById('capiWizard');
      var em = document.getElementById('projEmptyMode');
      if (wiz) wiz.style.display = 'none';
      if (em) em.style.display = '';
    }

    function capiRender() {
      var step = _capiState.step || 1;
      var pct = Math.round((step / 8) * 100);
      var prog = document.getElementById('capiWizProg');
      var lbl = document.getElementById('capiWizLbl');
      if (prog) prog.style.width = pct + '%';
      if (lbl) lbl.textContent = step + '/8';
      var body = document.getElementById('capiWizBody');
      if (!body) return;
      if (step === 1) body.innerHTML = capiStep1();
      else if (step === 2) body.innerHTML = capiStep2();
      else if (step === 3) body.innerHTML = capiStep3();
      else if (step === 4) body.innerHTML = capiStep4();
      else if (step === 5) body.innerHTML = capiStep5();
      else if (step === 6) body.innerHTML = capiStep6();
      else if (step === 7) body.innerHTML = capiStep7();
      else if (step === 8) body.innerHTML = capiStep8();
    }

    window.capiBack = function() {
      if (_capiState.step <= 1) { capiShowEmpty(); return; }
      _capiState.step--;
      capiRender();
    };

    window.capiSelectWhere = function(where) {
      _capiState.where = where;
      _capiState.step = 2;
      capiRender();
    };

    window.capiSelectObjectif = function(el) {
      var id = el.dataset.id;
      var motif = el.dataset.motif;
      var progId = el.dataset.programme || '';
      _capiState.objectifId = id;
      _capiState.motif = motif;
      if (progId) _capiState.programme = progId;
      _capiState.step = 3;
      capiRender();
    };

    window.capiSelectProgramme = function(el) {
      document.querySelectorAll('.capi-prog-card').forEach(function(c){ c.classList.remove('selected'); });
      el.classList.add('selected');
      _capiState.programme = el.dataset.id;
    };

    window.capiNextProgramme = function() {
      if (!_capiState.programme) { showToast('Veuillez sélectionner un programme.','info'); return; }
      _capiState.step = 4;
      capiRender();
    };

    window.capiNextProfil = function() {
      var p = {};
      ['capi-nationalite','capi-age','capi-diplome','capi-experience','capi-province','capi-delai','capi-budget'].forEach(function(id){
        var el = document.getElementById(id); if (el) p[id.replace('capi-','')] = el.value;
      });
      var langues = [];
      document.querySelectorAll('.capi-chip[data-langue].selected').forEach(function(c){ langues.push(c.dataset.langue); });
      p.langues = langues;
      var refEl = document.getElementById('capi-refus');
      p.refus = refEl ? refEl.checked : false;
      _capiState.profil = p;
      _capiState.eval = capiComputeEval(_capiState);
      _capiState.services = capiBuildServices(_capiState.motif, _capiState.eval.complexite);
      _capiState.step = 5;
      capiRender();
    };

    window.capiToggleLangue = function(el) { el.classList.toggle('selected'); };
    window.capiToggleSvc = function(el) {
      var id = el.dataset.id;
      var svc = (_capiState.services||[]).find(function(s){ return s.id===id; });
      if (svc && svc.prio !== 'obligatoire') { svc.sel = !svc.sel; el.classList.toggle('selected'); }
    };

    window.capiNextEval = function() { _capiState.step = 6; capiRender(); };
    window.capiNextServices = function() { _capiState.step = 7; capiRender(); };
    window.capiSelectMode = function(mode) {
      _capiState.mode = mode;
      document.querySelectorAll('.capi-mode-card').forEach(function(c){ c.classList.toggle('selected', c.dataset.mode === mode); });
    };
    window.capiNextMode = function() {
      if (!_capiState.mode) { showToast('Veuillez choisir un mode.','info'); return; }
      _capiState.step = 8;
      capiRender();
    };

    window.capiActivate = async function() {
      var btn = document.getElementById('capiBtnActivate');
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Activation…'; }
      try {
        var motifMap = { visiter:'tourisme', travailler:'travail', etudier:'etudes', residence_permanente:'rp', famille:'famille', entreprendre:'investissement', regularisation:'refugie' };
        var payload = {
          type: motifMap[_capiState.motif] || _capiState.motif,
          province: _capiState.profil.province || '',
          pays: _capiState.profil.nationalite || '',
          diplome: _capiState.profil.diplome || '',
          domaine: '',
          experience: _capiState.profil.experience || '',
          famille: '',
          enfants: '0',
          conjoint: 'na',
          delai: _capiState.profil.delai || '',
          nbpersonnes: '1',
          notes: 'Programme: ' + (_capiState.programme||'') + ' | Mode: ' + (_capiState.mode||''),
          langues: _capiState.profil.langues || [],
          status: 'proposition',
        };
        var res = await fetch('/api/projet', { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('API error');
      } catch(e) { /* continue */ }
      localStorage.setItem('capitune_projet', JSON.stringify(Object.assign({savedAt:new Date().toISOString()}, _capiState.profil, { motif:_capiState.motif, programme:_capiState.programme, mode:_capiState.mode })));
      markStepDone('step-projet');
      var wiz = document.getElementById('capiWizard');
      if (wiz) wiz.style.display = 'none';
      _projetViewLoaded = false;
      showToast('Votre projet a été créé ! Bienvenue chez CAPITUNE.', 'success');
      loadProjetTab(true);
    };

    // ── Renderers des 8 étapes ────────────────────────────────────

    function capiStep1() {
      return '<div class="capi-bubble-row">'
        + '<div class="capi-bubble-avatar">🤖</div>'
        + '<div class="capi-bubble-text">Bonjour ! Je suis CAPI, votre agent d\'orientation immigration.<br><br>Pour mieux vous orienter, commençons par une question simple :</div>'
        + '</div>'
        + '<div class="capi-wiz-q">Où vous trouvez-vous actuellement ?</div>'
        + '<div class="capi-opt-card" onclick="capiSelectWhere(\'outside\')" style="cursor:pointer;">'
        + '<div class="capi-opt-emoji">🌍</div>'
        + '<div class="capi-opt-info"><div class="capi-opt-label">À l\'extérieur du Canada</div>'
        + '<div class="capi-opt-desc">Je vis dans un autre pays et souhaite venir au Canada.</div></div>'
        + '<div class="capi-opt-arrow">›</div></div>'
        + '<div class="capi-opt-card" onclick="capiSelectWhere(\'inside\')" style="cursor:pointer;">'
        + '<div class="capi-opt-emoji">📍</div>'
        + '<div class="capi-opt-info"><div class="capi-opt-label">À l\'intérieur du Canada</div>'
        + '<div class="capi-opt-desc">Je suis déjà au Canada et veux changer/renouveler mon statut.</div></div>'
        + '<div class="capi-opt-arrow">›</div></div>';
    }

    function capiStep2() {
      var opts = _capiState.where === 'inside' ? CAPI_INSIDE_OBJ : CAPI_OUTSIDE_OBJ;
      var bubble = _capiState.where === 'inside'
        ? "Vous êtes déjà au Canada – voyons quel est votre objectif principal."
        : "Vous êtes à l'extérieur du Canada – quel est votre objectif principal ?";
      var html = '<div class="capi-bubble-row"><div class="capi-bubble-avatar">🤖</div>'
        + '<div class="capi-bubble-text">'+bubble+'</div></div>'
        + '<div class="capi-wiz-q">Quel est votre objectif principal ?</div>';
      opts.forEach(function(o){
        html += '<div class="capi-opt-card" data-id="'+o.id+'" data-motif="'+o.motif+'" data-programme="'+(o.programmeId||'')+'" onclick="capiSelectObjectif(this)" style="cursor:pointer;">'
          + '<div class="capi-opt-emoji">'+o.emoji+'</div>'
          + '<div class="capi-opt-info"><div class="capi-opt-label">'+o.label+'</div><div class="capi-opt-desc">'+o.desc+'</div></div>'
          + '<div class="capi-opt-arrow">›</div></div>';
      });
      return html;
    }

    function capiStep3() {
      var progs = CAPI_PROGRAMMES[_capiState.motif] || [];
      var html = '<div class="capi-bubble-row"><div class="capi-bubble-avatar">🤖</div>'
        + '<div class="capi-bubble-text">Parfait. Voici les programmes disponibles pour votre objectif. Sélectionnez celui qui correspond le mieux à votre situation.</div></div>'
        + '<div class="capi-wiz-q">Quel programme vous correspond ?</div>';
      progs.forEach(function(p){
        var selected = _capiState.programme === p.id ? ' selected' : '';
        var cxCfg = {faible:{l:'Complexité faible',c:'#27ae60'}, moyenne:{l:'Complexité moyenne',c:'#f59e0b'}, elevee:{l:'Complexité élevée',c:'#e74c3c'}};
        var cx = cxCfg[p.complexite] || cxCfg.moyenne;
        html += '<div class="capi-prog-card'+selected+'" data-id="'+p.id+'" onclick="capiSelectProgramme(this)">'
          + '<div class="capi-prog-top"><div class="capi-prog-title">'+p.titre+'</div>'
          + '<span class="capi-prog-delay"><i class="fa fa-clock-o"></i> '+p.delai+'</span></div>'
          + '<div class="capi-prog-desc">'+p.description+'</div>'
          + '<div class="capi-prog-tags">'
          + '<span class="capi-complexite-pill '+p.complexite+'">'+cx.l+'</span>'
          + p.conditions.map(function(c){ return '<span class="capi-prog-tag">'+c+'</span>'; }).join('')
          + '</div></div>';
      });
      html += '<button class="capi-wiz-btn" onclick="capiNextProgramme()"><i class="fa fa-arrow-right"></i> Continuer</button>';
      return html;
    }

    function capiStep4() {
      var isVisiteur = _capiState.motif === 'visiter';
      return '<div class="capi-bubble-row"><div class="capi-bubble-avatar">🤖</div>'
        + '<div class="capi-bubble-text">Quelques informations sur votre profil pour personnaliser votre évaluation.</div></div>'
        + '<div class="capi-wiz-q">Votre profil</div>'
        + '<div class="capi-form-group"><label>Nationalité / Pays d\'origine</label>'
        + '<input type="text" id="capi-nationalite" placeholder="Ex : Maroc, Sénégal, France…" value="'+((_capiState.profil||{}).nationalite||'')+'"></div>'
        + (isVisiteur ? '' :
          '<div class="capi-form-row">'
          + '<div class="capi-form-group"><label>Âge</label><input type="number" id="capi-age" min="18" max="80" placeholder="Ex : 28" value="'+((_capiState.profil||{}).age||'')+'"></div>'
          + '<div class="capi-form-group"><label>Années d\'expérience</label><input type="number" id="capi-experience" min="0" max="40" placeholder="Ex : 3" value="'+((_capiState.profil||{}).experience||'')+'"></div>'
          + '</div>'
          + '<div class="capi-form-group"><label>Niveau de diplôme</label>'
          + '<select id="capi-diplome"><option value="">-- Choisir --</option>'
          + ['Aucun','Secondaire','Technique / DEP','Baccalauréat','Maîtrise','Doctorat'].map(function(d){ return '<option'+((_capiState.profil||{}).diplome===d?' selected':'')+'>'+d+'</option>'; }).join('')
          + '</select></div>'
        )
        + '<div class="capi-form-group"><label>Province de destination</label>'
        + '<select id="capi-province"><option value="">-- Choisir --</option>'
        + ['Québec','Ontario','Colombie-Britannique','Alberta','Manitoba','Saskatchewan','Autre'].map(function(p){ return '<option'+((_capiState.profil||{}).province===p?' selected':'')+'>'+p+'</option>'; }).join('')
        + '</select></div>'
        + '<div class="capi-form-row">'
        + '<div class="capi-form-group"><label>Délai souhaité</label><select id="capi-delai"><option value="">-- Choisir --</option>'
        + ['Urgent (< 3 mois)','Dans 6 mois','Dans 1 an','Flexible'].map(function(d){ return '<option>'+d+'</option>'; }).join('')
        + '</select></div>'
        + '<div class="capi-form-group"><label>Budget estimé</label><select id="capi-budget"><option value="">-- Choisir --</option>'
        + ['< 2 000 $','2 000 – 5 000 $','> 5 000 $'].map(function(b){ return '<option>'+b+'</option>'; }).join('')
        + '</select></div></div>'
        + (isVisiteur ? '' :
          '<div class="capi-form-group"><label>Langues</label><div class="capi-chips">'
          + ['Français','Anglais','Espagnol','Arabe','Autre'].map(function(l){
              var sel = ((_capiState.profil||{}).langues||[]).indexOf(l)!==-1;
              return '<span class="capi-chip'+(sel?' selected':'')+'" data-langue="'+l+'" onclick="capiToggleLangue(this)">'+l+'</span>';
            }).join('')
          + '</div></div>'
          + '<div class="capi-form-group" style="display:flex;align-items:center;gap:10px;">'
          + '<input type="checkbox" id="capi-refus"'+((_capiState.profil||{}).refus?' checked':'')+'>'
          + '<label for="capi-refus" style="text-transform:none;letter-spacing:0;font-size:13px;font-weight:500;">J\'ai eu un refus de visa antérieur</label></div>'
        )
        + '<button class="capi-wiz-btn" onclick="capiNextProfil()"><i class="fa fa-arrow-right"></i> Évaluer mon dossier</button>';
    }

    function capiStep5() {
      var ev = _capiState.eval || {};
      var score = ev.score || 60;
      var scoreColor = score >= 70 ? '#27ae60' : score >= 50 ? '#f59e0b' : '#e74c3c';
      var fraisData = CAPI_FRAIS[_capiState.motif] || CAPI_FRAIS.visiter;
      return '<div class="capi-bubble-row"><div class="capi-bubble-avatar">🤖</div>'
        + '<div class="capi-bubble-text">Voici l\'évaluation de votre dossier basée sur votre profil. Ces résultats sont <strong>indicatifs</strong>.</div></div>'
        + '<div class="capi-eval-score">'
        + '<div class="capi-eval-score-left"><h3>Score de faisabilité</h3><p>'+ev.commentaire+'</p></div>'
        + '<div class="capi-score-circle" style="border-color:'+scoreColor+';color:'+scoreColor+';">'+score+'%</div>'
        + '</div>'
        + '<div class="capi-eval-block"><h4><i class="fa fa-clock-o" style="color:var(--cap-orange);"></i> Délai estimé : '+ev.delai+'</h4></div>'
        + '<div class="capi-eval-block"><h4><i class="fa fa-dollar" style="color:var(--cap-orange);"></i> Frais gouvernementaux</h4>'
        + fraisData.frais.map(function(f){ return '<div class="capi-fee-row"><span>'+f.l+'</span><span>'+f.m+'</span></div>'; }).join('')
        + '<div class="capi-fee-row"><span>Total estimatif</span><span>'+(fraisData.total > 0 ? fraisData.total+' $' : 'Variable')+'</span></div>'
        + '</div>'
        + '<button class="capi-wiz-btn" onclick="capiNextEval()"><i class="fa fa-arrow-right"></i> Voir les services recommandés</button>';
    }

    function capiStep6() {
      var svcs = _capiState.services || [];
      var html = '<div class="capi-bubble-row"><div class="capi-bubble-avatar">🤖</div>'
        + '<div class="capi-bubble-text">Voici les services recommandés pour votre démarche. Les services <strong>obligatoires</strong> sont présélectionnés.</div></div>'
        + '<div class="capi-wiz-q">Services recommandés</div>';
      var total = 0;
      svcs.forEach(function(s){
        if (s.sel) total += (s.prix||0);
        var selCls = s.sel ? ' selected' : '';
        var prioCls = s.prio === 'obligatoire' ? 'obligatoire' : (s.prio === 'recommande' ? 'recommande' : 'optionnel');
        var prioLbl = s.prio === 'obligatoire' ? 'Obligatoire' : (s.prio === 'recommande' ? 'Recommandé' : 'Optionnel');
        html += '<div class="capi-svc-item '+prioCls+selCls+'" data-id="'+s.id+'" onclick="capiToggleSvc(this)">'
          + '<div class="capi-svc-check">'+( s.sel ? '✓' : '')+'</div>'
          + '<div style="flex:1;">'
          + '<span class="capi-svc-prio '+prioCls+'">'+prioLbl+'</span>'
          + '<div class="capi-svc-name">'+s.nom+'</div>'
          + '<div class="capi-svc-desc">'+s.desc+'</div>'
          + '</div>'
          + (s.prix ? '<div class="capi-svc-price">'+s.prix+' $</div>' : '')
          + '</div>';
      });
      html += '<div style="background:#fff;border-radius:12px;padding:14px 16px;margin-top:8px;display:flex;justify-content:space-between;"><span style="font-weight:700;">Total estimé (services choisis)</span><span id="capiSvcTotal" style="color:var(--cap-orange);font-weight:700;">'+total+' $</span></div>';
      html += '<p style="font-size:11px;color:#aaa;margin:8px 0 0;text-align:center;">Prix indicatifs – un devis définitif sera fourni par votre conseiller.</p>';
      html += '<button class="capi-wiz-btn" onclick="capiNextServices()"><i class="fa fa-arrow-right"></i> Continuer</button>';
      return html;
    }

    function capiStep7() {
      var mode = _capiState.mode;
      return '<div class="capi-bubble-row"><div class="capi-bubble-avatar">🤖</div>'
        + '<div class="capi-bubble-text">Dernière question importante : <strong>comment souhaitez-vous avancer dans votre démarche ?</strong></div></div>'
        + '<div class="capi-wiz-q">Mode d\'accompagnement</div>'
        + '<div class="capi-mode-card'+(mode==='conseiller'?' selected':'')+'" data-mode="conseiller" onclick="capiSelectMode(\'conseiller\')">'
        + '<div class="capi-mode-icon">🧑‍💼</div>'
        + '<div class="capi-mode-title">Mode Conseiller</div>'
        + '<div class="capi-mode-desc">Un expert en immigration vous accompagne personnellement, prépare votre dossier et répond à toutes vos questions. Idéal pour les dossiers complexes.</div>'
        + '<div class="capi-mode-pills"><span class="capi-mode-pill">✓ Suivi personnalisé</span><span class="capi-mode-pill">✓ Dossier préparé</span><span class="capi-mode-pill">✓ Représentation IRCC</span></div>'
        + '</div>'
        + '<div style="text-align:center;padding:8px 0;color:#aaa;font-size:13px;font-weight:700;">– OU –</div>'
        + '<div class="capi-mode-card'+(mode==='autonomie'?' selected':'')+'" data-mode="autonomie" onclick="capiSelectMode(\'autonomie\')">'
        + '<div class="capi-mode-icon">🗺️</div>'
        + '<div class="capi-mode-title">Autonomie guidée</div>'
        + '<div class="capi-mode-desc">Gérez vous-même votre dossier étape par étape avec nos guides détaillés, checklists et modèles de documents. Pour les profils autonomes.</div>'
        + '<div class="capi-mode-pills"><span class="capi-mode-pill">✓ Guides détaillés</span><span class="capi-mode-pill">✓ Checklists</span><span class="capi-mode-pill">✓ Modèles docs</span></div>'
        + '</div>'
        + '<button class="capi-wiz-btn" onclick="capiNextMode()"><i class="fa fa-arrow-right"></i> Continuer</button>';
    }

    function capiStep8() {
      var ev = _capiState.eval || {};
      var motifLabels = {visiter:'Visiter le Canada', travailler:'Travailler au Canada', etudier:'Étudier au Canada', residence_permanente:'Résidence permanente', famille:'Regroupement familial', entreprendre:'Entreprendre au Canada', regularisation:'Régularisation de statut'};
      var modeLabel = _capiState.mode === 'conseiller' ? '🧑‍💼 Mode Conseiller' : '🗺️ Autonomie guidée';
      var scoreColor = (ev.score||60) >= 70 ? '#27ae60' : (ev.score||60) >= 50 ? '#f59e0b' : '#e74c3c';
      var totalSvcs = (_capiState.services||[]).filter(function(s){return s.sel;}).reduce(function(a,s){return a+(s.prix||0);},0);
      return '<div class="capi-bubble-row"><div class="capi-bubble-avatar">🤖</div>'
        + '<div class="capi-bubble-text">Votre projet est prêt ! Voici le <strong>récapitulatif complet</strong>. En activant, votre dossier est créé.</div></div>'
        + '<div class="capi-eval-score"><div class="capi-eval-score-left"><h3>Score de faisabilité</h3><p>'+ev.commentaire+'</p></div>'
        + '<div class="capi-score-circle" style="border-color:'+scoreColor+';color:'+scoreColor+';">'+(ev.score||60)+'%</div></div>'
        + '<div class="capi-recap-card">'
        + '<div class="capi-recap-row"><div class="capi-recap-icon">🎯</div><div><div class="capi-recap-lbl">Objectif</div><div class="capi-recap-val">'+(motifLabels[_capiState.motif]||_capiState.motif||'—')+'</div></div></div>'
        + '<div class="capi-recap-row"><div class="capi-recap-icon">📋</div><div><div class="capi-recap-lbl">Programme</div><div class="capi-recap-val">'+(_capiState.programme||'—')+'</div></div></div>'
        + '<div class="capi-recap-row"><div class="capi-recap-icon">🌍</div><div><div class="capi-recap-lbl">Nationalité</div><div class="capi-recap-val">'+(_capiState.profil.nationalite||'—')+'</div></div></div>'
        + '<div class="capi-recap-row"><div class="capi-recap-icon">📍</div><div><div class="capi-recap-lbl">Province cible</div><div class="capi-recap-val">'+(_capiState.profil.province||'—')+'</div></div></div>'
        + '<div class="capi-recap-row"><div class="capi-recap-icon">⏱️</div><div><div class="capi-recap-lbl">Délai estimé</div><div class="capi-recap-val">'+(ev.delai||'—')+'</div></div></div>'
        + '<div class="capi-recap-row"><div class="capi-recap-icon">🤝</div><div><div class="capi-recap-lbl">Mode</div><div class="capi-recap-val">'+modeLabel+'</div></div></div>'
        + (totalSvcs > 0 ? '<div class="capi-recap-row"><div class="capi-recap-icon">💰</div><div><div class="capi-recap-lbl">Services sélectionnés</div><div class="capi-recap-val">'+totalSvcs+' $ (indicatif)</div></div></div>' : '')
        + '</div>'
        + '<button class="capi-wiz-btn" id="capiBtnActivate" onclick="capiActivate()"><i class="fa fa-rocket"></i> Activer mon projet</button>'
        + '<p style="font-size:11px;color:#aaa;text-align:center;margin-top:8px;">Ces informations sont indicatives et seront vérifiées par votre conseiller.</p>';
    }
'@

# Index 0-based: le bloc commence à la ligne indice 5492 (ligne 5493 du fichier)
# et se termine à la ligne indice 5982 inclus (ligne 5983 du fichier)
$startIdx = 5492  # ligne 5493 (// === CAPI WIZARD)
$endIdx   = 5982  # ligne 5983 (closing } of capiStep8)

# Vérification
Write-Host "Ligne debut: '$($lines[$startIdx])'"
Write-Host "Ligne fin:   '$($lines[$endIdx])'"

# Construire le nouveau tableau
$newLines = $lines[0..($startIdx - 1)] + $newCapiBlock.Split("`n") + $lines[($endIdx + 1)..($lines.Length - 1)]
Write-Host "Nouvelles lignes: $($newLines.Length)"

[System.IO.File]::WriteAllLines($file, $newLines, [System.Text.Encoding]::UTF8)
Write-Host "JS CAPI remplacé OK"

# ── Injection CSS ──────────────────────────────────────────────────────────────
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

$cssBlock = @'
      /* ── CAPI WIZARD ──────────────────────────────────────── */
      #capiWizard{background:#f4f6fb;min-height:100vh;}
      .capi-wizard{max-width:520px;margin:0 auto;padding:0 0 60px;}
      .capi-wiz-header{display:flex;align-items:center;gap:10px;padding:14px 16px 10px;background:#fff;border-bottom:1px solid #eee;position:sticky;top:0;z-index:10;}
      .capi-wiz-back{width:36px;height:36px;border-radius:50%;background:#f4f6fb;border:none;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#333;flex-shrink:0;}
      .capi-wiz-prog-outer{flex:1;height:6px;background:#e8ecf0;border-radius:3px;overflow:hidden;}
      .capi-wiz-prog-inner{height:100%;background:linear-gradient(90deg,var(--cap-orange),#fb923c);border-radius:3px;transition:width .4s;}
      .capi-wiz-step-lbl{font-size:12px;color:#aaa;font-weight:600;flex-shrink:0;}
      .capi-wiz-body{padding:20px 16px 0;}
      .capi-bubble-row{display:flex;gap:10px;margin-bottom:18px;}
      .capi-bubble-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--cap-orange),#f97316);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
      .capi-bubble-text{background:#fff;border-radius:0 12px 12px 12px;padding:12px 14px;font-size:14px;color:#333;line-height:1.6;box-shadow:0 1px 6px rgba(0,0,0,.07);}
      .capi-wiz-q{font-size:18px;font-weight:700;color:#1a1a2e;margin:0 0 14px;line-height:1.3;}
      .capi-opt-card{display:flex;align-items:center;gap:12px;background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 1px 8px rgba(0,0,0,.07);border:2px solid transparent;transition:border-color .2s,box-shadow .2s;}
      .capi-opt-card:hover{border-color:var(--cap-orange);box-shadow:0 4px 16px rgba(249,115,22,.12);}
      .capi-opt-emoji{font-size:24px;width:36px;text-align:center;flex-shrink:0;}
      .capi-opt-info{flex:1;}
      .capi-opt-label{font-size:15px;font-weight:700;color:#1a1a2e;}
      .capi-opt-desc{font-size:12px;color:#888;margin-top:2px;}
      .capi-opt-arrow{font-size:20px;color:#ccc;}
      .capi-prog-card{background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 1px 8px rgba(0,0,0,.07);border:2px solid transparent;cursor:pointer;transition:border-color .2s;}
      .capi-prog-card.selected{border-color:var(--cap-orange);background:#fff8f4;}
      .capi-prog-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;}
      .capi-prog-title{font-size:14px;font-weight:700;color:#1a1a2e;flex:1;padding-right:8px;}
      .capi-prog-delay{font-size:11px;color:#888;white-space:nowrap;}
      .capi-prog-desc{font-size:12px;color:#666;margin-bottom:8px;line-height:1.5;}
      .capi-prog-tags{display:flex;flex-wrap:wrap;gap:5px;}
      .capi-prog-tag{font-size:11px;background:#f0f4ff;color:#4a7dff;padding:2px 8px;border-radius:20px;}
      .capi-complexite-pill{font-size:11px;padding:2px 8px;border-radius:20px;font-weight:600;}
      .capi-complexite-pill.faible{background:#e8f8f0;color:#27ae60;}
      .capi-complexite-pill.moyenne{background:#fef3cd;color:#d97706;}
      .capi-complexite-pill.elevee{background:#fde8e8;color:#e74c3c;}
      .capi-form-group{margin-bottom:14px;}
      .capi-form-group label{display:block;font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;}
      .capi-form-group input,.capi-form-group select{width:100%;padding:10px 12px;border:1.5px solid #e0e6ed;border-radius:10px;font-size:14px;outline:none;transition:border-color .2s;box-sizing:border-box;}
      .capi-form-group input:focus,.capi-form-group select:focus{border-color:var(--cap-orange);}
      .capi-form-row{display:flex;gap:10px;}
      .capi-form-row .capi-form-group{flex:1;}
      .capi-chips{display:flex;flex-wrap:wrap;gap:7px;}
      .capi-chip{padding:6px 12px;border-radius:20px;border:1.5px solid #e0e6ed;font-size:13px;cursor:pointer;transition:all .15s;background:#fff;}
      .capi-chip.selected{background:var(--cap-orange);border-color:var(--cap-orange);color:#fff;font-weight:600;}
      .capi-eval-score{display:flex;align-items:center;gap:14px;background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 1px 8px rgba(0,0,0,.07);}
      .capi-eval-score-left{flex:1;}
      .capi-eval-score-left h3{margin:0 0 4px;font-size:15px;font-weight:700;color:#1a1a2e;}
      .capi-eval-score-left p{margin:0;font-size:12px;color:#666;}
      .capi-score-circle{width:64px;height:64px;border-radius:50%;border:4px solid #27ae60;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;flex-shrink:0;}
      .capi-eval-block{background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:10px;box-shadow:0 1px 6px rgba(0,0,0,.06);}
      .capi-eval-block h4{margin:0 0 8px;font-size:13px;color:#333;display:flex;align-items:center;gap:6px;}
      .capi-fee-row{display:flex;justify-content:space-between;font-size:13px;color:#555;padding:4px 0;border-bottom:1px solid #f4f4f4;}
      .capi-fee-row:last-child{border-bottom:none;font-weight:700;color:#1a1a2e;}
      .capi-svc-item{display:flex;align-items:center;gap:10px;background:#fff;border-radius:12px;padding:12px 14px;margin-bottom:8px;border:2px solid transparent;cursor:pointer;transition:border-color .15s;}
      .capi-svc-item.selected{border-color:var(--cap-orange);}
      .capi-svc-item.obligatoire{opacity:.9;}
      .capi-svc-check{width:22px;height:22px;border-radius:50%;border:2px solid #ddd;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
      .capi-svc-item.selected .capi-svc-check{background:var(--cap-orange);border-color:var(--cap-orange);color:#fff;}
      .capi-svc-prio{font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;display:inline-block;margin-bottom:3px;}
      .capi-svc-prio.obligatoire{background:#fde8e8;color:#e74c3c;}
      .capi-svc-prio.recommande{background:#e8f8f0;color:#27ae60;}
      .capi-svc-prio.optionnel{background:#f4f6fb;color:#888;}
      .capi-svc-name{font-size:13px;font-weight:700;color:#1a1a2e;}
      .capi-svc-desc{font-size:11px;color:#888;}
      .capi-svc-price{font-size:13px;font-weight:700;color:var(--cap-orange);flex-shrink:0;}
      .capi-mode-card{background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;border:2px solid transparent;cursor:pointer;transition:border-color .2s;box-shadow:0 1px 8px rgba(0,0,0,.07);}
      .capi-mode-card.selected{border-color:var(--cap-orange);background:#fff8f4;}
      .capi-mode-icon{font-size:28px;margin-bottom:6px;}
      .capi-mode-title{font-size:16px;font-weight:800;color:#1a1a2e;margin-bottom:6px;}
      .capi-mode-desc{font-size:13px;color:#666;line-height:1.5;margin-bottom:10px;}
      .capi-mode-pills{display:flex;flex-wrap:wrap;gap:6px;}
      .capi-mode-pill{font-size:11px;background:#f4f6fb;color:#555;padding:3px 9px;border-radius:20px;}
      .capi-recap-card{background:#fff;border-radius:14px;padding:6px 16px;margin-bottom:14px;box-shadow:0 1px 8px rgba(0,0,0,.07);}
      .capi-recap-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f4f4f4;}
      .capi-recap-row:last-child{border-bottom:none;}
      .capi-recap-icon{font-size:20px;width:32px;text-align:center;flex-shrink:0;}
      .capi-recap-lbl{font-size:11px;color:#aaa;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
      .capi-recap-val{font-size:14px;font-weight:700;color:#1a1a2e;}
      .capi-wiz-btn{width:100%;background:linear-gradient(135deg,var(--cap-orange),#fb923c);color:#fff;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;margin-top:16px;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 20px rgba(249,115,22,.3);}
      .capi-wiz-btn:hover{opacity:.9;}
      .capi-wiz-btn:disabled{opacity:.7;cursor:not-allowed;}
'@

# Ancre CSS
$cssAnchor = '      .proj-start-btn:hover{opacity:.88;}'

if ($content.Contains($cssAnchor)) {
  # Vérifier que le CSS CAPI n'est pas déjà là
  if ($content.Contains('.capi-wizard{')) {
    Write-Host "CSS CAPI déjà présent, pas de réinjection."
  } else {
    $content = $content.Replace($cssAnchor, $cssAnchor + "`n" + $cssBlock)
    [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
    Write-Host "CSS CAPI injecté OK"
  }
} else {
  Write-Host "ERREUR: ancre CSS non trouvée: $cssAnchor"
}

Write-Host "Terminé."

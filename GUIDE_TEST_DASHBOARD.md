# Guide de Test - Dashboard CAPITUNE

## 🎯 Objectif
Tester toutes les nouvelles fonctionnalités du dashboard après les améliorations.

---

## 📍 Accès au Dashboard

1. Ouvrir l'application dans le navigateur
2. Cliquer sur **"Se connecter"** ou **"Créer un compte"** dans le header
3. Vous serez automatiquement redirigé vers `/dashboard`

---

## ✅ Tests à effectuer

### 1. **Navigation entre les tabs**

#### Test des 3 onglets principaux :

**Services** (doit être actif par défaut)
- ✅ Vérifier que l'onglet "Services" est surligné en bleu
- ✅ Contenu visible immédiatement

**Messagerie**
- ✅ Cliquer sur l'onglet "Messagerie"
- ✅ Badge avec "3" nouveaux messages visible
- ✅ Chat interface s'affiche correctement

**Paiements**
- ✅ Cliquer sur l'onglet "Paiements"
- ✅ Tableau des factures s'affiche
- ✅ Système de paiement accessible

#### ⚠️ Ce qui doit fonctionner :
- Clic sur chaque tab change immédiatement le contenu
- L'onglet actif a une bordure bleue en bas
- Pas de scintillement ou d'erreurs console

---

### 2. **Sélection personnalisée de services** ⭐ (PAR DÉFAUT)

#### 2.1 Interface de sélection

**Vérifier la visibilité** :
- ✅ Les cartes de services sont bien délimitées avec bordures épaisses
- ✅ Les checkboxes (48x48px) sont grandes et visibles
- ✅ Effet hover au survol des services
- ✅ Bordure gauche bleue de 4px quand un service est sélectionné

**Sélectionner un service** :
1. Cliquer sur la grande checkbox d'un service (ex: "Consultation stratégique")
2. ✅ Le service devient surligné avec fond bleu clair
3. ✅ Un compteur apparaît : "0/X" sous-services
4. ✅ Bouton "Voir les sous-services (X)" apparaît

#### 2.2 Sous-services

**Expand/Collapse** :
1. Cliquer sur "Voir les sous-services"
2. ✅ La liste se déploie avec animation
3. ✅ Zone grise distincte pour les sous-services
4. ✅ Chaque sous-service a sa propre checkbox

**Sélectionner des sous-services** :
1. Cocher/décocher individuellement
2. ✅ Le compteur se met à jour (ex: "2/5")
3. ✅ Le prix total change en temps réel dans le panneau de droite

#### 2.3 Panneau de tarification (à droite)

**Vérifications** :
- ✅ Prix total affiché en gros
- ✅ Détail par service visible
- ✅ Badge "Auto" pour services automatisés
- ✅ Bouton "Continuer" actif quand au moins un service sélectionné

---

### 3. **Mode Packs recommandés**

**Basculer vers les packs** :
1. Cliquer sur le bouton "📦 Packs recommandés"
2. ✅ Les 3 packs s'affichent : Essential, Standard, Premium
3. ✅ Le pack "Standard" a un badge "POPULAIRE"
4. ✅ Chaque pack affiche son prix et ses inclusions

**Sélectionner un pack** :
1. Cliquer sur "Sélectionner" d'un pack
2. ✅ Le pack est surligné avec bordure bleue
3. ✅ Prix total mis à jour
4. ✅ Bouton "Continuer" devient actif

---

### 4. **Téléversement de documents** (Étape 2)

#### 4.1 Accéder à l'étape 2
1. Sélectionner au moins un service ou pack
2. Cliquer sur "Continuer"
3. ✅ Barre de progression : 66% (Étape 2 sur 3)
4. ✅ Titre : "Téléversement des documents"

#### 4.2 Upload par clic

**Documents d'identité** :
1. Cliquer dans la zone "Passeport (requis)"
2. ✅ L'explorateur de fichiers s'ouvre
3. Sélectionner un fichier PDF ou image
4. ✅ Le fichier apparaît en dessous avec :
   - Icône PDF (rouge) ou Image (bleue)
   - Nom du fichier
   - Taille du fichier
   - Bouton X pour supprimer

**Répéter pour** :
- Photo d'identité (requis)
- Certificat de naissance (optionnel)

#### 4.3 Upload par drag & drop 🎯

**Test du glisser-déposer** :
1. Prendre un fichier depuis votre bureau
2. Le glisser sur une zone d'upload
3. ✅ La zone devient bleue pendant le survol
4. Relâcher le fichier
5. ✅ Le fichier est ajouté instantanément

#### 4.4 Upload multiple

**Documents professionnels - Diplômes** :
1. Cliquer dans la zone "Diplômes et certificats"
2. Sélectionner **plusieurs fichiers** (Ctrl+Clic ou Cmd+Clic)
3. ✅ Tous les fichiers apparaissent dans la liste
4. ✅ Possibilité de supprimer individuellement

#### 4.5 Suppression de fichiers

**Retirer un document** :
1. Cliquer sur le X rouge à droite d'un fichier
2. ✅ Le fichier disparaît immédiatement
3. ✅ Pas d'erreur console

---

### 5. **Confirmation finale** (Étape 3)

#### 5.1 Accéder à l'étape 3
1. Uploader au moins les documents requis (ou skip)
2. Cliquer sur "Continuer"
3. ✅ Barre de progression : 100% (Étape 3 sur 3)
4. ✅ Titre : "Confirmation de votre demande"

#### 5.2 Récapitulatif

**Services sélectionnés** :
- ✅ Liste complète des services et sous-services
- ✅ Prix détaillé par service
- ✅ Total affiché en gros

**Documents téléversés** :
- ✅ Liste des documents avec checkmarks verts
- ✅ Nombre de fichiers par catégorie
- ✅ Si aucun doc : Message "Aucun document téléversé"

#### 5.3 Soumission

**Soumettre la demande** :
1. Cliquer sur "Soumettre ma demande"
2. ✅ Alert de confirmation s'affiche
3. ✅ Message : "Votre demande a été soumise avec succès !"
4. ✅ Retour à l'étape 1 (reset)

---

### 6. **Navigation entre étapes**

**Boutons "Retour"** :
- ✅ Étape 2 → Retour à Étape 1 (sélection conservée)
- ✅ Étape 3 → Retour à Étape 2 (docs conservés)

**Breadcrumb progress** :
- Étape 1 : 33%
- Étape 2 : 66%
- Étape 3 : 100%

---

## 🎨 Tests visuels

### Dark Mode
1. Passer en dark mode (si disponible)
2. ✅ Tous les composants restent lisibles
3. ✅ Bordures et contrastes adaptés

### Responsive
1. Réduire la fenêtre (mobile)
2. ✅ Layout s'adapte (colonnes deviennent verticales)
3. ✅ Sidebar prix passe en bas sur mobile
4. ✅ Tabs scrollables horizontalement

---

## 🐛 Erreurs potentielles à vérifier

### Console navigateur
- ❌ Aucune erreur rouge
- ⚠️ Warnings acceptables (binding SESSION)
- ✅ Logs "Tabs initialized successfully"

### Comportements anormaux
- ❌ Tab qui ne change pas au clic
- ❌ Upload qui ne fonctionne pas
- ❌ Prix qui ne se met pas à jour
- ❌ Checkboxes qui ne répondent pas

---

## 📊 Checklist finale

### Fonctionnalités critiques
- [ ] Les 3 tabs fonctionnent
- [ ] Mode Personnalisé est par défaut
- [ ] Sélection de services visible et réactive
- [ ] Sous-services expandables
- [ ] Prix se met à jour en temps réel
- [ ] Upload par clic fonctionne
- [ ] Upload par drag & drop fonctionne
- [ ] Upload multiple fonctionne
- [ ] Suppression de fichiers fonctionne
- [ ] Navigation entre étapes fluide
- [ ] Récapitulatif complet affiché
- [ ] Soumission finale opérationnelle

### UX/UI
- [ ] Interface propre et professionnelle
- [ ] Bordures et espacements corrects
- [ ] Effets hover fonctionnels
- [ ] Animations fluides
- [ ] Messages d'aide clairs
- [ ] Responsive adapté

---

## 🚀 Statut attendu

**Toutes les fonctionnalités doivent être** :
- ✅ Visibles
- ✅ Cliquables
- ✅ Réactives
- ✅ Sans bugs

**Performance** :
- Chargement < 2 secondes
- Interactions instantanées
- Pas de lags

---

## 💡 En cas de problème

1. **Vérifier la console** : Ouvrir DevTools (F12) → Console
2. **Vider le cache** : Ctrl+Shift+R (force reload)
3. **Tester sur autre navigateur** : Chrome, Firefox, Safari
4. **Vérifier le build** : `npm run build` sans erreurs

---

**Dernière mise à jour** : 23 janvier 2026  
**Testeur** : [Votre nom]  
**Statut** : 🟢 Ready for testing

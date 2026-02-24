# 🚀 CAPITUNE - Guide de Déploiement Complet

> **Site web** : [capituneca.vercel.app](https://capituneca.vercel.app)  
> **Repository** : [github.com/ndom2504/capituneca](https://github.com/ndom2504/capituneca)

---

## 📖 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Démarrage rapide](#démarrage-rapide)
3. [Documentation détaillée](#documentation-détaillée)
4. [Architecture du projet](#architecture-du-projet)
5. [Support et dépannage](#support-et-dépannage)

---

## 🎯 Vue d'ensemble

**CAPITUNE** est une plateforme d'accompagnement pour les projets d'immigration au Canada, développée pour **Export Monde Prestige Inc.**

### Fonctionnalités principales :
- ✅ Site vitrine multipage (Accueil, Services, Tarifs, À propos, Contact)
- ✅ Système d'authentification (Email, Google, Microsoft)
- ✅ Dashboard client avec 3 onglets (Services, Messagerie, Paiements)
- ✅ Système de paiement multi-modes (Stripe, PayPal, Interac, Virement)
- ✅ Sélection de services à la carte ou en pack
- ✅ Chat interne consultant-client
- ✅ Gestion des factures et historique

### Stack technique :
- **Framework** : Astro 5 (SSR)
- **Frontend** : React 19 + TypeScript
- **Styling** : Tailwind CSS 4 + shadcn/ui
- **Backend** : Astro API Routes
- **Auth** : Auth-Astro (NextAuth)
- **Paiements** : Stripe + PayPal
- **Déploiement** : Vercel (Serverless)

---

## ⚡ Démarrage Rapide

### Option 1 : Déploiement sur Vercel (Recommandé)

**Temps estimé** : 3-5 minutes

1. **Pousser sur GitHub** :
   ```bash
   git add .
   git commit -m "🚀 Initial deployment"
   git push origin main
   ```

2. **Déployer sur Vercel** :
   - Aller sur https://vercel.com/new
   - Importer `ndom2504/capituneca`
   - Ajouter les variables d'environnement (voir section suivante)
   - Cliquer sur **Deploy**

3. **Variables d'environnement minimales** :
   ```env
   AUTH_SECRET=<générer avec: openssl rand -base64 32>
   AUTH_TRUST_HOST=true
   SITE_URL=https://capituneca.vercel.app
   PAYMENT_CURRENCY=CAD
   ```

📄 **Guide détaillé** : [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md)

---

### Option 2 : Développement Local

```bash
# Installation
npm install

# Lancement en dev
npm run dev

# Build pour Vercel
npm run build:vercel
```

---

## 📚 Documentation Détaillée

### 📄 Guides de déploiement

| Fichier | Description | Pour qui ? |
|---------|-------------|-----------|
| [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md) | Guide rapide (3 min) | Débutants |
| [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) | Guide complet et détaillé | Tous |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Checklist étape par étape | Tous |
| [GIT_PUSH_COMMANDS.md](./GIT_PUSH_COMMANDS.md) | Commandes Git prêtes | Débutants |

### 📄 Guides techniques

| Fichier | Description |
|---------|-------------|
| [AUTH_SETUP.md](./AUTH_SETUP.md) | Configuration authentification |
| [PAYMENT_CONFIG.md](./PAYMENT_CONFIG.md) | Configuration paiements |
| [PAYMENT_FEATURES.md](./PAYMENT_FEATURES.md) | Fonctionnalités paiement |
| [QUICK_START_PAYMENTS.md](./QUICK_START_PAYMENTS.md) | Démarrage rapide paiements |

---

## 🏗️ Architecture du Projet

```
capituneca/
│
├── 📁 src/
│   ├── 📁 pages/              # Pages Astro (routing)
│   │   ├── index.astro        # Accueil
│   │   ├── connexion.astro    # Login
│   │   ├── inscription.astro  # Signup
│   │   ├── dashboard.astro    # Dashboard client
│   │   ├── tarifs.astro       # Pricing
│   │   ├── a-propos.astro     # About
│   │   ├── contact.astro      # Contact
│   │   └── 📁 api/            # API Routes
│   │       ├── auth/          # Auth endpoints
│   │       └── payments/      # Payment endpoints
│   │
│   ├── 📁 components/         # React Components
│   │   ├── HeaderNav.tsx      # Navigation
│   │   ├── FooterCustom.tsx   # Footer
│   │   ├── ServiceSelector.tsx # Service selection
│   │   ├── ChatInterne.tsx    # Internal chat
│   │   ├── PaymentsTab.tsx    # Payments management
│   │   └── 📁 ui/             # shadcn/ui components
│   │
│   ├── 📁 layouts/
│   │   └── main.astro         # Main layout
│   │
│   └── 📁 styles/
│       └── global.css         # Global styles
│
├── 📁 generated/              # Webflow generated
│   ├── webflow.css            # Design system
│   └── fonts.css              # Fonts
│
├── 📄 astro.config.mjs        # Astro config (Cloudflare)
├── 📄 astro.config.vercel.mjs # Astro config (Vercel)
├── 📄 vercel.json             # Vercel config
├── 📄 package.json            # Dependencies
└── 📄 .env                    # Environment variables (local)
```

---

## 🔐 Variables d'Environnement

### 🔹 Essentielles (pour démarrer)

```env
# Auth
AUTH_SECRET=<générer avec: openssl rand -base64 32>
AUTH_TRUST_HOST=true

# Site
SITE_URL=https://capituneca.vercel.app

# Paiements
PAYMENT_CURRENCY=CAD
INTERAC_EMAIL=paiements@capitune.com
BANK_ACCOUNT_NAME=Export Monde Prestige Inc.
```

### 🔹 Stripe (Production)

```env
STRIPE_SECRET_KEY=sk_live_...
PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 🔹 PayPal (Production)

```env
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
PUBLIC_PAYPAL_CLIENT_ID=...
```

### 🔹 OAuth (Optionnel)

```env
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_MICROSOFT_ID=...
AUTH_MICROSOFT_SECRET=...
```

📄 **Liste complète** : [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md#variables-denvironnement)

---

## 🎨 Pages du Site

| Page | URL | Description |
|------|-----|-------------|
| **Accueil** | `/` | Landing page avec hero et services |
| **Services** | `/#services` | Description des services (section) |
| **Tarifs** | `/tarifs` | Pricing avec 3 packs + à la carte |
| **À Propos** | `/a-propos` | Mission, valeurs, expertise |
| **Contact** | `/contact` | Formulaire + infos contact |
| **Connexion** | `/connexion` | Login (Email/Google/Microsoft) |
| **Inscription** | `/inscription` | Signup |
| **Dashboard** | `/dashboard` | Espace client (3 onglets) |

---

## 💳 Système de Paiement

### Modes de paiement supportés :

1. **💳 Carte bancaire** (Stripe)
   - Paiement sécurisé 3D Secure
   - Confirmation instantanée
   
2. **🅿️ PayPal**
   - Redirection vers PayPal
   - Retour automatique

3. **📧 Interac e-Transfer**
   - Instructions avec email
   - Confirmation manuelle

4. **🏦 Virement bancaire**
   - Coordonnées bancaires
   - Confirmation manuelle

### Flux de paiement :

```
Client → Sélection service → Génération facture → Choix mode paiement
→ Paiement → Webhook/Confirmation → Mise à jour statut → Email confirmation
```

---

## 🔄 Workflow de Développement

### Développement local :

```bash
# Installer les dépendances
npm install

# Lancer le serveur dev
npm run dev

# Ouvrir dans le navigateur
http://localhost:3000
```

### Déploiement :

```bash
# 1. Faire vos modifications
# 2. Tester localement
npm run dev

# 3. Build pour Vercel
npm run build:vercel

# 4. Commit et push
git add .
git commit -m "✨ Nouvelle fonctionnalité"
git push origin main

# 5. Vercel redéploie automatiquement ! 🎉
```

---

## 🧪 Tests

### Tests manuels recommandés :

- [ ] Navigation entre toutes les pages
- [ ] Formulaire de contact
- [ ] Inscription + Connexion
- [ ] Accès au dashboard
- [ ] Sélection de services
- [ ] Chat interne
- [ ] Paiement test (Stripe mode test)
- [ ] Responsive (mobile, tablette, desktop)

---

## 🐛 Support et Dépannage

### Erreurs courantes :

**Build échoue sur Vercel** :
```bash
# Vérifier localement
npm run build:vercel

# Si ça marche localement :
# → Vérifier les variables d'environnement sur Vercel
```

**OAuth ne fonctionne pas** :
- Vérifier les URLs de redirection (Google/Microsoft)
- URL doit être : `https://capituneca.vercel.app/api/auth/callback/{provider}`

**Webhooks Stripe non reçus** :
- Vérifier l'endpoint : `https://capituneca.vercel.app/api/payments/webhook-stripe`
- Vérifier le `STRIPE_WEBHOOK_SECRET`

### Logs et monitoring :

- **Vercel Logs** : https://vercel.com/ndom2504/capituneca/logs
- **Analytics** : https://vercel.com/ndom2504/capituneca/analytics

---

## 📞 Contact et Support

### Documentation externe :

- **Vercel** : https://vercel.com/docs
- **Astro** : https://docs.astro.build
- **Stripe** : https://stripe.com/docs
- **PayPal** : https://developer.paypal.com/docs

### Projet :

- **Email** : contact@capitune.com
- **GitHub** : https://github.com/ndom2504/capituneca

---

## 📊 Statistiques du Projet

- **Lignes de code** : ~5,000+
- **Pages** : 7 pages principales
- **Composants** : 15+ composants React
- **API Routes** : 8 endpoints
- **Modes de paiement** : 4
- **Langues** : Français (principale)

---

## 🎉 Crédits

**Développé pour** : Export Monde Prestige Inc.  
**Projet** : CAPITUNE - Accompagnement immigration Canada  
**Tech Stack** : Astro, React, TypeScript, Tailwind CSS, Vercel  
**Année** : 2026

---

## 📜 Licence

Propriétaire - Export Monde Prestige Inc.  
Tous droits réservés © 2026

---

## 🚀 Prêt à Déployer ?

**➡️ Commencez par** : [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md)

**Besoin d'aide ?** : Consultez [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

**Let's go ! 🎉**

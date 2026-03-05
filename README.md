 🚀 CAPITUNE - Plateforme d'Accompagnement Immigration Canada

[![Vercel](https://img.shields.io/badge/Déployer-Vercel-black?logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/ndom2504/capituneca)
[![Astro](https://img.shields.io/badge/Astro-5.13-blueviolet?logo=astro)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)

> Plateforme web complète pour **Export Monde Prestige Inc.** - Accompagnement structuré et sécurisé pour les projets d'immigration au Canada.

**🔗 Site en ligne** : [capituneca.vercel.app](https://capituneca.vercel.app)

---

## ⚡ Démarrage Ultra-Rapide

**Nouveau ici ? Commencez par :**

```
1️⃣  Lisez : START_HERE.md (10 secondes)
2️⃣  Suivez : DEPLOY_QUICK_START.md (3 minutes)
3️⃣  Déployez sur Vercel : https://vercel.com/new
```

**📚 Documentation complète** : [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

---

## 📋 Vue d'Ensemble

### 🎯 Objectif
CAPITUNE offre un accompagnement professionnel pour structurer et sécuriser les projets d'immigration au Canada, de la consultation initiale à l'intégration réussie.

### ✨ Fonctionnalités Principales

🌐 **Site Public**
- Landing page moderne avec hero et services
- 7 pages complètes (Accueil, Services, Tarifs, À propos, Contact, Connexion, Inscription)
- Design responsive (mobile-first)
- Navigation intuitive

🔐 **Authentification Sécurisée**
- Email + mot de passe
- OAuth Google
- OAuth Microsoft
- Sessions protégées

👤 **Dashboard Client**
- **Services** : Sélection à la carte ou en pack (Essential, Standard, Premium)
- **Messagerie** : Chat interne consultant-client en temps réel
- **Paiements** : Gestion des factures et historique des transactions

💳 **Système de Paiement Multi-Modes**
- Stripe (carte bancaire) avec 3D Secure
- PayPal
- Interac e-Transfer
- Virement bancaire
- Webhooks sécurisés

---

## 🛠️ Stack Technique

| Catégorie | Technologies |
|-----------|--------------|
| **Framework** | Astro 5 (SSR) |
| **UI Library** | React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Auth** | Auth-Astro (NextAuth) |
| **Payments** | Stripe SDK + PayPal SDK |
| **Deployment** | Vercel (Serverless) |
| **Design** | Webflow Design System |

---

## 📂 Structure du Projet

```
capituneca/
├── 📁 src/
│   ├── pages/              # Pages Astro (routing)
│   ├── components/         # Composants React
│   ├── layouts/            # Layouts Astro
│   └── styles/             # Styles globaux
├── 📁 generated/           # Webflow generated
├── 📄 astro.config.mjs     # Config Astro (Cloudflare)
├── 📄 astro.config.vercel.mjs  # Config Astro (Vercel)
├── 📄 vercel.json          # Config Vercel
└── 📚 Documentation/       # 20 fichiers de guides
```

---

## 🚀 Installation et Développement

### Prérequis
- Node.js 20.x
- npm ou yarn
- Git

### Installation

```bash
# Cloner le repository
git clone https://github.com/ndom2504/capituneca.git
cd capituneca

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env
# Puis configurer vos variables d'environnement

# Lancer en développement
npm run dev

# Build pour Vercel
npm run build:vercel
```

Le site sera accessible sur : http://localhost:3000

---

## 🌐 Déploiement sur Vercel

### Méthode Rapide (3 minutes)

1. **Pousser sur GitHub**
   ```bash
   git push origin main
   ```

2. **Importer sur Vercel**
   - Aller sur https://vercel.com/new
   - Importer `ndom2504/capituneca`
   - Vercel détecte automatiquement Astro

3. **Configurer les variables d'environnement**
   ```env
   AUTH_SECRET=<générer avec: openssl rand -base64 32>
   AUTH_TRUST_HOST=true
   SITE_URL=https://capituneca.vercel.app
   ```

4. **Deploy** 🚀

**📖 Guide détaillé** : [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

---

## 📚 Documentation Complète

### 📘 Guides Essentiels

| Fichier | Description | Pour qui ? |
|---------|-------------|-----------|
| [START_HERE.md](./START_HERE.md) | Point d'entrée (10 sec) | Tous |
| [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) | Index complet | Tous |
| [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md) | Déploiement rapide | Débutants |
| [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) | Guide détaillé Vercel | Tous |
| [DEPLOYMENT_SUMMARY.txt](./DEPLOYMENT_SUMMARY.txt) | Résumé visuel complet | Tous |

### 📙 Par Catégorie

- **Déploiement** : 6 guides (DEPLOY_*, VERCEL_*, etc.)
- **Paiements** : 4 guides (PAYMENT_*, QUICK_START_PAYMENTS)
- **Authentification** : 2 guides (AUTH_*, AUTHENTICATION_*)
- **Dashboard** : 2 guides (GUIDE_TEST_*, DASHBOARD_*)
- **Stratégie** : 3 guides (STRATEGIC_*, RESUME_*, VISUAL_*)

**🔍 Index complet** : [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

---

## 💳 Configuration des Paiements

### Stripe (Production)

```env
STRIPE_SECRET_KEY=sk_live_...
PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Webhook URL** : `https://capituneca.vercel.app/api/payments/webhook-stripe`

### PayPal (Production)

```env
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
PUBLIC_PAYPAL_CLIENT_ID=...
```

**📖 Guide complet** : [PAYMENT_CONFIG.md](./PAYMENT_CONFIG.md)

---

## 🔐 Configuration OAuth

### Google

1. Console : https://console.cloud.google.com
2. Créer un projet
3. OAuth consent screen
4. Credentials → Create OAuth client ID
5. Redirect URI : `https://capituneca.vercel.app/api/auth/callback/google`

### Microsoft

1. Portal : https://portal.azure.com
2. App registrations → New registration
3. Redirect URI : `https://capituneca.vercel.app/api/auth/callback/microsoft`

**📖 Guide complet** : [AUTH_SETUP.md](./AUTH_SETUP.md)

---

## 📊 Statistiques du Projet

- **Lignes de code** : ~5,000+
- **Pages** : 7 pages principales
- **Composants** : 15+ composants React
- **API Routes** : 8 endpoints
- **Modes de paiement** : 4 modes
- **Documentation** : 20 fichiers (~170K)

---

## 🧪 Tests

### Local

```bash
npm run dev
```

Puis tester :
- ✅ Navigation entre toutes les pages
- ✅ Formulaires (contact, inscription, connexion)
- ✅ Dashboard (3 onglets)
- ✅ Sélection de services
- ✅ Chat interne
- ✅ Paiements (mode test)

**📖 Guide de test** : [GUIDE_TEST_DASHBOARD.md](./GUIDE_TEST_DASHBOARD.md)

---

## 🔒 Sécurité

- ✅ HTTPS automatique (Vercel)
- ✅ Variables d'environnement sécurisées
- ✅ `.env` dans `.gitignore`
- ✅ Webhooks avec signature validation
- ✅ Auth sécurisée (NextAuth)
- ✅ CORS configuré

---

## 📞 Support

### Documentation
- **Vercel** : https://vercel.com/docs
- **Astro** : https://docs.astro.build
- **Stripe** : https://stripe.com/docs
- **PayPal** : https://developer.paypal.com/docs

### Projet
- **Email** : contact@capitune.com
- **GitHub** : https://github.com/ndom2504/capituneca

---

## 🤝 Contribution

Ce projet est propriétaire. Les contributions externes ne sont pas acceptées.

---

## 📜 Licence

Propriétaire - **Export Monde Prestige Inc.**  
Tous droits réservés © 2026

---

## 🎉 Auteurs

**Développé pour** : Export Monde Prestige Inc.  
**Projet** : CAPITUNE  
**Année** : 2026

---

## 🚀 Prêt à Déployer ?

**➡️ Commencez par** : [START_HERE.md](./START_HERE.md)

**Besoin d'aide ?** : [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

**Let's go !** 🎉

---

<div align="center">

**CAPITUNE** © 2026 - Export Monde Prestige Inc.

🔗 [capituneca.vercel.app](https://capituneca.vercel.app)

</div>

# 🍁 CAPITUNE - Plateforme d'Accompagnement Canada

Plateforme complète pour accompagner les clients dans leur projet d'immigration au Canada.

## 🎯 Fonctionnalités

### 👤 Système d'authentification
- ✅ Inscription et connexion sécurisées
- ✅ OAuth Google et Microsoft
- ✅ Gestion de profil utilisateur

### 📊 Dashboard Client
- ✅ Sélection de services personnalisée (Pack ou À la carte)
- ✅ Suivi de dossier en temps réel
- ✅ Messagerie interne avec consultant
- ✅ Gestion documentaire

### 💳 Système de Paiement Multi-Méthodes
- ✅ **Carte bancaire** (Stripe)
- ✅ **PayPal**
- ✅ **Virement bancaire**
- ✅ **Interac e-Transfer**
- ✅ Facturation automatique
- ✅ Historique des paiements

### 🛠️ Services Offerts
1. **Consultation stratégique** - Évaluation de profil
2. **Orientation** - Choix du programme
3. **Montage de dossier** - Préparation complète
4. **Suivi & Communication** - Accompagnement continu
5. **Recherche de ressources** - Institutions et employeurs
6. **Accueil & Intégration** - Installation au Canada

## 🚀 Technologies

- **Framework** : Astro 5 + React 19
- **Styling** : Tailwind CSS + shadcn/ui
- **Authentification** : Auth.js
- **Paiements** : Stripe + PayPal
- **Déploiement** : Cloudflare Workers
- **TypeScript** : Full type safety

## 📦 Installation

\`\`\`bash
# Cloner le projet
git clone https://github.com/VOTRE-USERNAME/capitune-canada.git
cd capitune-canada

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés
\`\`\`

## ⚙️ Configuration

### Variables d'environnement requises

\`\`\`env
# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_...
PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal (Production)
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
PUBLIC_PAYPAL_CLIENT_ID=...

# Base de données
DATABASE_URL=...

# Authentification
AUTH_SECRET=... # Générer avec: openssl rand -base64 32
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_MICROSOFT_ID=...
AUTH_MICROSOFT_SECRET=...
\`\`\`

## 🏃 Démarrage

\`\`\`bash
# Mode développement
npm run dev

# Build production
npm run build

# Preview production
npm run preview
\`\`\`

## 📁 Structure du Projet

\`\`\`
src/
├── components/          # Composants React
│   ├── ui/             # shadcn/ui components
│   ├── HeaderNav.tsx   # Navigation principale
│   ├── ServiceSelector.tsx  # Sélection de services
│   ├── PaymentModal.tsx     # Système de paiement
│   └── ChatInterne.tsx      # Messagerie
├── pages/              # Pages Astro
│   ├── index.astro    # Page d'accueil
│   ├── dashboard.astro # Dashboard client
│   ├── connexion.astro # Login
│   └── api/           # API Routes
│       ├── auth/      # Authentification
│       └── payments/  # Paiements
├── layouts/           # Layouts Astro
└── styles/           # CSS global
\`\`\`

## 🔒 Sécurité

- ✅ Variables d'environnement protégées
- ✅ Clés Stripe en mode production
- ✅ Authentification sécurisée avec JWT
- ✅ Validation des paiements côté serveur
- ✅ Protection CSRF

## 📄 Licence

© 2026 CAPITUNE - Export Monde Prestige Inc. Tous droits réservés.

## 📞 Support

Pour toute question : contact@capitune.com

---

**🍁 Fait avec ❤️ pour faciliter l'immigration au Canada**

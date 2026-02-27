# 🚀 Déploiement sur Vercel - CAPITUNE

Guide complet pour déployer capituneca.vercel.app

## 📋 Prérequis

- ✅ Compte Vercel (gratuit) : https://vercel.com/signup
- ✅ Projet poussé sur GitHub : https://github.com/ndom2504/capituneca
- ✅ Clés API prêtes (Stripe, PayPal, Auth)

---

## 🎯 Étape 1 : Connexion et Import

### 1. Aller sur Vercel
👉 https://vercel.com/new

### 2. Importer le projet GitHub
- Cliquer sur **"Import Git Repository"**
- Sélectionner **`ndom2504/capituneca`**
- Cliquer sur **"Import"**

### 3. Configuration du projet
Vercel détectera automatiquement Astro. Vérifiez :
- **Framework Preset** : `Astro`
- **Build Command** : `astro build --config astro.config.vercel.mjs`
- **Output Directory** : `dist`
- **Install Command** : `npm install`
- **Node Version** : `20.x`

---

## 🔐 Étape 2 : Variables d'Environnement

### Variables OBLIGATOIRES

Aller dans **Settings** → **Environment Variables** et ajouter :

#### 🔹 Stripe (Production)
```
STRIPE_SECRET_KEY = sk_live_VOTRE_CLE
PUBLIC_STRIPE_PUBLIC_KEY = pk_live_VOTRE_CLE
STRIPE_WEBHOOK_SECRET = whsec_VOTRE_WEBHOOK
```

#### 🔹 PayPal (Production)
```
PAYPAL_CLIENT_ID = VOTRE_CLIENT_ID
PAYPAL_SECRET = VOTRE_SECRET
PUBLIC_PAYPAL_CLIENT_ID = VOTRE_CLIENT_ID
```

#### 🔹 Configuration Paiements
```
PAYMENT_CURRENCY = CAD
PAYMENT_SUCCESS_URL = https://capituneca.vercel.app/dashboard?payment=success
PAYMENT_CANCEL_URL = https://capituneca.vercel.app/dashboard?payment=cancel
```

#### 🔹 Informations bancaires
```
BANK_ACCOUNT_NAME = Export Monde Prestige Inc.
BANK_NAME = Votre Banque
BANK_TRANSIT = 12345
BANK_INSTITUTION = 001
BANK_ACCOUNT = 1234567890
INTERAC_EMAIL = paiements@capitune.com
```

#### 🔹 Authentification
```
AUTH_SECRET = [Générer avec: openssl rand -base64 32]
AUTH_GOOGLE_ID = VOTRE_GOOGLE_CLIENT_ID
AUTH_GOOGLE_SECRET = VOTRE_GOOGLE_SECRET
AUTH_MICROSOFT_ID = VOTRE_MICROSOFT_CLIENT_ID
AUTH_MICROSOFT_SECRET = VOTRE_MICROSOFT_SECRET
```

#### 🔹 Base de données (si applicable)
```
DATABASE_URL = postgresql://...
```

#### 🔹 Configuration site
```
SITE_URL = https://capituneca.vercel.app
AUTH_TRUST_HOST = true
```

---

## 🚀 Étape 3 : Déploiement

1. Cliquer sur **"Deploy"**
2. Attendre 2-3 minutes ⏳
3. ✅ Votre site sera accessible sur : **https://capituneca.vercel.app**

---

## 🔄 Déploiement Automatique

### À chaque `git push` :
```bash
git add .
git commit -m "🔧 Nouvelle fonctionnalité"
git push origin main
```

➡️ Vercel détecte automatiquement et redéploie le site ! 🎉

---

## 🔧 Configuration Post-Déploiement

### 0. Initialiser / mettre à jour le schéma Postgres (Neon)

Si tu utilises `DATABASE_URL` (Neon/Postgres), il faut exécuter les migrations SQL dans Neon (SQL Editor) :

- `migrations/0001_init_postgres.sql` (schéma de base)
- `migrations/0002_assignments_postgres.sql`
- `migrations/0003_pro_profile_postgres.sql`
- `migrations/0004_account_type_postgres.sql` (client vs professionnel)

Tu peux aussi n’exécuter que la dernière si la base est déjà initialisée.

### 1. Configurer le domaine personnalisé (optionnel)
- **Settings** → **Domains**
- Ajouter : `capitune.ca` ou autre
- Suivre les instructions DNS

### 2. Configurer les Webhooks Stripe

**Sur Stripe Dashboard** :
1. Aller dans **Developers** → **Webhooks**
2. Ajouter endpoint : `https://capituneca.vercel.app/api/payments/webhook-stripe`
3. Sélectionner les événements :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copier le **Webhook Secret** et l'ajouter dans Vercel

### 3. Mettre à jour les URLs OAuth

**Google Cloud Console** :
- Authorized redirect URIs : `https://capituneca.vercel.app/api/oauth/callback/google`

**Microsoft Azure** :
- Redirect URIs : `https://capituneca.vercel.app/api/oauth/callback/microsoft-entra-id`

### 4. Configurer PayPal

**PayPal Developer Dashboard** :
- Return URL : `https://capituneca.vercel.app/dashboard?payment=success`
- Cancel URL : `https://capituneca.vercel.app/dashboard?payment=cancel`

---

## 📊 Monitoring et Analytics

Vercel offre gratuitement :
- ✅ **Analytics** : Nombre de visiteurs, performance
- ✅ **Logs** : Erreurs et logs serveur
- ✅ **Speed Insights** : Performance du site

Accès via : https://vercel.com/ndom2504/capituneca/analytics

---

## 🐛 Dépannage

### Erreur : "Build failed"
```bash
# Vérifier localement
npm run build

# Si ça marche localement mais pas sur Vercel :
# - Vérifier les variables d'environnement
# - Vérifier la version de Node (doit être 20.x)
```

### Erreur : "Function timeout"
Les fonctions gratuites ont un timeout de 10s. Optimisez les requêtes lentes.

### Erreur : "Module not found"
```bash
# Vérifier que toutes les dépendances sont dans package.json
npm install
git add package.json package-lock.json
git commit -m "📦 Update dependencies"
git push
```

---

## 💰 Coûts

### Plan Gratuit (Hobby) :
- ✅ 100 GB de bande passante
- ✅ Déploiements illimités
- ✅ HTTPS automatique
- ✅ SSL gratuit
- ✅ Analytics de base

**Suffisant pour démarrer !** 🎉

### Plan Pro ($20/mois) :
- Plus de bande passante
- Analytics avancés
- Support prioritaire

---

## 🎯 Checklist Finale

Avant de lancer en production :

- [ ] Toutes les variables d'environnement configurées
- [ ] Stripe en mode **LIVE** (pas TEST)
- [ ] PayPal en mode **PRODUCTION**
- [ ] Webhooks Stripe configurés
- [ ] OAuth URLs mis à jour
- [ ] Tests de paiements effectués
- [ ] Tests d'authentification effectués
- [ ] SSL actif (automatique sur Vercel)

---

## 📞 Support

- **Vercel Docs** : https://vercel.com/docs
- **Astro Docs** : https://docs.astro.build
- **Support Vercel** : support@vercel.com

---

## 🎉 Félicitations !

Votre site **capituneca.vercel.app** est en ligne ! 🚀

Pour toute modification, faites simplement :
```bash
git push
```

Et Vercel redéploie automatiquement ! ✨

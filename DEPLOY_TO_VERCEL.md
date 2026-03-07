# 🚀 Guide de Déploiement sur Vercel - CAPITUNE

## ✅ Statut Actuel

✓ Git initialisé
✓ Commit créé avec tous les fichiers
✓ Configuration Vercel prête
✓ Build command configuré

---

## 📋 Méthode 1 : Déploiement via Vercel CLI (Recommandé)

### 1. Installer Vercel CLI

```bash
npm install -g vercel
```

### 2. Se connecter à Vercel

```bash
vercel login
```

### 3. Déployer le projet

```bash
# Depuis le dossier /app
vercel

# Pour déployer en production
vercel --prod
```

La CLI vous posera quelques questions :
- **Set up and deploy?** → Yes
- **Which scope?** → Sélectionnez votre compte
- **Link to existing project?** → No (première fois) ou Yes (si déjà créé)
- **Project name?** → capitune (ou le nom de votre choix)
- **Directory?** → . (racine)
- **Override settings?** → No (le vercel.json sera utilisé)

---

## 📋 Méthode 2 : Déploiement via GitHub + Vercel Dashboard

### 1. Créer un dépôt GitHub

```bash
# Sur GitHub.com, créez un nouveau dépôt nommé "capitune"
# Puis dans votre terminal :

git remote add origin https://github.com/VOTRE_USERNAME/capitune.git
git branch -M main
git push -u origin main
```

### 2. Connecter à Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Add New Project"**
3. Importez votre dépôt GitHub **"capitune"**
4. Vercel détectera automatiquement Astro
5. Configurez les variables d'environnement (voir ci-dessous)
6. Cliquez sur **"Deploy"**

---

## 🔐 Variables d'Environnement à Configurer sur Vercel

### Variables Requises

Dans le dashboard Vercel → Settings → Environment Variables :

```bash
# Stripe (Paiements par carte)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal (Paiements PayPal)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Base de données (si utilisée)
DATABASE_URL=postgresql://...

# Email (si notifications email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=contact@capitune.com
SMTP_PASS=...

# Auth (si authentification complète)
AUTH_SECRET=your_random_secret_key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
```

### Générer AUTH_SECRET

```bash
openssl rand -base64 32
```

---

## 📦 Configuration Actuelle du Projet

### vercel.json
```json
{
  "buildCommand": "npm run vercel-build",
  "framework": "astro",
  "devCommand": "astro dev",
  "installCommand": "npm install",
  "env": {
    "NODE_VERSION": "20.x"
  },
  "regions": ["iad1"]
}
```

### astro.config.vercel.mjs
Le projet utilise l'adaptateur Vercel pour le déploiement.

---

## 🔍 Vérification Pré-Déploiement

### Test Build Local

```bash
npm run build:vercel
```

Si le build réussit localement, il devrait fonctionner sur Vercel.

### Vérifier les Fichiers Ignorés

Le `.vercelignore` exclut :
- `node_modules`
- `.env`
- `.astro`
- Fichiers de développement

---

## 🌐 Après le Déploiement

### 0. Vérifier que les routes API “agent” existent

Dans un navigateur (ou via curl), testez :

- `GET https://votre-app.vercel.app/api/agent/answer` → doit répondre **405** (méthode non supportée)
- `POST https://votre-app.vercel.app/api/agent/answer` avec JSON → doit répondre **200**

Si vous obtenez **404**, c’est un souci de build/routage Vercel (pas le code de l’endpoint).

### 1. Récupérer l'URL de Production

Vercel vous donnera une URL comme :
```
https://capitune.vercel.app
```

Ou un domaine personnalisé que vous pouvez configurer.

### 2. Configurer le Webhook Stripe

1. Allez sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. Allez dans **Developers → Webhooks**
3. Ajoutez un endpoint :
   ```
   https://votre-domaine.vercel.app/api/payments/webhook-stripe
   ```
4. Sélectionnez les événements :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copiez le **Signing secret** et ajoutez-le à `STRIPE_WEBHOOK_SECRET`

### 3. Tester les Fonctionnalités

- ✅ Page d'accueil
- ✅ Navigation
- ✅ Formulaires de connexion/inscription
- ✅ Dashboard
- ✅ Système de paiement (mode test Stripe)
- ✅ Chat interne

---

## 🔧 Commandes Utiles

### Voir les Logs de Déploiement

```bash
vercel logs
```

### Redeployer

```bash
vercel --prod
```

### Lister les Déploiements

```bash
vercel ls
```

### Supprimer un Déploiement

```bash
vercel rm [deployment-url]
```

---

## 🐛 Troubleshooting

### Erreur de Build

1. Vérifiez les logs dans Vercel Dashboard
2. Testez le build localement : `npm run build:vercel`
3. Vérifiez que toutes les dépendances sont dans `package.json`

### API Routes ne Fonctionnent Pas

1. Vérifiez que les variables d'environnement sont configurées
2. Consultez les logs : `vercel logs`
3. Vérifiez la région de déploiement (actuellement `iad1`)

### Paiements ne Fonctionnent Pas

1. Vérifiez que `STRIPE_SECRET_KEY` est configuré
2. Utilisez des cartes de test Stripe :
   - Succès : `4242 4242 4242 4242`
   - Échoue : `4000 0000 0000 0002`
3. Vérifiez le webhook Stripe

---

## 📞 Support

- Documentation Vercel : https://vercel.com/docs
- Documentation Astro : https://docs.astro.build
- Support Stripe : https://stripe.com/docs

---

## 🎉 Projet Prêt !

Votre application CAPITUNE est maintenant prête à être déployée sur Vercel.

**Commits récents :**
- Initial commit avec toutes les fonctionnalités
- Système d'authentification
- Dashboard client complet
- Système de paiement multi-méthodes
- Chat interne
- Gestion des services

**Technologies utilisées :**
- Astro 5.x
- React 19
- TypeScript
- Tailwind CSS 4.x
- shadcn/ui
- Stripe + PayPal
- Vercel Adapter

# 🚀 Déploiement Rapide - CAPITUNE

## 🎯 En 3 Minutes sur Vercel

### Étape 1️⃣ : Pousser le code sur GitHub
```bash
git add .
git commit -m "🚀 Ready for deployment"
git push origin main
```

### Étape 2️⃣ : Déployer sur Vercel
1. 👉 Aller sur https://vercel.com/new
2. 🔗 Importer `ndom2504/capituneca`
3. ⚙️ Laisser la configuration par défaut
4. 🔐 Ajouter les variables d'environnement (voir ci-dessous)
5. 🚀 Cliquer sur **Deploy**

### Étape 3️⃣ : Variables d'environnement minimales

**OBLIGATOIRES pour démarrer** :
```env
# Auth
AUTH_SECRET=<générer avec: openssl rand -base64 32>
AUTH_TRUST_HOST=true

# Site
SITE_URL=https://capituneca.vercel.app

# Paiements de base
PAYMENT_CURRENCY=CAD
INTERAC_EMAIL=paiements@capitune.com
BANK_ACCOUNT_NAME=Export Monde Prestige Inc.
```

**Pour activer Stripe** (optionnel au début) :
```env
STRIPE_SECRET_KEY=sk_live_...
PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
```

**Pour activer PayPal** (optionnel au début) :
```env
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
PUBLIC_PAYPAL_CLIENT_ID=...
```

---

## ✅ C'est tout !

🎉 Votre site sera en ligne à : **https://capituneca.vercel.app**

Pour plus de détails, voir [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

---

## 🔄 Mises à jour automatiques

À chaque fois que vous faites :
```bash
git push
```

➡️ Vercel redéploie automatiquement ! ✨

---

## 📊 Accès Dashboard Vercel

- 📈 Analytics : https://vercel.com/ndom2504/capituneca/analytics
- 🔧 Settings : https://vercel.com/ndom2504/capituneca/settings
- 📝 Logs : https://vercel.com/ndom2504/capituneca/logs

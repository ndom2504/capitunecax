# ✅ Checklist de Déploiement - CAPITUNE

## 📋 Avant le déploiement

### 1. Code prêt ✅
- [x] Build local réussi (`npm run build:vercel`)
- [x] Tous les fichiers committés
- [x] Poussé sur GitHub

### 2. Comptes créés
- [ ] Compte Vercel : https://vercel.com/signup
- [ ] Compte Stripe (Production) : https://dashboard.stripe.com
- [ ] Compte PayPal Business : https://developer.paypal.com
- [ ] Google OAuth (optionnel) : https://console.cloud.google.com
- [ ] Microsoft OAuth (optionnel) : https://portal.azure.com

---

## 🚀 Étapes de déploiement

### Étape 1 : Import sur Vercel
- [ ] Aller sur https://vercel.com/new
- [ ] Importer `ndom2504/capituneca` depuis GitHub
- [ ] Vérifier la configuration automatique :
  - Framework : **Astro** ✅
  - Build Command : `astro build --config astro.config.vercel.mjs` ✅
  - Output : `dist` ✅

### Étape 2 : Variables d'environnement
**Minimales pour démarrer** :
- [ ] `AUTH_SECRET` (générer avec `openssl rand -base64 32`)
- [ ] `AUTH_TRUST_HOST=true`
- [ ] `SITE_URL=https://capituneca.vercel.app`
- [ ] `PAYMENT_CURRENCY=CAD`
- [ ] `INTERAC_EMAIL=paiements@capitune.com`
- [ ] `BANK_ACCOUNT_NAME=Export Monde Prestige Inc.`

**Pour Stripe (recommandé)** :
- [ ] `STRIPE_SECRET_KEY`
- [ ] `PUBLIC_STRIPE_PUBLIC_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

**Pour PayPal (recommandé)** :
- [ ] `PAYPAL_CLIENT_ID`
- [ ] `PAYPAL_SECRET`
- [ ] `PUBLIC_PAYPAL_CLIENT_ID`

**Pour OAuth (optionnel)** :
- [ ] `AUTH_GOOGLE_ID`
- [ ] `AUTH_GOOGLE_SECRET`
- [ ] `AUTH_MICROSOFT_ID`
- [ ] `AUTH_MICROSOFT_SECRET`

### Étape 3 : Déployer
- [ ] Cliquer sur **Deploy**
- [ ] Attendre 2-3 minutes
- [ ] Visiter : **https://capituneca.vercel.app**

---

## 🔧 Configuration post-déploiement

### Webhooks Stripe
- [ ] Aller dans Stripe Dashboard → Webhooks
- [ ] Ajouter endpoint : `https://capituneca.vercel.app/api/payments/webhook-stripe`
- [ ] Événements :
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
- [ ] Copier le webhook secret
- [ ] Ajouter dans Vercel : `STRIPE_WEBHOOK_SECRET`

### PayPal Configuration
- [ ] Aller dans PayPal Developer Dashboard
- [ ] Return URL : `https://capituneca.vercel.app/dashboard?payment=success`
- [ ] Cancel URL : `https://capituneca.vercel.app/dashboard?payment=cancel`

### OAuth URLs
**Google Console** :
- [ ] Authorized redirect : `https://capituneca.vercel.app/api/auth/callback/google`

**Microsoft Azure** :
- [ ] Redirect URI : `https://capituneca.vercel.app/api/auth/callback/microsoft`

---

## 🧪 Tests post-déploiement

### Fonctionnalités de base
- [ ] Page d'accueil charge correctement
- [ ] Navigation fonctionne (Accueil, Services, Tarifs, À propos, Contact)
- [ ] Formulaire de contact fonctionne
- [ ] Design responsive (mobile, tablette, desktop)

### Authentification
- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Google OAuth (si configuré)
- [ ] Microsoft OAuth (si configuré)
- [ ] Déconnexion fonctionne

### Dashboard Client
- [ ] Accès au dashboard après connexion
- [ ] Onglet Services affiche correctement
- [ ] Onglet Messagerie fonctionne
- [ ] Onglet Paiements affiche les factures

### Système de paiement
**Stripe** :
- [ ] Test de paiement par carte (mode test)
- [ ] Webhook reçu correctement
- [ ] Statut facture mis à jour

**PayPal** :
- [ ] Bouton PayPal s'affiche
- [ ] Redirection vers PayPal fonctionne
- [ ] Retour après paiement fonctionne

**Interac/Virement** :
- [ ] Instructions s'affichent correctement
- [ ] Informations bancaires correctes

---

## 📊 Monitoring

### Vercel Dashboard
- [ ] Analytics actif
- [ ] Speed Insights vérifié
- [ ] Logs accessibles

### Erreurs courantes
- [ ] Vérifier les logs pour erreurs 500
- [ ] Tester tous les formulaires
- [ ] Vérifier les liens externes

---

## 🎯 Optimisations

### Performance
- [ ] Images optimisées
- [ ] Lazy loading actif
- [ ] Cache correctement configuré

### SEO (futur)
- [ ] Meta descriptions
- [ ] Open Graph tags
- [ ] Sitemap
- [ ] robots.txt

---

## 🔐 Sécurité

### SSL/HTTPS
- [ ] HTTPS actif (automatique sur Vercel) ✅
- [ ] Redirection HTTP → HTTPS

### Variables sensibles
- [ ] Aucune clé API dans le code ✅
- [ ] Toutes les clés dans variables d'environnement ✅
- [ ] `.env` dans `.gitignore` ✅

### Headers de sécurité
- [ ] CORS configuré
- [ ] CSP headers (optionnel)

---

## 📱 Domaine personnalisé (optionnel)

Si vous voulez `capitune.ca` au lieu de `capituneca.vercel.app` :

### Acheter le domaine
- [ ] Acheter sur Namecheap, GoDaddy, etc.

### Configurer sur Vercel
- [ ] Settings → Domains
- [ ] Ajouter `capitune.ca`
- [ ] Ajouter `www.capitune.ca`
- [ ] Suivre instructions DNS

### Configuration DNS
- [ ] Type A : `76.76.21.21`
- [ ] Type CNAME : `cname.vercel-dns.com`
- [ ] Attendre propagation (24-48h)

---

## 🎉 Lancement

### Avant d'annoncer
- [ ] Tous les tests passent
- [ ] Mode production activé (pas de test)
- [ ] Stripe en mode LIVE
- [ ] PayPal en mode PRODUCTION
- [ ] Contenu vérifié (fautes, liens, contact)

### Communication
- [ ] Email aux premiers clients
- [ ] Posts réseaux sociaux
- [ ] Mise à jour signatures email

---

## 📞 Support

### En cas de problème

**Vercel** :
- Documentation : https://vercel.com/docs
- Support : support@vercel.com
- Status : https://www.vercel-status.com

**Stripe** :
- Documentation : https://stripe.com/docs
- Support : https://support.stripe.com

**PayPal** :
- Documentation : https://developer.paypal.com/docs
- Support : https://www.paypal.com/merchantsupport

---

## 🔄 Workflow de mise à jour

Pour mettre à jour le site après le premier déploiement :

```bash
# 1. Faire vos modifications localement
# 2. Tester localement
npm run dev

# 3. Builder pour Vercel
npm run build:vercel

# 4. Commit et push
git add .
git commit -m "✨ Nouvelle fonctionnalité"
git push origin main

# 5. Vercel redéploie automatiquement ! ✨
```

---

## ✅ Statut actuel

- [x] Code prêt
- [x] Build fonctionne
- [x] Configuration Vercel créée
- [ ] Déployé sur Vercel
- [ ] Variables d'environnement configurées
- [ ] Tests effectués
- [ ] Prêt pour production

**Prochaine étape** : Suivre [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md)

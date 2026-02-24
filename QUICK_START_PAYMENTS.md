# 🚀 GUIDE RAPIDE - Système de Paiement CAPITUNE

## ⚡ DÉMARRAGE EN 5 MINUTES

### 1️⃣ **Installer les dépendances** (Déjà fait ✅)
```bash
npm install @stripe/stripe-js stripe @stripe/react-stripe-js @paypal/react-paypal-js
```

### 2️⃣ **Configurer les variables d'environnement**

Ouvrez `.env` et remplacez les clés de test :

```bash
# STRIPE - Obtenez vos clés sur https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE
PUBLIC_STRIPE_PUBLIC_KEY=pk_test_VOTRE_CLE_PUBLIQUE
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK

# PAYPAL - Obtenez vos clés sur https://developer.paypal.com/dashboard/
PAYPAL_CLIENT_ID=VOTRE_CLIENT_ID
PAYPAL_SECRET=VOTRE_SECRET
PUBLIC_PAYPAL_CLIENT_ID=VOTRE_CLIENT_ID

# Les autres valeurs sont déjà configurées
```

### 3️⃣ **Obtenir les clés de test Stripe**

1. Allez sur https://dashboard.stripe.com/register
2. Créez un compte (mode Test par défaut)
3. Allez dans **Developers > API keys**
4. Copiez :
   - **Secret key** (sk_test_...) → `STRIPE_SECRET_KEY`
   - **Publishable key** (pk_test_...) → `PUBLIC_STRIPE_PUBLIC_KEY`

### 4️⃣ **Obtenir les clés de test PayPal**

1. Allez sur https://developer.paypal.com/
2. Connectez-vous ou créez un compte
3. Allez dans **Dashboard > My Apps & Credentials**
4. Créez une **Sandbox App**
5. Copiez :
   - **Client ID** → `PAYPAL_CLIENT_ID` et `PUBLIC_PAYPAL_CLIENT_ID`
   - **Secret** → `PAYPAL_SECRET`

### 5️⃣ **Lancer l'application**

```bash
npm run dev
```

Visitez : http://localhost:3000/dashboard

---

## 🧪 TESTER LES PAIEMENTS

### **Cartes de test Stripe**

| Carte | Résultat |
|-------|----------|
| `4242 4242 4242 4242` | ✅ Succès |
| `4000 0000 0000 9995` | ❌ Décliné (fonds insuffisants) |
| `4000 0025 0000 3155` | 🔐 Requiert authentification 3D Secure |

**Infos complémentaires :**
- **Date d'expiration :** N'importe quelle date future (ex: 12/34)
- **CVC :** N'importe quel 3 chiffres (ex: 123)
- **Code postal :** N'importe lequel (ex: H1A 1A1)

### **Comptes PayPal de test**

PayPal créé automatiquement des comptes sandbox :
1. Allez dans **Sandbox > Accounts**
2. Utilisez un compte "Personal" pour payer
3. Identifiants affichés sur la page

---

## 📍 NAVIGATION RAPIDE

### **Accéder au système de paiement :**
```
1. Allez sur http://localhost:3000/dashboard
2. Cliquez sur l'onglet "Paiements"
3. Cliquez sur "Payer maintenant" sur une facture
4. Sélectionnez un mode de paiement
5. Testez !
```

### **Tester chaque mode :**

**💳 Carte bancaire :**
- Sélectionnez "Carte bancaire"
- Utilisez `4242 4242 4242 4242`
- Paiement instantané

**🅿️ PayPal :**
- Sélectionnez "PayPal"
- Connectez-vous avec un compte sandbox
- Approuvez le paiement

**📧 Interac e-Transfer :**
- Sélectionnez "Interac e-Transfer"
- Copiez les instructions
- Cliquez "J'ai envoyé le virement"

**🏦 Virement bancaire :**
- Sélectionnez "Virement bancaire"
- Copiez les coordonnées
- Cliquez "J'ai effectué le virement"

---

## 🔧 PERSONNALISATION RAPIDE

### **Modifier les montants des factures**
```typescript
// src/components/PaymentsTab.tsx
const invoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2026-002',
    amount: 1200,  // ← Changez ici
    status: 'pending',
    // ...
  }
];
```

### **Modifier les coordonnées bancaires**
```bash
# .env
BANK_ACCOUNT_NAME=Votre Nom d'Entreprise
BANK_NAME=Votre Banque
BANK_TRANSIT=Votre Transit
BANK_INSTITUTION=Votre Institution
BANK_ACCOUNT=Votre Numéro de Compte
INTERAC_EMAIL=votre-email@example.com
```

### **Modifier les couleurs du paiement**
```typescript
// src/components/PaymentModal.tsx
// Cherchez les classes Tailwind et modifiez-les
className="bg-primary text-primary-foreground"  // Boutons
className="border-primary"                       // Bordures actives
```

---

## 📊 VOIR LES PAIEMENTS

### **Stripe Dashboard**
```
https://dashboard.stripe.com/test/payments
```
Voir tous les paiements test effectués

### **PayPal Dashboard**
```
https://www.sandbox.paypal.com/
```
Connexion avec votre compte développeur

### **Console du navigateur**
```
F12 > Console
```
Les logs affichent les événements de paiement

---

## ❓ RÉSOLUTION RAPIDE DES PROBLÈMES

### **Erreur : "Stripe not configured"**
→ Vérifiez que `STRIPE_SECRET_KEY` est défini dans `.env`

### **Erreur : "PayPal not configured"**
→ Vérifiez que `PAYPAL_CLIENT_ID` est défini dans `.env`

### **Le formulaire Stripe ne s'affiche pas**
→ Vérifiez que `PUBLIC_STRIPE_PUBLIC_KEY` commence par `pk_test_`

### **PayPal s'ouvre dans une nouvelle fenêtre**
→ C'est normal en sandbox, autorisez les popups

### **Le build échoue**
```bash
# Réinstallez les dépendances
npm install
npm run build
```

---

## 🎯 PROCHAINES ÉTAPES

### **Pour tester en profondeur :**
```
□ Tester tous les modes de paiement
□ Tester avec différents montants
□ Tester les cartes qui échouent
□ Vérifier les redirections après paiement
□ Tester sur mobile/tablette
```

### **Avant la production :**
```
□ Créer compte Stripe Live
□ Créer compte PayPal Production  
□ Configurer les webhooks
□ Mettre à jour les clés en production
□ Tester avec de vrais petits montants
```

### **Fonctionnalités à ajouter :**
```
□ Génération de factures PDF
□ Emails de confirmation automatiques
□ Base de données pour stocker les paiements
□ Dashboard admin pour voir les transactions
□ Remboursements
```

---

## 🆘 BESOIN D'AIDE ?

### **Documentation officielle :**
- Stripe : https://stripe.com/docs
- PayPal : https://developer.paypal.com/docs
- React Stripe : https://stripe.com/docs/stripe-js/react

### **Cartes de test Stripe :**
https://stripe.com/docs/testing#cards

### **Comptes sandbox PayPal :**
https://developer.paypal.com/tools/sandbox/accounts/

---

## ✅ CHECKLIST RAPIDE

**Installation :**
- [x] Dépendances installées
- [x] Composants créés
- [x] API routes configurées

**Configuration :**
- [ ] Clés Stripe ajoutées
- [ ] Clés PayPal ajoutées
- [ ] Coordonnées bancaires vérifiées
- [ ] Email Interac configuré

**Tests :**
- [ ] Paiement carte Stripe testé
- [ ] Paiement PayPal testé
- [ ] Instructions Interac vérifiées
- [ ] Instructions virement vérifiées

**Prêt ! 🚀**

---

**💡 Conseil :** Commencez par tester Stripe (le plus simple), puis PayPal, puis les modes manuels (Interac/Virement).

**🎉 Bon test !**

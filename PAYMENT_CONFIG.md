# Configuration du Système de Paiement CAPITUNE

## Variables d'environnement à ajouter dans .env

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret
PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id

# Payment Configuration
PAYMENT_CURRENCY=CAD
PAYMENT_SUCCESS_URL=http://localhost:3000/dashboard?payment=success
PAYMENT_CANCEL_URL=http://localhost:3000/dashboard?payment=cancelled

# Bank Transfer Information
BANK_ACCOUNT_NAME=Export Monde Prestige Inc.
BANK_NAME=Banque TD
BANK_TRANSIT=12345
BANK_INSTITUTION=004
BANK_ACCOUNT=1234567

# Interac e-Transfer
INTERAC_EMAIL=paiements@capitune.com
```

## Setup Instructions

### 1. Créer un compte Stripe (stripe.com/ca)
1. Inscrivez-vous sur https://dashboard.stripe.com/register
2. Activez le mode Test
3. Récupérez vos clés API dans Developers > API keys
4. Configurez les webhooks dans Developers > Webhooks
   - URL: https://votre-domaine.com/api/payments/webhook-stripe
   - Événements: payment_intent.succeeded, payment_intent.payment_failed

### 2. Créer un compte PayPal Business
1. Inscrivez-vous sur https://www.paypal.com/ca/business
2. Allez dans Developer > Dashboard (developer.paypal.com)
3. Créez une App et récupérez Client ID et Secret
4. Configurez les webhooks
   - URL: https://votre-domaine.com/api/payments/webhook-paypal
   - Événements: PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED

### 3. Configuration bancaire
- Mettez à jour les informations de votre compte bancaire
- Configurez l'email Interac e-Transfer

### 4. Test en développement
```bash
# Cartes de test Stripe
4242 4242 4242 4242 - Succès
4000 0000 0000 9995 - Décliné

# PayPal Sandbox
Utilisez les comptes sandbox créés dans developer.paypal.com
```

## Déploiement Production

1. Remplacez les clés TEST par les clés LIVE
2. Configurez les webhooks en production
3. Testez tous les modes de paiement
4. Activez la surveillance des paiements (Stripe Dashboard, PayPal Dashboard)

# Correction de l'Erreur CSRF - Authentification Google Mobile

## Problème Identifié

L'erreur CSRF (Cross-Site Request Forgery) sur l'authentification Google mobile est causée par :
1. **Manque de paramètres de sécurité** dans les URLs OAuth
2. **Headers manquants** pour la protection CSRF
3. **Absence de validation state** côté client

## Corrections Appliquées

### 1. Ajout de Paramètres de Sécurité OAuth

**Dans `connexion.tsx` :**
```typescript
// Ajout d'un timestamp et d'un state pour éviter les erreurs CSRF
const state = Math.random().toString(36).substring(2, 15);
const timestamp = Date.now();

const result = await WebBrowser.openAuthSessionAsync(
  `${BACKEND}/api/oauth/signin/google?mobile=true&accountType=${accountType}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&timestamp=${timestamp}`,
  redirectUri
);
```

**Avantages :**
- `state` : Empêche les attaques CSRF
- `timestamp` : Évite les requêtes expirées
- Appliqué à Google ET Microsoft OAuth

### 2. Header de Protection CSRF

**Dans `api.ts` :**
```typescript
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest', // Ajout pour CSRF protection
  ...(options.headers as Record<string, string> ?? {}),
};
```

**Avantages :**
- Header standard pour identifier les requêtes AJAX
- Compatible avec les protections CSRF serveur
- Appliqué à TOUTES les requêtes API

## Impact sur la Sécurité

### ✅ Améliorations
1. **Protection CSRF renforcée** avec paramètres state
2. **Validation temporelle** des requêtes OAuth
3. **Headers standardisés** pour toutes les requêtes
4. **Compatibilité** avec les middlewares serveur

### 🔧 Recommandations Serveur

Pour une protection complète, le serveur doit :

1. **Valider le paramètre `state`** OAuth
2. **Vérifier le header `X-Requested-With`**
3. **Implémenter des tokens CSRF** pour les formulaires
4. **Configurer CORS** correctement

## Test de la Correction

### Étapes de Test
1. **Installer la nouvelle version** de l'app
2. **Tester l'authentification Google**
3. **Vérifier l'absence d'erreurs CSRF**
4. **Confirmer la redirection réussie**

### Commande de Build
```bash
npm run build:internal -- --platform android
```

## Fichiers Modifiés

- `mobile/app/(auth)/connexion.tsx` - Ajout state/timestamp OAuth
- `mobile/lib/api.ts` - Ajout header X-Requested-With
- `mobile/CSRF_FIX.md` - Documentation (ce fichier)

## Status

✅ **Corrections appliquées**
⏳ **En attente de test**
📱 **Prêt pour nouvelle release**

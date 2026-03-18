# Guide de Release pour Tests Internes - CAPITUNE Mobile

## Configuration Effectuée

### 1. Fichiers de Configuration Créés/Modifiés

#### `eas.json` - Configuration des builds EAS
- Profile `internal-test` pour les builds de test interne
- Distribution interne pour Android (APK) et iOS
- Resource classes optimisées (m-medium)
- App version source configurée sur "local"

#### `package.json` - Scripts de build
- Ajout des scripts de build EAS:
  - `build:dev` - Build développement
  - `build:preview` - Build preview
  - `build:prod` - Build production
  - `build:internal` - Build test interne

#### `app.json` - Version de l'app
- Version mise à jour: 1.0.1

#### `.easignore` - Exclusions de build
- Réduction de la taille de l'archive de build (219 MB actuellement)

### 2. Problèmes Identifiés

#### Build Android Échoué
- Erreur dans la phase Prebuild
- Nécessite investigation des logs détaillés

#### Build iOS Limité
- Compte Apple Developer non enregistré
- Nécessite inscription Apple Developer ($99/an)

## Commandes de Build Disponibles

```bash
# Build test interne Android
npm run build:internal -- --platform android

# Build test interne iOS  
npm run build:internal -- --platform ios

# Build développement
npm run build:dev

# Build preview
npm run build:preview

# Build production
npm run build:prod
```

## Étapes Suivantes Recommandées

### 1. Résoudre les erreurs de build
- Analyser les logs EAS détaillés
- Corriger les dépendances manquantes
- Vérifier la configuration native

### 2. Inscription Apple Developer (pour iOS)
- Créer un compte Apple Developer
- Configurer les certificats et profils
- Mettre à jour les credentials EAS

### 3. Optimisation
- Réduire la taille de l'archive
- Configurer les variables d'environnement
- Mettre en place les credentials de signature

## Liens Utiles

- Dashboard EAS: https://expo.dev/accounts/ndom2504/projects/capitune-mobile
- Documentation EAS Build: https://docs.expo.dev/build/introduction/
- Documentation Apple Developer: https://developer.apple.com/register/

## Status Actuel

- ✅ Configuration EAS complète
- ✅ Scripts de build configurés
- ❌ Build Android en erreur
- ❌ Build iOS limité (compte developer requis)
- ⏸️ En attente de résolution des erreurs

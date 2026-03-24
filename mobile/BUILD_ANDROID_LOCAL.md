# 🚀 Build Android Local - Instructions Complètes

## 📋 Étape 1: Créer local.properties

**Action manuelle requise :**

1. **Ouvrez l'explorateur de fichiers**
2. **Naviguez vers** : `C:\capitunecax\mobile\android\`
3. **Créez un fichier** : `local.properties`
4. **Ajoutez cette ligne** :
   ```
   sdk.dir=C\:/Users/mondong/Android/Sdk
   ```

## 📋 Étape 2: Configuration Terminal

**Copiez-collez ces commandes PowerShell :**
```powershell
$env:ANDROID_HOME = "C:\Users\mondong\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools"
$env:Path += ";$env:ANDROID_HOME\emulator"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path += ";$env:JAVA_HOME\bin"
```

## 📋 Étape 3: Lancer le Build

**Depuis la racine du projet :**
```bash
cd C:\capitunecax\mobile
npx expo run:android
```

## 🎯 Pourquoi Ça Marche

### **Local Properties**
- 📁 **Indique à Gradle** où trouver le SDK
- 🔧 **Évite les erreurs** de chemin
- ✅ **Configuration permanente** pour le build

### **Variables d'Environnement**
- 📱 **ADB** : Communication avec le téléphone
- ☕ **Java** : Compilation du code natif
- 🛠️ **SDK Tools** : Outils de build Android

### **Avantages vs EAS**
| Caractéristique | Build Local | EAS Cloud |
|----------------|-------------|-----------|
| Coût | Gratuit | $29/mois |
| Limites | Aucune | 1 build/mois |
| Vitesse | Immédiat | File d'attente |
| Contrôle | Total | Limité |

## 📱 Résultat Attendu

**Après le build (5-10 min) :**
- 📲 **APK installé** sur votre téléphone
- 🎨 **Vos icônes personnalisées** visibles
- 🔧 **Toutes les fonctionnalités** opérationnelles
- 🚀 **App native** performante

## ⚡ Astuces

### **Premier Build**
- ⏳ **Soyez patient** : téléchargement des dépendances
- 📊 **Surveillez** la progression dans le terminal
- ☕ **Prenez un café** : le build prend du temps

### **Builds Suivants**
- ⚡ **Plus rapides** : dépendances déjà téléchargées
- 🔄 **Incrémentaux** : seules les modifications sont rebuildées
- 📱 **Installation** automatique si téléphone connecté

## ✅ Checklist Avant Build

- [ ] **local.properties** créé dans `android/`
- [ ] **Variables configurées** dans PowerShell
- [ ] **Téléphone connecté** en USB
- [ ] **Débogage USB** activé
- [ ] **Dans le bon dossier** : `C:\capitunecax\mobile`

## 🚀 Lancez le Build !

**Une fois prêt :**
```bash
npx expo run:android
```

**Vos nouvelles icônes CAPITUNE vous attendent !** 🎨

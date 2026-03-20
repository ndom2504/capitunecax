# 🎨 Guide d'Installation des Icônes CAPITUNE

## 📋 **Étapes à Suivre**

### **1. Préparation des Fichiers d'Icônes**

**Action requise de votre part :**

1. **Ouvrez** votre image `icons.png` actuelle
2. **Découpez** chaque icône individuellement
3. **Enregistrez** chaque icône séparément dans `C:\capitunecax\mobile\assets\icons\`

**Noms de fichiers requis :**
```
📁 C:\capitunecax\mobile\assets\icons\
├── dashboard.png    🏠
├── projet.png       📁  
├── inside.png       ✨
├── documents.png    📄
├── rencontre.png    👥
└── profil.png       👤
```

### **2. Format Recommandé**

- ✅ **Format** : PNG (fond transparent)
- ✅ **Taille** : 128x128px minimum
- ✅ **Qualité** : Haute définition
- ✅ **Fond** : Transparent

### **3. DashboardScreen Créé**

**Fichier créé :** `C:\capitunecax\mobile\screens\DashboardScreen.js`

**Caractéristiques :**
- 🎨 **Design moderne** avec vos icônes
- 📱 **Grille responsive** 2 colonnes
- 🎯 **Navigation fluide** vers chaque section
- 💙 **Couleurs CAPITUNE** (#003366)

### **4. Intégration dans votre App**

**Pour utiliser ce dashboard :**

1. **Importez** le composant :
```javascript
import DashboardScreen from './screens/DashboardScreen';
```

2. **Ajoutez** à votre navigation :
```javascript
<Stack.Screen name="Dashboard" component={DashboardScreen} />
```

3. **Ou remplacez** votre dashboard actuel dans `app/(tabs)/dashboard.tsx` :
```javascript
import DashboardScreen from '../../screens/DashboardScreen';

// Dans le return
<DashboardScreen />
```

## 🎯 **Résultat Visuel Attendu**

```
┌─────────────────────────────────┐
│        TABLEAU DE BORD           │
├─────────────┬─────────────────────┤
│    🏠       │        📁          │
│  DASHBOARD  │       PROJET        │
├─────────────┼─────────────────────┤
│    ✨       │        📄          │
│   INSIDE    │    DOCUMENTS        │
│ (Communauté │                     │
│  Capitune)  │                     │
├─────────────┼─────────────────────┤
│    👥       │        👤          │
│  RENCONTRE  │       PROFIL        │
└─────────────┴─────────────────────┘
```

## 🔧 **Personnalisation**

### **Couleurs**
- 🎯 **Bleu principal** : `#003366` (votre bleu CAPITUNE)
- ⚪ **Background** : `#F8FAFC` (gris clair)
- ⚫ **Textes** : `#000000` (noir)

### **Dimensions**
- 📏 **Cartes** : 47% de largeur (responsive)
- 📐 **Icônes** : 65x65px
- 📱 **Marges** : 20px padding

## 🚀 **Prochaines Étapes**

### **Immédiat**
1. **Créez** les 6 fichiers d'icônes individuels
2. **Testez** le dashboard avec `npx expo start`
3. **Vérifiez** que toutes les icônes s'affichent

### **Integration**
1. **Remplacez** votre dashboard actuel
2. **Configurez** la navigation
3. **Testez** tous les liens

## 🎉 **Avantages**

- ✅ **Design professionnel** avec vos icônes
- ✅ **Code propre** et maintenable
- ✅ **Responsive** sur tous les appareils
- ✅ **Navigation intuitive**
- ✅ **Branding CAPITUNE** cohérent

---

## 📞 **Besoin d'Aide ?**

**Pour créer les icônes individuelles :**
1. **Ouvrez** `icons.png` dans Photoshop/GIMP
2. **Utilisez** l'outil de sélection
3. **Copiez** chaque icône dans un nouveau fichier
4. **Enregistrez** en PNG transparent

**Ou utilisez un outil en ligne comme :**
- remove.bg (pour fond transparent)
- canva.com (pour redimensionner)

**Une fois les icônes prêtes, votre dashboard sera fonctionnel !** 🚀

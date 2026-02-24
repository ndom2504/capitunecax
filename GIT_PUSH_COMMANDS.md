# 🔄 Commandes Git pour Déployer

## 📤 Pousser le code sur GitHub

Copiez et collez ces commandes dans votre terminal :

```bash
# 1. Vérifier le statut
git status

# 2. Ajouter tous les nouveaux fichiers
git add .

# 3. Commit avec un message descriptif
git commit -m "🚀 Préparation déploiement Vercel - Configuration complète"

# 4. Pousser vers GitHub
git push origin main
```

---

## ✅ Si c'est votre premier push

Si vous n'avez pas encore configuré le repository :

```bash
# 1. Initialiser Git (si pas déjà fait)
git init

# 2. Configurer votre identité
git config user.name "ndom2504"
git config user.email "votre.email@example.com"

# 3. Ajouter le repository distant
git remote add origin https://github.com/ndom2504/capituneca.git

# 4. Créer la branche main
git branch -M main

# 5. Ajouter tous les fichiers
git add .

# 6. Premier commit
git commit -m "🎉 Initial commit - CAPITUNE project"

# 7. Pousser vers GitHub
git push -u origin main
```

---

## 🔐 Si demande d'authentification

GitHub peut demander un **Personal Access Token** au lieu du mot de passe.

### Créer un token :
1. Aller sur : https://github.com/settings/tokens
2. **Generate new token** → **Classic**
3. Sélectionner : `repo` (accès complet)
4. Copier le token (vous ne le verrez qu'une fois !)

### Utiliser le token :
```bash
# Username: ndom2504
# Password: ghp_VOTRE_TOKEN_ICI
```

---

## 📋 Fichiers qui seront poussés

Voici ce qui sera ajouté à GitHub :

### ✅ Fichiers de configuration Vercel
- `astro.config.vercel.mjs` - Config Astro pour Vercel
- `vercel.json` - Config Vercel
- `.vercelignore` - Fichiers à ignorer

### ✅ Documentation
- `VERCEL_DEPLOY.md` - Guide complet
- `DEPLOY_QUICK_START.md` - Guide rapide
- `DEPLOYMENT_CHECKLIST.md` - Checklist
- `GIT_PUSH_COMMANDS.md` - Ce fichier

### ✅ Code source
- Tous vos fichiers `.astro`, `.tsx`, `.ts`
- Composants, pages, API routes

### ❌ Fichiers NON inclus (ignorés par .gitignore)
- `.env` - Variables sensibles (IMPORTANT !)
- `node_modules/` - Dépendances
- `dist/` - Fichiers compilés
- `.astro/` - Cache Astro

---

## 🎯 Après le push

1. ✅ Vérifier sur GitHub : https://github.com/ndom2504/capituneca
2. 🚀 Aller sur Vercel : https://vercel.com/new
3. 🔗 Importer le repo
4. 🔐 Ajouter les variables d'environnement
5. 🚀 Deploy !

---

## 🔄 Futures mises à jour

Pour les prochains changements, utilisez simplement :

```bash
git add .
git commit -m "✨ Description du changement"
git push
```

Vercel redéploiera automatiquement ! 🎉

---

## 🆘 Dépannage

### Erreur : "fatal: not a git repository"
```bash
git init
git remote add origin https://github.com/ndom2504/capituneca.git
```

### Erreur : "Permission denied"
Vérifiez votre token GitHub ou utilisez SSH.

### Erreur : "failed to push some refs"
```bash
git pull origin main --rebase
git push origin main
```

### Erreur : ".env dans le commit"
```bash
# Retirer .env de Git
git rm --cached .env
git commit -m "🔒 Remove .env from tracking"
git push
```

---

## ✅ Vérification finale

Avant de pousser, vérifiez :
- [ ] `.env` est dans `.gitignore`
- [ ] Pas de clés API dans le code
- [ ] `npm run build:vercel` fonctionne
- [ ] Tous les fichiers importants ajoutés

**Prêt ? Let's go ! 🚀**

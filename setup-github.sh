#!/bin/bash

echo "🔍 Lecture du token depuis .env..."
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "❌ Token non trouvé dans .env"
        echo "Assurez-vous d'avoir une ligne: GITHUB_TOKEN=github_pat_..."
        exit 1
    fi
    echo "✅ Token trouvé"
else
    echo "❌ Fichier .env non trouvé"
    exit 1
fi

echo "🔧 Configuration du remote avec le token..."
git remote set-url origin https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git 2>/dev/null || \
git remote add origin https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git

echo "📤 Push vers GitHub..."
if git push -u origin main; then
    echo "✅ Code poussé avec succès vers GitHub!"
    echo "🌐 Votre repo: https://github.com/${GITHUB_REPO}"
else
    echo "❌ Erreur lors du push"
    echo ""
    echo "Vérifiez que:"
    echo "1. Le repo existe sur GitHub"
    echo "2. Le token a les permissions 'repo'"
    echo "3. Vous êtes bien connecté"
fi

# Configuration de l'authentification CAPITUNE

Ce document explique comment configurer l'authentification complète pour l'application CAPITUNE.

## 🔐 Système d'authentification

L'application supporte trois méthodes d'authentification :
1. **Email/Mot de passe** (classique)
2. **Google OAuth 2.0**
3. **Microsoft OAuth 2.0**

## 📋 Prérequis

### 1. Base de données utilisateurs

Vous aurez besoin d'une base de données pour stocker les utilisateurs. Options recommandées :

#### Option A : Cloudflare D1 (SQL)
```bash
# Créer une base de données D1
wrangler d1 create capitune-users

# Créer la table users
wrangler d1 execute capitune-users --file=./schema.sql
```

**schema.sql :**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  provider TEXT DEFAULT 'credentials',
  provider_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Option B : Cloudflare KV (NoSQL)
Plus simple mais moins structuré. Utilisez pour prototypage rapide.

### 2. Configuration Google OAuth

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Activer l'API Google+ 
4. Créer des identifiants OAuth 2.0 :
   - Type : Application Web
   - URIs de redirection autorisées : `https://votredomaine.com/api/auth/callback/google`
   - Pour dev local : `http://localhost:3000/api/auth/callback/google`

5. Récupérer :
   - **Client ID**
   - **Client Secret**

6. Ajouter dans `.env` :
```env
GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret
```

### 3. Configuration Microsoft OAuth

1. Aller sur [Azure Portal](https://portal.azure.com/)
2. Enregistrer une nouvelle application dans Azure AD :
   - Nom : CAPITUNE
   - Types de comptes : Comptes personnels Microsoft et comptes professionnels
   - URI de redirection : `https://votredomaine.com/api/auth/callback/microsoft`
   - Pour dev local : `http://localhost:3000/api/auth/callback/microsoft`

3. Récupérer :
   - **Application (client) ID**
   - **Directory (tenant) ID**
   - Créer un **Client Secret**

4. Ajouter dans `.env` :
```env
MICROSOFT_CLIENT_ID=votre_client_id
MICROSOFT_CLIENT_SECRET=votre_client_secret
MICROSOFT_TENANT_ID=votre_tenant_id
```

### 4. Sécurité des sessions

Générer une clé secrète pour signer les sessions :

```bash
# Générer une clé aléatoire
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ajouter dans `.env` :
```env
SESSION_SECRET=votre_cle_secrete_generee
```

## 🔧 Implémentation complète

### Installation des dépendances

```bash
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

### Structure des fichiers

```
src/
├── pages/
│   ├── connexion.astro          ✅ Créé
│   ├── inscription.astro        ✅ Créé
│   ├── dashboard.astro          ✅ Créé
│   └── api/
│       └── auth/
│           ├── signup.ts        ✅ Créé (à compléter)
│           ├── signin/
│           │   ├── credentials.ts    ✅ Créé (à compléter)
│           │   ├── google.ts         ✅ Créé (à compléter)
│           │   └── microsoft.ts      ✅ Créé (à compléter)
│           ├── callback/
│           │   ├── google.ts         ⚠️ À créer
│           │   └── microsoft.ts      ⚠️ À créer
│           └── signout.ts            ⚠️ À créer
├── lib/
│   ├── auth.ts                  ⚠️ À créer (helpers auth)
│   └── db.ts                    ⚠️ À créer (connexion DB)
└── middleware.ts                ⚠️ À mettre à jour
```

## 🚀 Prochaines étapes

### Phase 1 : Configuration de base (Actuelle)
- ✅ Pages d'authentification créées
- ✅ Routes API de base créées
- ⚠️ Configuration OAuth à compléter

### Phase 2 : Base de données
- [ ] Choisir et configurer la base de données (D1 ou KV)
- [ ] Implémenter les modèles utilisateurs
- [ ] Ajouter le hashing des mots de passe (bcrypt)

### Phase 3 : Sessions sécurisées
- [ ] Implémenter la gestion des sessions JWT
- [ ] Créer le middleware d'authentification
- [ ] Protéger les routes privées (dashboard, etc.)

### Phase 4 : OAuth complet
- [ ] Finaliser Google OAuth avec callback
- [ ] Finaliser Microsoft OAuth avec callback
- [ ] Gérer la création de compte via OAuth

### Phase 5 : Fonctionnalités avancées
- [ ] Vérification email
- [ ] Réinitialisation mot de passe
- [ ] Authentification à deux facteurs (2FA)
- [ ] Gestion des rôles (client, admin, consultant)

## 📱 Fonctionnalités du Dashboard

Le dashboard client permettra :
- ✅ Vue d'ensemble des dossiers
- ✅ Suivi en temps réel
- ✅ Messagerie avec consultants
- ✅ Gestion des documents
- ✅ Prise de rendez-vous
- ✅ Notifications
- ⚠️ Paiements (à implémenter)

## 🔒 Sécurité

Points importants à implémenter :
- [ ] Hashing des mots de passe (bcrypt, argon2)
- [ ] Protection CSRF
- [ ] Rate limiting sur les routes d'auth
- [ ] Validation des emails
- [ ] Sessions sécurisées (httpOnly, secure, sameSite)
- [ ] Audit logs

## 📚 Ressources

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Auth.js](https://authjs.dev/)

## 💡 Notes

L'infrastructure actuelle est prête pour recevoir la configuration complète. Les routes sont en place mais nécessitent :
1. Variables d'environnement OAuth
2. Base de données configurée
3. Logique de session complète

Pour l'instant, le système fonctionne en mode "démo" et redirige vers les pages appropriées sans authentification réelle.

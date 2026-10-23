# MachineCare API

API REST permettant à une entreprise industrielle de Safi de **centraliser son parc de machines** et de **suivre chaque panne depuis son signalement jusqu'à sa résolution**.

> Question du projet : comment suivre une panne depuis son signalement jusqu'à sa résolution, tout en conservant des données fiables et en protégeant l'accès à l'API ?

> **Note sur l'historique Git** : les commits datés du 28 septembre au 4 octobre 2026 et marqués `[date simulée]` ont en réalité été créés le 23 octobre 2026. Leurs dates reconstituent une chronologie de démonstration et ne correspondent pas aux dates réelles du travail (voir [Suivi Git & Jira](#suivi-git--jira)).

- Une machine possède une référence unique, un nom, un atelier et un état (`disponible`, `en maintenance`, `hors service`).
- Un signalement est rattaché à une machine **existante** et à l'utilisateur qui l'a déclaré. Il suit le cycle `ouvert → en cours → résolu`.
- Le passage à `résolu` exige une **note de résolution** ; la **date de résolution** et l'utilisateur qui a résolu sont conservés.
- Toutes les routes métier sont protégées par un **JWT**. Tous les utilisateurs connectés ont les mêmes droits (pas de rôles).

## Stack technique

| Élément | Choix |
| --- | --- |
| Runtime / framework | Node.js 22, Express 5 (ES modules) |
| Base de données | MongoDB 6 + Mongoose |
| Authentification | `jsonwebtoken` (JWT), `bcrypt` (hachage des mots de passe) |
| Validation | `express-validator` + validations du schéma Mongoose |
| Conteneurs | Docker + Docker Compose (API + MongoDB) |
| Développement | `nodemon -L` + volume monté → redémarrage automatique sans rebuild |
| Tests | Vitest + Supertest + mongodb-memory-server, collection Postman (Newman) |

## Démarrage rapide (Docker Compose)

Prérequis : Docker et Docker Compose.

```bash
git clone https://github.com/ayanakkabi1/machinecare-api.git
cd machinecare-api
cp .env.example .env        # puis modifier JWT_SECRET et INITIAL_USER_PASSWORD
docker compose up --build   # -d pour lancer en arrière-plan
```

- API : http://localhost:5000
- MongoDB : `mongodb://localhost:27017/machinecare` (depuis la machine hôte, ex. MongoDB Compass)

Au premier démarrage, le compte défini par `INITIAL_USER_EMAIL` / `INITIAL_USER_PASSWORD` est créé automatiquement. Il sert à se connecter puis à créer les autres comptes.

Commandes utiles :

```bash
docker compose logs -f api   # suivre les logs de l'API
docker compose down          # arrêter les conteneurs
docker compose down -v       # arrêter et supprimer les données MongoDB
```

### Développement et hot reload

Le service `api` monte le code local dans le conteneur (`.:/app`) et lance `npm run dev` (`nodemon -L`). Toute modification d'un fichier `.js` redémarre automatiquement le serveur, **sans reconstruire l'image**. Le volume anonyme `/app/node_modules` conserve les dépendances installées dans l'image. Il faut reconstruire (`docker compose up --build`) uniquement après un changement de `package.json`.

### Lancement sans Docker (optionnel)

```bash
npm install
# dans .env : MONGO_URI=mongodb://localhost:27017/machinecare (MongoDB local)
npm run dev
```

## Variables d'environnement

| Variable | Description | Exemple |
| --- | --- | --- |
| `PORT` | Port d'écoute de l'API | `5000` |
| `MONGO_URI` | Chaîne de connexion MongoDB (**obligatoire**) | `mongodb://mongo:27017/machinecare` |
| `JWT_SECRET` | Clé de signature des JWT (**obligatoire**, à garder secrète) | chaîne aléatoire |
| `JWT_EXPIRES_IN` | Durée de validité du token | `1d` |
| `INITIAL_USER_NAME` / `INITIAL_USER_EMAIL` / `INITIAL_USER_PASSWORD` | Compte créé au premier démarrage | |

Le fichier `.env` est ignoré par Git (`.gitignore`) et par Docker (`.dockerignore`) : aucun secret n'est publié. Seul `.env.example` (sans secret) est versionné. Si `MONGO_URI` ou `JWT_SECRET` manque, le serveur refuse de démarrer avec un message explicite.

## Architecture

```
src/
├── server.js            # point d'entrée : variables d'env, connexion MongoDB, seed, app.listen
├── app.js               # application Express : middlewares globaux, routes, 404, gestion d'erreurs
├── config/
│   ├── db.js            # connexion Mongoose via MONGO_URI
│   └── seedUser.js      # création du compte initial
├── routes/              # déclaration des endpoints + chaîne de middlewares
├── validators/          # règles express-validator (body, query, params)
├── middlewares/
│   ├── authMiddleware.js  # vérification du JWT -> req.user
│   ├── validate.js        # transforme les erreurs de validation en 400
│   └── errorHandler.js    # 404 + gestion centralisée des erreurs
├── controllers/         # lisent la requête, appellent le service, formatent la réponse HTTP
├── services/            # logique métier (unicité, existence, transitions de statut...)
├── models/              # schémas Mongoose : User, Machine, Signalement
└── utils/               # AppError (erreur métier + code HTTP), constantes (statuts)
postman/
└── MachineCare.postman_collection.json
tests/                   # tests Vitest (service + API)
```

### Parcours d'une requête

Exemple : `PATCH /api/signalements/:id/statut`

1. **`app.js`** : `express.json()` parse le corps puis la requête est dirigée vers `signalementRoutes`.
2. **`authMiddleware`** : lit `Authorization: Bearer <token>`, vérifie la signature et l'expiration avec `JWT_SECRET`, vérifie que l'utilisateur existe toujours, puis place `req.user = { userId, email }`. Sinon → `401`.
3. **Validators + `validate`** : `id` doit être un ObjectId, `status` doit appartenir à `ouvert | en cours | résolu`. Sinon → `400` avec la liste des champs invalides.
4. **Controller** : récupère les données validées (`matchedData`) et appelle le service.
5. **Service** : charge le signalement (`404` s'il n'existe pas), vérifie la transition (`ouvert → en cours → résolu`), exige la note de résolution et enregistre `dateResolution` / `resolvedBy`.
6. **Model** : Mongoose valide le schéma et met à jour `updatedAt`.
7. Le controller renvoie `200` + le signalement. Toute erreur levée (`AppError`, erreur Mongoose, JSON invalide…) est capturée par **`errorHandler`** (Express 5 transmet automatiquement les erreurs des fonctions `async`) : le serveur ne s'arrête jamais sur une requête incorrecte.

### Authentification JWT

- Les mots de passe sont hachés avec **bcrypt** (hook `pre('save')` du modèle `User`) et ne sont jamais renvoyés (`select: false` + suppression dans `toJSON`).
- `POST /api/auth/login` compare le mot de passe avec `bcrypt.compare` et renvoie un JWT signé (`{ userId, email }`, durée `JWT_EXPIRES_IN`).
- Le même message est renvoyé pour un e-mail inconnu ou un mauvais mot de passe (on ne révèle pas quels comptes existent).
- Le client envoie ensuite `Authorization: Bearer <token>` sur toutes les routes protégées.

### Modèles de données

Tous les modèles ont `createdAt` et `updatedAt` (`timestamps: true`).

**User** : `name`, `email` (unique, en minuscules), `password` (haché).

**Machine** : `reference` (unique), `nom`, `workshop` (atelier), `status` (`disponible` par défaut | `en maintenance` | `hors service`).

**Signalement** : `machine` (réf. Machine), `declaredBy` (réf. User), `description`, `status` (`ouvert` par défaut | `en cours` | `résolu`), `noteResolution`, `dateResolution`, `resolvedBy` (réf. User).

## Règles métier

| Règle | Comportement |
| --- | --- |
| Référence de machine déjà utilisée | `409 Conflict` |
| Adresse e-mail déjà utilisée | `409 Conflict` |
| Champ obligatoire manquant / description vide | `400 Bad Request` |
| Statut inconnu (machine ou signalement, y compris dans les filtres) | `400 Bad Request` |
| Identifiant mal formé | `400 Bad Request` |
| Machine inexistante (création ou modification d'un signalement) | `404 Not Found` |
| Transition de statut non autorisée (ex. `ouvert → résolu`, retour en arrière) | `400 Bad Request` |
| Passage à `résolu` sans `noteResolution` | `400 Bad Request` |
| Modification d'un signalement déjà résolu | `409 Conflict` |
| Changement de mot de passe sans `currentPassword` correct | `400` / `401` |

### Suppression d'une machine possédant des signalements

**Choix retenu : la suppression est refusée (`409 Conflict`)** si la machine possède au moins un signalement, quel que soit son statut.

Raison : l'historique des pannes et des interventions est la donnée la plus précieuse du projet ; une suppression en cascade le ferait disparaître, et une suppression simple laisserait des signalements orphelins. Pour retirer une machine du parc, on passe son état à `hors service` (`PATCH /api/machines/:id`). Une machine sans aucun signalement peut être supprimée normalement (`200`).

## Format des réponses et des erreurs

Succès : `{ "message": "...", "machine": { ... } }` ou, pour une liste, `{ "count": 2, "machines": [ ... ] }`.

Erreur :

```json
{
  "message": "La description ne peut pas être vide",
  "details": [{ "champ": "description", "message": "La description ne peut pas être vide" }]
}
```

| Code | Signification |
| --- | --- |
| `200` / `201` | Succès / ressource créée |
| `400` | Données invalides, JSON mal formé, transition interdite |
| `401` | Token manquant, invalide ou expiré ; identifiants incorrects |
| `404` | Ressource ou route introuvable |
| `409` | Conflit : doublon (référence, e-mail), suppression refusée, signalement résolu |
| `500` | Erreur inattendue (détail uniquement dans les logs serveur) |

## Endpoints

Base URL : `http://localhost:5000`. 🔒 = en-tête `Authorization: Bearer <token>` obligatoire.

### Authentification & utilisateurs

| Méthode | Route | Description |
| --- | --- | --- |
| POST | `/api/auth/login` | Connexion, renvoie un JWT |
| GET 🔒 | `/api/users/me` | Consulter son profil |
| PATCH 🔒 | `/api/users/me` | Modifier son profil (`name`, `email`, `password` + `currentPassword`) |
| POST 🔒 | `/api/users` | Créer un compte utilisateur |
| GET 🔒 | `/api/users` | Lister les utilisateurs |

```http
POST /api/auth/login
{ "email": "user@machinecare.com", "password": "UserPassword123!" }

200 { "message": "Connexion réussie", "token": "eyJhbGciOi...", "user": { "_id": "...", "name": "...", "email": "..." } }
```

```http
POST /api/users
{ "name": "Technicien Safi", "email": "tech@machinecare.com", "password": "Technicien123!" }
```

### Machines 🔒

| Méthode | Route | Description |
| --- | --- | --- |
| POST | `/api/machines` | Créer une machine |
| GET | `/api/machines` | Lister — filtres `?workshop=Atelier A` et/ou `?status=disponible` |
| GET | `/api/machines/:id` | Détail |
| PATCH / PUT | `/api/machines/:id` | Modifier un ou plusieurs champs |
| DELETE | `/api/machines/:id` | Supprimer (refusé si la machine a des signalements) |
| GET | `/api/machines/:id/signalements` | Historique des signalements de la machine |

```http
POST /api/machines
{ "reference": "PRS-001", "nom": "Presse hydraulique", "workshop": "Atelier A", "status": "disponible" }
```

Le filtre `workshop` ignore la casse (`atelier a` = `Atelier A`).

### Signalements 🔒

| Méthode | Route | Description |
| --- | --- | --- |
| POST | `/api/signalements` | Déclarer une panne (`machineId`, `description`) |
| GET | `/api/signalements` | Lister — filtres `?machine=<id>` et/ou `?status=ouvert` |
| GET | `/api/signalements/:id` | Détail (machine et utilisateurs inclus) |
| PATCH | `/api/signalements/:id` | Modifier (`description`, `machineId`, `status`, `noteResolution`) |
| PATCH | `/api/signalements/:id/statut` | Faire évoluer le statut (`status`, `noteResolution`) |

Suivi complet d'une panne :

```http
POST /api/signalements
{ "machineId": "6adb...", "description": "Fuite d'huile au niveau du vérin principal" }
-> 201, status "ouvert", declaredBy = utilisateur connecté

PATCH /api/signalements/:id/statut
{ "status": "en cours" }

PATCH /api/signalements/:id/statut
{ "status": "résolu", "noteResolution": "Joint du vérin remplacé, test sous pression OK" }
-> 200, dateResolution et resolvedBy renseignés
```

Dans l'URL, les statuts avec espace ou accent s'encodent automatiquement dans Postman (`?status=en cours`, `?status=résolu`).

## Tests

### Tests automatisés (Vitest)

```bash
npm install
npm test          # vitest run (MongoDB en mémoire via mongodb-memory-server, aucun conteneur nécessaire)
npm run test:watch
```

- `tests/machineService.test.js` : service machines (modification, unicité de la référence, statuts, filtres, suppression refusée si signalements).
- `tests/machineApi.test.js` : endpoints machines via Supertest (JWT obligatoire, 400 / 404 / 409).
- `tests/signalementApi.test.js` : suivi d'une panne (déclaration, cas invalides, cycle `ouvert → en cours → résolu`, note obligatoire, filtres, historique).

### Collection Postman

Fichier : [`postman/MachineCare.postman_collection.json`](postman/MachineCare.postman_collection.json) — 44 requêtes, 80 assertions, à exécuter dans l'ordre.

1. **Authentification & profil** : connexion (le token est enregistré automatiquement dans `{{token}}`), mauvais mot de passe, **accès sans JWT → 401**, JWT invalide → 401, profil.
2. **Utilisateurs** : création, e-mail en doublon → 409, champs manquants → 400.
3. **Machines** : CRUD, filtres, **référence en doublon → 409**, **statut inconnu → 400**, champs manquants → 400, machine inexistante → 404.
4. **Signalements** : déclaration, **description vide → 400**, **machine inexistante → 404**, filtres, `ouvert → en cours → résolu`, résolution sans note → 400, signalement résolu non modifiable → 409, historique.
5. **Suppression & erreurs** : suppression refusée → 409, suppression d'une machine sans signalement, route inconnue → 404.

Utilisation :

- **Postman** : *Import* → choisir le fichier → *Run collection*. Adapter les variables `baseUrl`, `initialEmail`, `initialPassword` si besoin.
- **Ligne de commande** (API démarrée) : `npm run test:api` (utilise Newman).

## Docker

- `Dockerfile` : image `node:22-alpine`, installation des dépendances (`npm ci`), exécution en utilisateur non-root `node`, commande `npm start`.
- `compose.yml` : services `api` (port 5000, code monté, `npm run dev`) et `mongo` (`mongo:6`, volume persistant `mongo_data`, healthcheck). L'API attend que MongoDB soit prêt (`depends_on: condition: service_healthy`).

Image de production (optionnel) :

```bash
docker build -t machinecare-api .
docker run --env-file .env -p 5000:5000 machinecare-api
```

## Suivi Git & Jira

- Projet Jira : clé `MAC` (epics → user stories → sous-tâches).
- Branches : `feature/MAC-<id>-<description>` créées depuis `dev`, fusionnées par pull request.
- Messages de commit : `MAC-<id> <type>: <description>` (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`). Le suffixe `#Done` (smart commit) fait passer le ticket à « Done ».
- Les commits marqués `[date simulée]` ont été créés le 23 octobre 2026 avec des dates reconstituées entre le 28 septembre et le 4 octobre 2026 ; elles ne reflètent pas la chronologie réelle du travail.

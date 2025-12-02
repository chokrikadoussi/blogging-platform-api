# Goals
__The goals of this project are to help you:__

* Understand what the RESTful APIs are including best practices and conventions
* Learn how to create a RESTful API
* Learn about common HTTP methods like GET, POST, PUT, PATCH, DELETE
* Learn about status codes and error handling in APIs
* Learn how to perform CRUD operations using an API
* Learn how to work with databases

# Requirements
__You should create a RESTful API for a personal blogging platform. The API should allow users to perform the following operations:__

* Create a new blog post
* Update an existing blog post
* Delete an existing blog post
* Get a single blog post
* Get all blog posts
* Filter blog posts by a search term

# DB : MySQL

```mysql
create table posts
(
id        int auto_increment
primary key,
title     varchar(255)                        not null,
content   text                                not null,
category  varchar(255)                        not null,
createdAt timestamp default CURRENT_TIMESTAMP null,
updatedAt timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP
);

create table tags
(
id   int auto_increment
primary key,
name varchar(255) not null
);

create table tags_posts
(
tagId  int not null,
postId int not null,
primary key (tagId, postId),
constraint tags_posts_ibfk_1
foreign key (postId) references posts (id),
constraint tags_posts_ibfk_2
foreign key (tagId) references tags (id)
);

create index postId
on tags_posts (postId);
```

# Compte-rendu Codex
## Points forts
- Les six opérations exigées (CRUD + filtrage) sont déjà exposées dans `services/postService.js`, avec Express (`app.js`) et un pool MySQL (`utils/db.js`) prêt à consommer les requêtes.
- La structure actuelle sépare l’entrée (`index.js`), la configuration (`app.js`) et le routeur métier, ce qui rend l’API facile à démarrer et à modifier.
- Le README fournit le schéma des tables `posts`, `tags` et `tags_posts`, ce qui clarifie comment les données doivent être organisées.

## Points faibles
- Les requêtes SQL dans `services/postService.js` sont construites par concaténation (notamment `GET /posts`), ouvrant la porte aux injections SQL et limitant la réutilisation des paramètres.
- `POST /posts` ne gère pas les tags : il écrit uniquement dans `posts` et renvoie l’ID sans alimenter `tags`/`tags_posts`, donc les réponses ne reflètent pas l’état complet attendu.
- Il manque une validation formelle des payloads et une gestion centralisée des erreurs, ce qui entraîne des réponses d’erreur inconsistantes (callback -> `res.status(500).send(err)`).

## Points d’amélioration
- Formaliser une couche `models/post.js` et un `postService` qui exécutent des requêtes paramétrées (`mysql2` promise) avec transactions pour insérer/mettre à jour les tags avant de renvoyer le post complet.
- Introduire des validations strictes (`title/content/category` requis, `tags` tableau, longueurs max) et un middleware d’erreurs pour fournir `400`, `404` ou `500` selon les scénarios métier.
- Documenter les payloads/réponses (exemples cURL/JSON mentionnés dans le plan pédagogique) et normaliser les formats `res.status(...).json(...)` pour chaque endpoint.

## À approfondir
- Ajouter des tests d’intégration (Jest + supertest ou similaire) pour couvrir `POST/GET/PUT/DELETE /posts` et faire en sorte que `npm test` exécute ces suites.
- Compléter la documentation “Comment démarrer” avec les variables d’environnement requises (`DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `PORT`).
- Rechercher la meilleure stratégie pour synchroniser les tags (création conditionnelle, suppression des relations obsolètes) et capturer les erreurs métier (`NotFound`, doublons, etc.).

## Plan d’implémentation service/modèle
1. **Connexion centralisée (`db.js`)**
   - Charger les variables `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` via `dotenv`.
   - Créer un pool MySQL (`mysql2.createPool`) ou au minimum un singleton `createConnection`.
   - Exporter une fonction `query(sql, params)` qui renvoie une promesse et un `executeTransaction(callback)` pour encapsuler `BEGIN`, `COMMIT`, `ROLLBACK`.
   - Surveiller les erreurs de connexion (`pool.on('error', …)` si disponible) et journaliser un message clair.
2. **Modèle `Post` (`models/post.js`)**
   - Implémenter `findAll(term, pagination)` exécutant la requête SQL avec `LEFT JOIN`/`JSON_ARRAYAGG`, gestion de `term` via placeholders et conversion du `result` en tableau sans doublons de tags.
   - `findById(id)` : même jointure, retourne `null` si aucun post, structure `{ id, title, content, category, tags, createdAt, updatedAt }`.
   - `create(post)` : insère dans `posts`, retourne `insertId`.
   - `update(id, post)` : met à jour `title`, `content`, `category`.
   - `delete(id)` : supprime les relations `tags_posts` puis le post (voir transaction côté service).
3. **Service métier (`services/postService.js`)**
   - Fonction `validatePayload(payload)` vérifie `title/content/category` non vides, `tags` est un tableau, éventuellement `tags.length` limité et éléments string trimés.
   - `createPost(payload)` : commence une transaction, insère le post (`PostModel.create`), gère les `tags` en vérifiant s’ils existent (`SELECT id FROM tags WHERE name IN (?)`), crée ceux qui manquent, peuple `tags_posts`, commit, puis renvoie `PostModel.findById(newId)` pour avoir le résultat complet.
   - `updatePost(id, payload)` : transaction, met à jour le post, synchronise `tags_posts` (supprime anciennes relations, recrée nouvelles), commit, retourne `findById`.
   - `deletePost(id)` : transaction pour supprimer `tags_posts` puis `posts`.
   - `searchPosts(term)` et `getPostById(id)` délèguent au modèle, gèrent erreurs (par ex. `throw new Error('NotFound')` si non trouvé).
4. **Routes (`app.js`)**
   - Chaque route `async` appelle le service : `await postService.createPost(req.body)` etc.
   - Capturer les erreurs (`try/catch`), transformer les erreurs métiers en statuts (`400` pour validation, `404` pour non trouvé, `500` sinon).
   - Retirer toute logique SQL, garder seulement `res.status(...).json(...)`.
   - Ajouter un middleware global `app.use((err, req, res, next) => { ... })` si pertinent pour uniformiser les réponses.
5. **Validation & retours**
   - Ajouter des messages d’erreur explicites (`"tags doit être un tableau de chaînes"`) et des contraintes sur les longueurs (par exemple max 255 caractères pour `title/category`).
   - Après création/màj renvoyer le post complet (avec tags), pas seulement l’ID.
   - Documenter dans le README les payloads attendus et les structures de réponse (exemples `POST /posts` et `GET /posts/:id`).
6. **Documentation pédagogique**
   - Pour chaque endpoint, noter un exemple complet incluant payload, erreurs possibles et statut attendu.
   - Ajouter un paragraphe “Comment démarrer”/“Variables d’environnement” si absent.
   - Garder le ton pédagogique : expliquer pourquoi la couche service modélise la logique et mentionner brièvement comment tester manuellement via cURL/Postman.

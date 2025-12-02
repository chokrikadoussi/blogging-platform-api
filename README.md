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
- L’API couvre déjà les six opérations demandées (CRUD + filtrage) et embarque Express + `express.json()` : bonne base pédagogique.
- L’isolation du serveur (`index.js`) facilite le démarrage et des interventions ciblées sur la logique métier.
## Points faibles
- Le projet expose directement la connexion MySQL dans `app.js`, sans pool ni couche d’abstraction, ce qui limite la testabilité et l’évolution (modèle/DAO manquant).
- L’insertion `POST /posts` ne persiste que la table `posts` et ne crée ni `tags` ni `tags_posts`, donc les tags déclarés dans la requête ne se reflètent pas dans les réponses.
- La recherche (`GET /posts?term=…`) construit la clause `WHERE` en concaténant des strings, ouvrant aux injections SQL et empêchant l’usage de paramètres préparés.
## Points d’amélioration
- Ajouter une couche service/modèle pour centraliser les requêtes SQL, récupérer les tags via des transactions et simplifier la répétition du SQL dans plusieurs routes.
- Paramétrer correctement les requêtes filtrées (bind de `term`, pagination limitée) et renforcer la validation du payload (`title`, `content`, `category`, `tags` obligatoires, lengths raisonnables).
- Compléter le README avec les exigences fonctionnelles + exemples de requêtes/réponses pour cadrer l’exercice (payloads d’insertions avec tags, structure de réponse attendue).
## À approfondir
- Confirmer les règles métier attendues (gestion des tags existants, unicité, suppression en cascade) pour éviter des comportements incohérents lors des CRUD.
- Prévoir une stratégie de gestion des erreurs structurée (http status, messages) et définir une story d’API/endpoint standard pour chaque opération.

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

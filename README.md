# Blogging Platform API

## Objectifs pédagogiques

Ce projet vous permet d’acquérir les compétences suivantes :

- Comprendre les principes et bonnes pratiques des APIs RESTful
- Maîtriser la création d’une API RESTful avec Node.js et MySQL
- Utiliser les méthodes HTTP courantes : GET, POST, PUT, DELETE
- Gérer les codes de statut et les erreurs dans une API
- Réaliser des opérations CRUD sur une base de données
- Organiser un projet backend de façon modulaire et professionnelle

## Fonctionnalités

L’API permet de :
- Créer un nouvel article de blog
- Mettre à jour un article existant
- Supprimer un article
- Récupérer un article par son identifiant
- Lister tous les articles
- Filtrer les articles par mot-clé
- Associer des tags à chaque article

## Architecture et organisation

- **Express** pour la gestion des routes et des middlewares
- **MySQL** pour la persistance des données
- **Modèle MVC** : séparation entre routes, services métier et modèles
- **Validation centralisée** des données via middleware
- **Transactions SQL** pour garantir la cohérence lors des opérations complexes
- **Gestion des erreurs** uniforme et professionnelle

## Schéma de la base de données

```mysql
create table posts
(
id        int auto_increment primary key,
title     varchar(255) not null,
content   text not null,
category  varchar(255) not null,
createdAt timestamp default CURRENT_TIMESTAMP null,
updatedAt timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP
);

create table tags
(
id   int auto_increment primary key,
name varchar(255) not null
);

create table tags_posts
(
tagId  int not null,
postId int not null,
primary key (tagId, postId),
constraint tags_posts_ibfk_1 foreign key (postId) references posts (id),
constraint tags_posts_ibfk_2 foreign key (tagId) references tags (id)
);

create index postId on tags_posts (postId);
```

## Exemples d’utilisation

### Création d’un post
```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mon premier post",
    "content": "Ceci est le contenu.",
    "category": "Tech",
    "tags": ["nodejs", "mysql"]
  }'
```

### Récupération de tous les posts
```bash
curl http://localhost:3000/posts
```

### Filtrage par mot-clé
```bash
curl http://localhost:3000/posts?term=Tech
```

### Mise à jour d’un post
```bash
curl -X PUT http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Titre modifié",
    "content": "Nouveau contenu.",
    "category": "Programmation",
    "tags": ["backend"]
  }'
```

### Suppression d’un post
```bash
curl -X DELETE http://localhost:3000/posts/1
```

## Démarrage rapide

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/blogging-platform-api.git
   cd blogging-platform-api
   ```
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Configurer la base de données (voir le schéma ci-dessus)
4. Créer un fichier `.env` avec :
   ```env
   DB_HOST=localhost
   DB_USERNAME=root
   DB_PASSWORD=motdepasse
   DB_DATABASE=blog
   PORT=3000
   ```
5. Lancer le serveur :
   ```bash
   npm start
   ```

## Compétences acquises

- Structuration d’un projet backend professionnel
- Utilisation avancée d’Express et MySQL
- Gestion des transactions et des relations N-N (tags/posts)
- Validation des données et gestion centralisée des erreurs
- Documentation technique et pédagogique
- Utilisation de middlewares pour la sécurité et la robustesse
- Réalisation d’une API conforme aux standards REST

## Pour aller plus loin

- Ajouter des tests d’intégration (Jest, Supertest)
- Sécuriser l’API (authentification, validation avancée)
- Ajouter la pagination et le tri sur les endpoints de listing
- Améliorer la documentation (OpenAPI/Swagger)

---

Ce projet vous permet de maîtriser la création d’une API RESTful complète, robuste et maintenable, tout en adoptant les standards professionnels du développement backend.

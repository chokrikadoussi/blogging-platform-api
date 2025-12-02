/**
 * Module de gestion des posts et des tags pour la plateforme de blogging.
 * Fournit des fonctions CRUD et la gestion des associations tags-posts.
 * Utilise MySQL via le module db.
 */
const db = require("../utils/db");

/**
 * Récupère tous les posts, éventuellement filtrés par un terme de recherche.
 * @param {string} [term] - Terme de recherche pour filtrer les posts par titre, contenu ou catégorie.
 * @returns {Promise<Array>} Liste des posts avec leurs tags.
 */
const findAll = async (term) => {
  const whereClause = term ? "WHERE title LIKE ? OR content LIKE ? OR category LIKE ?\n" : "";
  const query =
    "SELECT p.id, title, content, category, JSON_ARRAYAGG(t.name) AS tags, createdAt, updatedAt\n" +
    "FROM posts p\n" +
    "LEFT JOIN tags_posts tp ON tp.postId = p.id\n" +
    "LEFT JOIN tags t ON tp.tagId = t.id\n" +
    whereClause +
    "GROUP BY p.id, p.title, p.content, p.category, p.createdAt, p.updatedAt;";

  const params = term ? [`%${term}%`, `%${term}%`, `%${term}%`] : [];
  const [rows] = await db.query(query, params);

  return {...rows, tags: normalizeTags(rows.tags)};
};

/**
 * Récupère un post par son identifiant.
 * @param {number} id - Identifiant du post.
 * @returns {Promise<Object|null>} Le post trouvé ou null si inexistant.
 */
const findById = async (id) => {
  const query =
    "SELECT p.id, title, content, category, JSON_ARRAYAGG(t.name) AS tags, createdAt, updatedAt\n" +
    "FROM posts p\n" +
    "LEFT JOIN tags_posts tp ON tp.postId = p.id\n" +
    "LEFT JOIN tags t ON tp.tagId = t.id\n" +
    "WHERE p.id = ?\n" +
    "GROUP BY p.id, p.title, p.content, p.category, p.createdAt, p.updatedAt;"

  const [rows] = await db.query(query, [id]);
  const post = rows[0];
  if (!post) return null;
  return {...post, tags: normalizeTags(post.tags)};
}

/**
 * Crée un nouveau post et associe les tags.
 * @param {Object} payload - Données du post à créer.
 * @param {string} payload.title - Titre du post.
 * @param {string} payload.content - Contenu du post.
 * @param {string} payload.category - Catégorie du post.
 * @param {Array<string>} payload.tags - Liste des tags.
 * @returns {Promise<Object>} Le post créé avec ses tags.
 */
const create = async (payload) => {
  const {title, content, category, tags} = payload;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    // 1- Créer tags
    const tagsId = await ensureTags(connection, normalizeTags(tags));

    // 2- Créer post
    const [newPost] = await connection.query("INSERT INTO posts (title, content, category) VALUES (?, ?, ?)", [title, content, category]);

    // 3- Ajouter relation tag-post
    for (const t of tagsId) {
      await connection.query("INSERT INTO tags_posts (tagId, postId) VALUES (?, ?)", [t, newPost.insertId]);
    }

    // 4- Retourner JSON
    await connection.commit();
    return findById(newPost.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Supprime un post et ses associations de tags.
 * @param {number} id - Identifiant du post à supprimer.
 * @returns {Promise<boolean>} True si le post a été supprimé, false sinon.
 */
const deleteById = async (id) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM tags_posts WHERE postId = ?", [id]);
    const [result] = await connection.query("DELETE FROM posts WHERE id = ?", [id]);
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Met à jour un post existant et ses tags associés.
 * @param {number} id - Identifiant du post à mettre à jour.
 * @param {Object} payload - Données à mettre à jour.
 * @param {string} payload.title - Nouveau titre.
 * @param {string} payload.content - Nouveau contenu.
 * @param {string} payload.category - Nouvelle catégorie.
 * @param {Array<string>} payload.tags - Nouveaux tags.
 * @returns {Promise<Object|null>} Le post mis à jour ou null si inexistant.
 */
const updatePost = async (id, payload) => {

  const post = await findById(id);
  if (!post) {
    return null;
  }

  const {title, content, category, tags} = payload;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const tagIds = await ensureTags(connection, normalizeTags(tags));
    await connection.query("UPDATE posts SET title = ?, content = ?, category = ? WHERE id = ?", [title, content, category, id]);
    await replacePostTags(connection, id, tagIds);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return findById(id);
}

module.exports = {
  findAll,
  findById,
  create,
  deleteById,
  updatePost,
};

/**
 * Normalise le format des tags reçus depuis la base de données.
 * @param {string|Array} raw - Tags bruts (JSON ou chaîne).
 * @returns {Array<string>} Tableau de tags.
 */
const normalizeTags = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return raw.split(',').map(t => t.trim());
  }
}

/**
 * Vérifie l'existence des tags, crée ceux qui n'existent pas et retourne leurs IDs.
 * @param {Object} connection - Connexion MySQL active.
 * @param {Array<string>} tags - Liste des tags à assurer.
 * @returns {Promise<Array<number>>} Tableau des IDs des tags.
 */
const ensureTags = async (connection, tags) => {
  if (!tags || tags.length === 0) return [];
  // Récupère les tags existants
  const [existing] = await connection.query("SELECT id, name FROM tags WHERE name IN (?)", [tags]);
  const existingNames = existing.map(t => t.name);
  const tagIds = existing.map(t => t.id);

  // Crée les tags manquants
  for (const tag of tags) {
    if (!existingNames.includes(tag)) {
      const [result] = await connection.query("INSERT INTO tags (name) VALUES (?)", [tag]);
      tagIds.push(result.insertId);
    }
  }
  return tagIds;
};

/**
 * Remplace les associations tags-posts pour un post donné.
 * @param {Object} connection - Connexion MySQL active.
 * @param {number} postId - Identifiant du post.
 * @param {Array<number>} tagIds - Liste des IDs de tags à associer.
 * @returns {Promise<void>}
 */
const replacePostTags = async (connection, postId, tagIds) => {
  // Supprime les anciennes associations
  await connection.query("DELETE FROM tags_posts WHERE postId = ?", [postId]);
  // Ajoute les nouvelles associations
  for (const tagId of tagIds) {
    await connection.query("INSERT INTO tags_posts (tagId, postId) VALUES (?, ?)", [tagId, postId]);
  }
};

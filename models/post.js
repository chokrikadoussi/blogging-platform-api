const db = require("../utils/db");

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
  const [rows] = await db.promise().query(query, params);

  return rows.map((row) => ({
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : row.tags ? JSON.parse(row.tags) : [],
  }));
};

const findById = async (id) => {
  const query =
    "SELECT p.id, title, content, category, json_arrayagg(t.name) as tags, createdAt, updatedAt\n" +
    "FROM posts p\n" +
    "LEFT JOIN tags_posts tp ON tp.postId = p.id\n" +
    "LEFT JOIN tags t ON tp.tagId = t.id\n" +
    "WHERE p.id = ?\n" +
    "GROUP BY p.id, p.title, p.content, p.category, p.createdAt, p.updatedAt;"

  const [rows] = await db.promise().query(query, [id]);
  const post = rows[0];
  if (!post) return null;
  return {...post, tags: post.tags ? JSON.parse(post.tags) : []};
}

// TODO
const create = async (payload) => {}

const deleteById = async (id) => {
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM tags_posts WHERE postId = ?", [id]);
    const [result] = await connection.query("DELETE FROM posts WHERE id = ?", [id]);
    await connection.commit();
    return result.affectedRows > 0;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// TODO
const updatePost = async (id, payload) => {
  const qry = "UPDATE posts SET title = ?, content = ?, category = ? WHERE id = ?";

}

module.exports = {
  findAll,
  findById,
  create,
  deleteById,
  updatePost,
};

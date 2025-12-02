const postRouter = require("express").Router();
const con = require("../utils/db");
const postController = require("../models/post");

postRouter.get('/', (req, res) => {
  return res.status(200).send('Hello World!');
})

postRouter.get('/posts', (req, res) => {
  const term = req.query.term;
  const params = term ? "WHERE title LIKE '%" + term + "%' OR content LIKE '%" + term + "%' OR category LIKE '%" + term + "%'\n" : "";
  const qry = "SELECT p.id, title, content, category, json_arrayagg(t.name) as tags, createdAt, updatedAt\n" +
    "FROM posts p\n" +
    "LEFT JOIN tags_posts tp ON tp.postId = p.id\n" +
    "LEFT JOIN tags t ON tp.tagId = t.id\n" +
    params +
    "GROUP BY p.id, p.title, p.content, p.category, p.createdAt, p.updatedAt;"
  con.query(qry, (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }

    return res.status(200).send(result);
  })
})

postRouter.post('/posts', (req, res) => {
  if (!req.body.title || !req.body.content || !req.body.category || !req.body.tags) {
    return res.status(400).send({"message": "Please enter fields : title, content, category and tags"});
  }
/*
  const qryPost = "INSERT INTO posts (title, content, category) VALUES (?, ?, ?)";
  // const qryTag = "INSERT INTO tags (name) VALUES (?)";
  const {title, content, category} = req.body;
  let newId = "";

  con.query(qryPost, [title, content, category], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    newId = result.insertId;
    return res.status(200).send({newId});
  })
*/
  /*
  con.query("SELECT * FROM posts WHERE id = ?", [newId], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    return res.status(200).send(result);
  })
   */

  postController.create(req.body).then(
    result => {
      return res.status(200).json(result);
    }
  );


})

postRouter.put('/posts/:id', (req, res) => {
  const qry = "UPDATE posts SET title = ?, content = ?, category = ? WHERE id = ?";
  const {title, content, category} = req.body;
  con.query(qry, [title, content, category, req.params.id], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    return res.status(200).send({"message": "Post successfully updated!"});
  })
})

postRouter.delete('/posts/:id', (req, res) => {
  const qry = "DELETE FROM posts WHERE id = ?";
  con.query(qry, [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    return res.status(200).send({"message": "Post successfully deleted!"});
  })
})

postRouter.get('/posts/:id', (req, res) => {
  const qry = "SELECT p.id, title, content, category, json_arrayagg(t.name) as tags, createdAt, updatedAt\n" +
    "FROM posts p\n" +
    "LEFT JOIN tags_posts tp ON tp.postId = p.id\n" +
    "LEFT JOIN tags t ON tp.tagId = t.id\n" +
    "WHERE p.id = ?\n" +
    "GROUP BY p.id, p.title, p.content, p.category, p.createdAt, p.updatedAt;"

  con.query(qry, [req.params.id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(404).send({"message": "Could not find post"});
    }

    return res.status(200).send(result);
  })
})

module.exports = postRouter;
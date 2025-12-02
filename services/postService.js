const postRouter = require("express").Router();
const postModel = require("../models/post");
const validatePost = require("../middlewares/validatePost");

postRouter.get('/', (req, res) => {
  return res.status(200).send('Hello World!');
})

postRouter.get('/posts', async (req, res) => {
  const term = req.query.term ?? null;
  try {
    const posts = await postModel.findAll(term);
    if (posts) {
      return res.status(200).send(posts);
    }
    return res.status(404).send({"message": "No posts found."});
  } catch (error) {
    console.error(error);
    return res.status(500).send({"message": "An error occurred while retrieving posts."});
  }
})

postRouter.post('/posts', validatePost, async (req, res) => {
  try {
    const post = await postModel.create(req.body);
    return res.status(200).json(post);
  } catch (error) {
    console.error(error);
    return res.status(500).send({"message": "An error occurred while creating the post."});
  }
});

postRouter.put('/posts/:id', validatePost, async (req, res) => {
  const id = req.params.id;
  const {title, content, category, tags} = req.body;


  try {
    const updatedPost = await postModel.updatePost(id, {title, content, category, tags});
    if (!updatedPost) {
      return res.status(404).send({"message": "Post not found"});
    }
    return res.status(200).json(updatedPost);

  } catch (error) {
    console.error(error);
    return res.status(500).send({"message": "An error occurred while updating the post."});
  }
})

postRouter.delete('/posts/:id', async (req, res) => {
  const id = req.params.id;
  const isDeleted = await postModel.deleteById(id);
  if (!isDeleted) {
    return res.status(404).send({"message": "Post not found"});
  }
  return res.status(204);
})

postRouter.get('/posts/:id', async (req, res) => {
  const id = req.params.id;
  const post = await postModel.findById(id);

  if (!post) {
    return res.status(404).send({"message": "Post not found"});
  }
  return res.status(200).json(post);
})

module.exports = postRouter;
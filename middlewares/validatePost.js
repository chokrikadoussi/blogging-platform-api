/**
 * Middleware de validation pour les données d'un post.
 * Vérifie la présence des champs obligatoires et le format des tags.
 */
module.exports = function validatePost(req, res, next) {
  const { title, content, category, tags } = req.body;

  if (!title || !content || !category) {
    return res.status(400).send({ message: "Please enter fields : title, content and category" });
  }

  if (!tags || !Array.isArray(tags)) {
    return res.status(400).send({ message: "Tags must be an array" });
  }

  next();
};


const express = require('express');

/**
 * Java equivalent: CommentController
 * Base mapping: /api/comments
 */
function CommentController(commentService) {
  const router = express.Router();

  async function addComment(req, res, next) {
    try {
      const reqBody = req.body;

      if (reqBody.rating != null && (reqBody.rating < 1 || reqBody.rating > 5)) {
        return res.status(400).send('rating must be between 1 and 5');
      }

      const comment = {};
      comment.text = reqBody.text;
      comment.rating = reqBody.rating;
      comment.userEmail = reqBody.authorEmail;

      const saved = await commentService.addComment(comment, reqBody.sportId);
      return res.status(200).json(saved);
    } catch (err) {
      return next(err);
    }
  }

  async function getCommentsForSport(req, res, next) {
    try {
      const sportId = req.params.sportId != null ? Number(req.params.sportId) : undefined;
      const result = await commentService.getCommentsForSport(sportId);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  // Mirrors the Spring annotations exactly
  router.post('/api/comments', addComment);
  router.get('/api/comments/sport/:sportId', getCommentsForSport);

  return router;
}

module.exports = CommentController;

const CommentController = require('../controllers/CommentController');

function commentRoutes(deps) {
  return CommentController(deps.commentService);
}

module.exports = commentRoutes;

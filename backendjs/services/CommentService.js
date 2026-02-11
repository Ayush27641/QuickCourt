function CommentService(commentRepository, sportRepository, venueRepository, userRepository, sportService) {
  void venueRepository;
  void userRepository;
  void sportService;

  async function addComment(comment, sportId) {
    if (sportId != null) {
      if (comment.setSportId) comment.setSportId(sportId);
      else comment.sportId = sportId;
    }

    const newComment = await commentRepository.save(comment);

    const opt = await sportRepository.findById(sportId);
    const sport = opt?.orElse ? opt.orElse(null) : opt;

    if (sport != null) {
      const commentIds = sport.commentIds ?? sport.getCommentIds?.();
      const newId = newComment.id ?? newComment.getId?.();

      if (Array.isArray(commentIds)) {
        commentIds.push(newId);
        if (sport.setCommentIds) sport.setCommentIds(commentIds);
        else sport.commentIds = commentIds;
      } else if (commentIds?.add) {
        commentIds.add(newId);
      } else {
        sport.commentIds = [newId];
      }

      const size = (sport.commentIds ?? sport.getCommentIds?.() ?? []).length;
      let rating = sport.averageRating ?? sport.getAverageRating?.() ?? 0;
      rating *= size - 1;
      rating += comment.rating ?? comment.getRating?.();
      rating /= size;

      if (sport.setAverageRating) sport.setAverageRating(rating);
      else sport.averageRating = rating;

      await sportRepository.save(sport);
    }

    return newComment;
  }

  async function getCommentsForSport(sportId) {
    return await commentRepository.findBySportId(sportId);
  }

  return {
    addComment,
    getCommentsForSport,
  };
}

module.exports = CommentService;

function CommentRepository(prisma) {
  async function save(comment) {
    const id = comment.id ?? comment.getId?.();

    const data = {
      text: comment.text ?? comment.getText?.(),
      upvotes: comment.upvotes ?? comment.getUpvotes?.() ?? 0,
      downvotes: comment.downvotes ?? comment.getDownvotes?.() ?? 0,
      userEmail: comment.userEmail ?? comment.UserEmail ?? comment.getUserEmail?.() ?? null,
      sportId: comment.sportId ?? comment.getSportId?.() ?? null,
      rating: comment.rating ?? comment.getRating?.() ?? null,
      createdAt: comment.createdAt ?? comment.getCreatedAt?.() ?? undefined,
    };

    if (id == null) {
      return await prisma.comment.create({ data });
    }

    return await prisma.comment.update({ where: { id: Number(id) }, data });
  }

  async function findBySportId(sportId) {
    return await prisma.comment.findMany({ where: { sportId: Number(sportId) }, orderBy: { createdAt: 'desc' } });
  }

  return { save, findBySportId };
}

module.exports = CommentRepository;

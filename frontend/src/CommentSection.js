import "./styles/Threads.css";

export default function CommentSection({
                                           comments,
                                           user,
                                           newComment,
                                           setNewComment,
                                           onSubmit,
                                           onDelete,
                                           refreshComments
                                       }) {
    const role = String(user?.role || "").toUpperCase();
    const isAdmin = role === "ADMIN";
    const list = Array.isArray(comments) ? comments : [];

    async function toggleLike(comment) {
        if (!user) return;

        const hasLiked = comment.reactions?.myReaction === "LIKE";
        const url = `http://localhost:8080/api/comments/${comment.id}/reactions?username=${user.username}`;

        try {
            if (hasLiked) {
                await fetch(url, { method: "DELETE" });
            } else {
                await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reactionType: "LIKE" })
                });
            }

            if (typeof refreshComments === "function") {
                refreshComments();
            }
        } catch (err) {
            console.error("Failed to toggle reaction", err);
        }
    }

    return (
        <div className="comments-card">
            <h3>Comments</h3>

            {list.length === 0 && <p>No comments yet.</p>}

            <ul className="comment-list">
                {list.map(c => {
                    const canDelete =
                        user && (isAdmin || user.username === c.username);

                    return (
                        <li key={c.id} className="comment-item">
                            <div className="comment-header">
                                <div className="comment-meta">
                                    <strong>{c.username}</strong>
                                </div>
                                <span className="comment-time">
                                    {c.createdAt &&
                                        new Date(c.createdAt).toLocaleString()}
                                </span>
                            </div>

                            <div className="comment-body">
                                <div className="comment-text">
                                    {c.comment}
                                </div>

                                <div className="comment-actions">
                                    <button
                                        className={
                                            c.reactions?.myReaction === "LIKE"
                                                ? "reaction-btn active"
                                                : "reaction-btn"
                                        }
                                        onClick={() => toggleLike(c)}
                                        disabled={!user}
                                        title={
                                            user
                                                ? "Like comment"
                                                : "Log in to react"
                                        }
                                    >
                                        👍 {c.reactions?.counts?.LIKE || 0}
                                    </button>

                                    {canDelete && (
                                        <button
                                            className="delete-btn"
                                            onClick={() => onDelete(c.id)}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>

            <form onSubmit={onSubmit} className="comment-form">
                <textarea
                    className="textarea"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    disabled={!user}
                    placeholder={
                        user ? "Write a comment…" : "Log in to comment"
                    }
                />
                <button
                    className="submit-btn"
                    type="submit"
                    disabled={!user || !newComment.trim()}
                >
                    Post Comment
                </button>
            </form>
        </div>
    );
}

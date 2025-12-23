import "./styles/Threads.css";

export default function CommentSection({
                                           comments,
                                           user,
                                           newComment,
                                           setNewComment,
                                           onSubmit,
                                           onDelete
                                       }) {
    const role = String(user?.role || "").toUpperCase();
    const isAdmin = role === "ADMIN";
    const list = Array.isArray(comments) ? comments : [];

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
                                        {c.createdAt && new Date(c.createdAt).toLocaleString()}
                                </span>

                            </div>

                            <div className="comment-body">
                                <div>{c.comment}</div>
                                {canDelete && (
                                    <button
                                        className="delete-btn"
                                        onClick={() => onDelete(c.id)}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>

                            <div className="comment-body">
                                <div>{c.comment}</div>
                                {canDelete && (
                                    <button
                                        className="delete-btn"
                                        onClick={() => onDelete(c.id)}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>

                        </li>
                    );
                })}
            </ul>

            <form onSubmit={onSubmit} className="comment-form">
                <textarea className={"textarea"}
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          disabled={!user}
                          placeholder={user ? "Write a comment…" : "Log in to comment"}
                />
                <button className={"submit-btn"}
                        type="submit"
                    disabled={!user || !newComment.trim()}
                >
                    Post Comment
                </button>
            </form>
        </div>
    );
}

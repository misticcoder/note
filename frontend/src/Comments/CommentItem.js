import { useState } from "react";

export default function CommentItem({
                                        comment,
                                        user,
                                        isAdmin,
                                        onDelete,
                                        toggleReaction,
                                        onReply
                                    }) {
    const canDelete =
        user && (isAdmin || user.username === comment.username);

    const [collapsed, setCollapsed] = useState(true);
    const hasReplies = comment.replies.length > 0;

    return (
        <li className="comment-item">
            <div className="comment-row">
                {/* Avatar */}
                <div className="comment-avatar">
                    {comment.username[0].toUpperCase()}
                </div>

                {/* Main content */}
                <div className="comment-content">
                    <div className="comment-meta">
                <span className="comment-username">
                    @{comment.username}
                </span>
                        <span className="comment-time">
                    {new Date(comment.createdAt).toLocaleString()}
                </span>
                    </div>

                    <div className="comment-text">
                        {comment.comment}
                    </div>

                    <div className="comment-actions">
                        <button
                            className={
                                comment.reactions?.myReaction === "LIKE"
                                    ? "reaction-btn active"
                                    : "reaction-btn"
                            }
                            onClick={() => toggleReaction(comment, "LIKE")}
                        >
                            👍 {comment.reactions?.counts?.LIKE || 0}
                        </button>

                        <button
                            className={
                                comment.reactions?.myReaction === "DISLIKE"
                                    ? "reaction-btn active"
                                    : "reaction-btn"
                            }
                            onClick={() => toggleReaction(comment, "DISLIKE")}
                        >
                            👎
                        </button>

                        <button
                            className="reply-btn"
                            onClick={() => onReply(comment.id)}
                        >
                            Reply
                        </button>
                    </div>

                    {/* Replies toggle */}
                    {comment.replies.length > 0 && (
                        <button
                            className="toggle-replies-btn"
                            onClick={() => setCollapsed(v => !v)}
                        >
                            {collapsed
                                ? `${comment.replies.length} replies`
                                : "Hide replies"}
                        </button>
                    )}
                </div>
            </div>

            {/* Replies */}
            {!collapsed && comment.replies.length > 0 && (
                <ul className="reply-list">
                    {comment.replies.map(r => (
                        <CommentItem
                            key={r.id}
                            comment={r}
                            user={user}
                            isAdmin={isAdmin}
                            onDelete={onDelete}
                            toggleReaction={toggleReaction}
                            onReply={onReply}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

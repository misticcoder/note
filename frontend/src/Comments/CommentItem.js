import { useState, useEffect } from "react";
import { timeAgo } from "../components/timeAgo";
import "../styles/comments.css";

export default function CommentItem({
                                        comment,
                                        user,
                                        isAdmin,
                                        onDelete,
                                        toggleReaction,
                                        onReply,
                                        highlightedId // 🔑 NEW
                                    }) {
    const [showReplies, setShowReplies] = useState(false);

    const canDelete =
        user && (isAdmin || user.username === comment.username);

    const replies = comment.replies || [];
    const replyCount = replies.length;

    const myReaction = comment.myReaction;
    const counts = comment.reactionCounts || {};

    const isHighlighted = comment.id === highlightedId;
    useEffect(() => {
        if (highlightedId && replies.some(r => r.id === highlightedId)) {
            setShowReplies(true);
        }
    }, [highlightedId, replies]);

    return (
        <li
            id={`comment-${comment.id}`} // 🔑 REQUIRED for scrolling
            className={`yt-comment ${isHighlighted ? "highlight" : ""}`}
        >
            <div className="yt-avatar">
                {comment.username[0].toUpperCase()}
            </div>

            <div className="yt-main">
                <div className="yt-header">
                    <span className="yt-username">@{comment.username}</span>
                    <span className="yt-time">
                        · {timeAgo(comment.createdAt)}
                    </span>
                </div>

                <div className="yt-text">{comment.comment}</div>

                {/* ===================== ACTIONS ===================== */}
                <div className="yt-actions">
                    <button
                        className={`reaction-btn ${myReaction === "LIKE" ? "active" : ""}`}
                        onClick={() => toggleReaction(comment, "LIKE")}
                    >
                        👍 {counts.LIKE || 0}
                    </button>

                    <button
                        className={`reaction-btn ${myReaction === "DISLIKE" ? "active" : ""}`}
                        onClick={() => toggleReaction(comment, "DISLIKE")}
                    >
                        👎 {counts.DISLIKE || 0}
                    </button>

                    <button onClick={() => onReply(comment.id)}>Reply</button>

                    {canDelete && (
                        <button
                            className="yt-delete"
                            onClick={() => onDelete(comment.id)}
                        >
                            Delete
                        </button>
                    )}
                </div>

                {replyCount > 0 && (
                    <button
                        className="yt-toggle"
                        onClick={() => setShowReplies(!showReplies)}
                    >
                        {showReplies
                            ? "Hide replies"
                            : `View ${replyCount} repl${replyCount > 1 ? "ies" : "y"}`}
                    </button>
                )}

                {showReplies && (
                    <ul className="yt-replies">
                        {replies.map(r => (
                            <CommentItem
                                key={r.id}
                                comment={r}
                                user={user}
                                isAdmin={isAdmin}
                                onDelete={onDelete}
                                toggleReaction={toggleReaction}
                                onReply={onReply}
                                highlightedId={highlightedId} // 🔁 PASS DOWN
                            />
                        ))}
                    </ul>
                )}
            </div>
        </li>
    );
}

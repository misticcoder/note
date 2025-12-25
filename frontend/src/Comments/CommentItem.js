// src/Comments/CommentItem.js
import { useState } from "react";
import {timeAgo} from "../components/timeAgo";

export default function CommentItem({
                                        comment,
                                        user,
                                        isAdmin,
                                        onDelete,
                                        toggleReaction,
                                        onReply
                                    }) {
    const [showReplies, setShowReplies] = useState(false);

    const canDelete =
        user && (isAdmin || user.username === comment.username);

    const replies = comment.replies || [];
    const replyCount = replies.length;

    return (
        <li className="yt-comment">
            {/* Avatar */}
            <div className="yt-avatar">
                {comment.username[0].toUpperCase()}
            </div>

            {/* Main */}
            <div className="yt-main">
                {/* Header */}
                <div className="yt-header">
                    <span className="yt-username">@{comment.username}</span>
                    <span className="yt-time">
                        · {timeAgo(comment.published)}
                    </span>

                </div>

                {/* Body */}
                <div className="yt-text">
                    {comment.comment}
                </div>

                {/* Actions */}
                <div className="yt-actions">
                    <button onClick={() => toggleReaction(comment, "LIKE")}>
                        👍 {comment.reactions?.counts?.LIKE || 0}
                    </button>
                    <button onClick={() => toggleReaction(comment, "DISLIKE")}>
                        👎
                    </button>
                    <button onClick={() => onReply(comment.id)}>
                        Reply
                    </button>

                    {canDelete && (
                        <button
                            className="yt-delete"
                            onClick={() => onDelete(comment.id)}
                        >
                            Delete
                        </button>
                    )}
                </div>

                {/* Replies toggle */}
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

                {/* Replies */}
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
                            />
                        ))}
                    </ul>
                )}
            </div>
        </li>
    );
}
